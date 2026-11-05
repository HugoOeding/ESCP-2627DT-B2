import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y', '@storybook/addon-themes'],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
  docs: { autodocs: false },
  // Storybook's own vendor chunks (axe-core, docs renderer) exceed Vite's default 500 kB hint.
  viteFinal: async (viteConfig) => ({
    ...viteConfig,
    build: { ...viteConfig.build, chunkSizeWarningLimit: 1200 },
  }),
};

export default config;
