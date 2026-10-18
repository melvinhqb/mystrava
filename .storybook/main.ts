import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: '@storybook/react-vite',
  // Les stories utilisent les données de démo : ne pas publier public/data.json avec Storybook.
  viteFinal: (config) => ({ ...config, publicDir: false }),
};

export default config;
