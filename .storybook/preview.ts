import { createElement } from 'react';
import type { Decorator, Preview } from '@storybook/react';
import { withThemeByClassName } from '@storybook/addon-themes';
import { MemoryRouter } from 'react-router-dom';
import { resetStore, seedState } from '../src/store/useStore';
import { routerFuture } from '../src/routerFuture';
import '../src/index.css';

/** Every story starts from Lena's seed data inside a router, in a 390 px wide column. */
const withAppContext: Decorator = (Story, context) => {
  resetStore(seedState());
  const route = (context.parameters.route as string | undefined) ?? '/';
  return createElement(
    MemoryRouter,
    { initialEntries: [route], future: routerFuture },
    createElement('div', { className: 'mx-auto w-full max-w-[390px] bg-bg p-4 text-text' }, createElement(Story)),
  );
};

const preview: Preview = {
  decorators: [
    withAppContext,
    withThemeByClassName({ themes: { light: '', dark: 'dark' }, defaultTheme: 'light', parentSelector: 'html' }),
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { element: '#storybook-root' },
  },
};

export default preview;
