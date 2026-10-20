import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { moveItem } from '../lib/layoutEditing';

/** Éléments qui gardent leur propre comportement : un appui dessus ne saisit pas la tuile. */
const NO_DRAG = 'button, a, input, select, textarea, label, .map';
/** Distance parcourue à la souris avant de saisir la tuile (px), pour laisser passer les clics. */
const MOUSE_THRESHOLD = 4;
/** Au doigt, la tuile se saisit par un appui maintenu (ms) ; bouger avant, c'est faire défiler la page. */
const TOUCH_DELAY = 250;
const TOUCH_TOLERANCE = 10;
/** Bande au bord de la fenêtre (px) où la page défile toute seule pendant le déplacement. */
const EDGE = 64;
const REFLOW = { duration: 260, easing: 'cubic-bezier(.2, .8, .2, 1)' };
/**
 * Inclinaison de la tuile saisie selon sa vitesse horizontale : `TILT_PER_SPEED` degrés par px/ms
 * tant qu'elle va lentement, sans jamais dépasser `MAX_TILT` degrés (moins pour les tuiles larges).
 */
const TILT_PER_SPEED = 6;
const MAX_TILT = 10;
/** Part du retard rattrapée à chaque image, pour lisser les à-coups du pointeur. */
const TILT_EASE = 0.2;
/** Sans mouvement depuis ce délai (ms), la vitesse retombe et la tuile se redresse. */
const IDLE = 50;

/** Déplacement en cours : la tuile `key`, partie de l'indice `from`, occupe provisoirement l'indice `to`. */
export interface Reorder {
  key: string;
  from: number;
  to: number;
}

interface Session {
  key: string;
  from: number;
  to: number;
  active: boolean;
  /** Pointeur, et point de saisie dans la tuile (coordonnées de la fenêtre). */
  x: number;
  y: number;
  grabX: number;
  grabY: number;
  /** Dernière tuile survolée, pour ne réagir qu'en entrant sur une nouvelle. */
  hovered: string | null;
  /** Vitesse horizontale lissée (px/ms), mesurée entre deux mouvements du pointeur, et le dernier d'entre eux. */
  speed: number;
  lastX: number;
  lastT: number;
  /** Inclinaison courante (degrés). */
  tilt: number;
  /** Retire les écouteurs, sans toucher à l'état. */
  stop: () => void;
  /** Abandonne le déplacement : la tuile revient à sa place. */
  cancel: () => void;
}

const tilesIn = (box: HTMLElement) => [...box.querySelectorAll<HTMLElement>(':scope > [data-block]')];
const tileIn = (box: HTMLElement, key: string) => tilesIn(box).find((el) => el.dataset.block === key) ?? null;
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Penche la tuile saisie du côté où elle va, d'autant plus qu'elle va vite ; elle se redresse à l'arrêt. */
function tilt(box: HTMLElement, s: Session, now: number) {
  const el = tileIn(box, s.key);
  if (now - s.lastT > IDLE) s.speed *= 0.8;
  if (!el || reducedMotion()) return;
  // Proportionnelle à la vitesse au départ, puis plafonnée en douceur : la tuile ne se retourne jamais.
  const max = MAX_TILT * Math.min(1, 300 / el.offsetWidth);
  const target = max * Math.tanh((s.speed * TILT_PER_SPEED) / max);
  s.tilt += (target - s.tilt) * TILT_EASE;
  if (Math.abs(s.tilt) < 0.01) s.tilt = 0;
  el.style.rotate = s.tilt ? `${s.tilt.toFixed(2)}deg` : '';
}

/** Fait suivre le pointeur à la tuile saisie, depuis son emplacement provisoire dans la grille. */
function follow(box: HTMLElement, s: Session) {
  const el = tileIn(box, s.key);
  if (!el) return;
  const origin = box.getBoundingClientRect();
  el.style.translate = `${s.x - s.grabX - origin.left - el.offsetLeft}px ${s.y - s.grabY - origin.top - el.offsetTop}px`;
}

