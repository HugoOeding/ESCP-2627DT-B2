import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import type { PersistedState } from '../types';
import { resetStore, seedState } from '../store/useStore';
import { routerFuture } from '../routerFuture';

export function renderWithApp(ui: ReactElement, { route = '/', state }: { route?: string; state?: PersistedState } = {}) {
  resetStore(state ?? seedState());
  const user = userEvent.setup();
  return { user, ...render(
      <MemoryRouter initialEntries={[route]} future={routerFuture}>
        {ui}
      </MemoryRouter>,
    ) };
}