/**
 * Tuile de la grille sous le pointeur, hors tuile saisie. Les positions viennent de la mise en page
 * (offsetLeft…), pas de l'écran : les tuiles en train de glisser vers leur place comptent déjà à leur arrivée.
 */
function hovered(box: HTMLElement, s: Session): string | null {
  const origin = box.getBoundingClientRect();
  const x = s.x - origin.left;
  const y = s.y - origin.top;
  const hit = tilesIn(box).find(
    (el) =>
      el.dataset.block !== s.key &&
      x >= el.offsetLeft && x < el.offsetLeft + el.offsetWidth &&
      y >= el.offsetTop && y < el.offsetTop + el.offsetHeight,
  );
  return hit?.dataset.block ?? null;
}

/**
 * Réorganisation des tuiles au pointeur, comme sur un écran d'accueil de téléphone : la tuile saisie
 * suit le doigt et, dès qu'elle passe sur une autre, prend sa place ; les autres glissent pour lui faire de la place.
 *
 * Les tuiles de `container` sont repérées par leur attribut `data-block` (la clé de `keys`).
 * Pendant le déplacement, l'ordre à afficher est `moveItem(keys, reorder.from, reorder.to)` ;
 * au lâcher, `onMove(from, to)` est appelé. Échap annule.
 */
export function useTileReorder(
  container: RefObject<HTMLElement | null>,
  keys: readonly string[],
  onMove: (from: number, to: number) => void,
  enabled: boolean,
) {
  const [reorder, setReorder] = useState<Reorder | null>(null);
  const session = useRef<Session | null>(null);
  /** Tuile tout juste lâchée, sa position à l'écran et son inclinaison, pour l'animer jusqu'à sa place. */
  const dropped = useRef<{ key: string; x: number; y: number; tilt: number } | null>(null);
  const positions = useRef(new Map<string, { x: number; y: number }>());
  const latest = useRef({ keys, onMove });
  useLayoutEffect(() => {
    latest.current = { keys, onMove };
  });

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>, index: number) => {
      const box = container.current;
      const key = e.currentTarget.dataset.block;
      if (!box || !key || session.current || !e.isPrimary || e.button !== 0) return;
      if (e.target instanceof Element && e.target.closest(NO_DRAG)) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const touch = e.pointerType !== 'mouse';
      const start = { x: e.clientX, y: e.clientY };
      let timer = 0;
      let frame = 0;

      const update = () => {
        const target = hovered(box, s);
        if (target !== s.hovered) {
          s.hovered = target;
          const to = target === null ? -1 : moveItem(latest.current.keys, s.from, s.to).indexOf(target);
          if (to >= 0 && to !== s.to) {
            s.to = to;
            setReorder({ key: s.key, from: s.from, to });
          }
        }
        follow(box, s);
      };

      // À chaque image : inclinaison selon la vitesse, et défilement automatique près des bords.
      const tick = (now: number) => {
        tilt(box, s, now);
        const dy = s.y < EDGE ? s.y - EDGE : s.y > innerHeight - EDGE ? s.y - innerHeight + EDGE : 0;
        if (dy) {
          window.scrollBy(0, dy / 4);
          update();
        }
        frame = requestAnimationFrame(tick);
      };

      const activate = () => {
        s.active = true;
        if (touch) navigator.vibrate?.(8);
        setReorder({ key, from: index, to: index });
        follow(box, s);
        frame = requestAnimationFrame(tick);
      };

      const end = (commit: boolean) => {
        s.stop();
        session.current = null;
        if (!s.active) return;
        dropped.current = { key: s.key, x: s.x - s.grabX, y: s.y - s.grabY, tilt: s.tilt };
        setReorder(null);
        if (commit && s.to !== s.from) latest.current.onMove(s.from, s.to);
      };

      const onMove = (ev: PointerEvent) => {
        if (!ev.isPrimary) return;
        const dt = ev.timeStamp - s.lastT;
        if (dt > 0) s.speed = (s.speed + (ev.clientX - s.lastX) / dt) / 2;
        s.lastX = s.x = ev.clientX;
        s.lastT = ev.timeStamp;
        s.y = ev.clientY;
        if (!s.active) {
          const dist = Math.hypot(s.x - start.x, s.y - start.y);
          if (touch) {
            if (dist > TOUCH_TOLERANCE) end(false);
            return;
          }
          if (dist < MOUSE_THRESHOLD) return;
          activate();
        }
        update();
      };
      const onUp = (ev: PointerEvent) => ev.isPrimary && end(true);
      const onCancel = (ev: PointerEvent) => ev.isPrimary && end(false);
      const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && end(false);
      // Une fois la tuile saisie au doigt, le geste la déplace au lieu de faire défiler la page.
      const onTouchMove = (ev: TouchEvent) => s.active && ev.cancelable && ev.preventDefault();
      // Évite le menu contextuel de l'appui long.
      const onMenu = (ev: Event) => ev.preventDefault();

      const s: Session = {
        key,
        from: index,
        to: index,
        active: false,
        x: e.clientX,
        y: e.clientY,
        grabX: e.clientX - rect.left,
        grabY: e.clientY - rect.top,
        hovered: null,
        speed: 0,
        lastX: e.clientX,
        lastT: e.timeStamp,
        tilt: 0,
        cancel: () => end(false),
        stop: () => {
          clearTimeout(timer);
          cancelAnimationFrame(frame);
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
          window.removeEventListener('pointercancel', onCancel);
          window.removeEventListener('keydown', onKey);
          window.removeEventListener('touchmove', onTouchMove);
          window.removeEventListener('contextmenu', onMenu);
        },
      };
      session.current = s;
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
      window.addEventListener('keydown', onKey);
      if (touch) {
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('contextmenu', onMenu);
        timer = window.setTimeout(activate, TOUCH_DELAY);
      }
    },
    [container],
  );

  // Sortie du mode édition (ou démontage) pendant un déplacement : on l'abandonne.
  useEffect(() => {
    if (!enabled) session.current?.cancel();
  }, [enabled]);
  useEffect(() => () => session.current?.stop(), []);

  // Après chaque rendu : la tuile saisie se recale sur son nouvel emplacement, celle tout juste lâchée
  // rejoint le sien, et les autres glissent depuis leur ancienne position (technique FLIP).
  useLayoutEffect(() => {
    const box = container.current;
    const seen = positions.current;
    if (!box || !enabled) {
      seen.clear();
      return;
    }
    const animate = !reducedMotion();
    const s = session.current;
    if (s?.active) follow(box, s);

    const drop = dropped.current;
    dropped.current = null;
    if (drop) {
      const el = tileIn(box, drop.key);
      if (el) {
        el.style.translate = '';
        el.style.rotate = '';
        const origin = box.getBoundingClientRect();
        const dx = drop.x - origin.left - el.offsetLeft;
        const dy = drop.y - origin.top - el.offsetTop;
        if (animate) {
          el.animate(
            [{ translate: `${dx}px ${dy}px`, rotate: `${drop.tilt}deg` }, { translate: '0px 0px', rotate: '0deg' }],
            REFLOW,
          );
        }
      }
    }

    for (const el of tilesIn(box)) {
      const key = el.dataset.block!;
      const prev = seen.get(key);
      const pos = { x: el.offsetLeft, y: el.offsetTop };
      seen.set(key, pos);
      if (!animate || !prev || (s?.active && key === s.key)) continue;
      const dx = prev.x - pos.x;
      const dy = prev.y - pos.y;
      if (!dx && !dy) continue;
      // Une tuile déjà en route repart de là où elle se trouve à l'écran.
      const current = new DOMMatrix(getComputedStyle(el).transform);
      for (const a of el.getAnimations()) if (a.id === 'reflow') a.cancel();
      el.animate(
        [{ transform: `translate(${dx + current.m41}px, ${dy + current.m42}px)` }, { transform: 'none' }],
        { ...REFLOW, id: 'reflow' },
      );
    }
  });

  return { reorder, onPointerDown };
}
