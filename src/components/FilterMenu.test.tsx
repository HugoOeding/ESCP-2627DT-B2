import { useState } from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithApp } from '../test/utils';
import { FilterMenu } from './FilterMenu';

function Demo() {
  const [value, setValue] = useState('everyone');
  return (
    <>
      <FilterMenu
        value={value}
        onChange={setValue}
        options={[
          { value: 'everyone', label: 'Everyone' },
          { value: 'me', label: 'Me' },
          { value: 'max', label: 'Max' },
        ]}
      />
      <p>Outside</p>
    </>
  );
}

describe('FilterMenu', () => {
  it('opens a menu, moves with arrows and selects', async () => {
    const { user } = renderWithApp(<Demo />);
    const chip = screen.getByRole('button', { name: 'Show subscriptions for: Everyone' });
    await user.click(chip);
    expect(screen.getByRole('menuitemradio', { name: 'Everyone' })).toHaveFocus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(screen.getByRole('menuitemradio', { name: 'Max' })).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitemradio', { name: 'Everyone' })).toHaveFocus();
    await user.keyboard('{ArrowUp}{Enter}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(screen.getByRole('button', { name: 'Show subscriptions for: Max' })).toHaveFocus();
  });
  it('closes on Esc, Tab and outside clicks', async () => {
    const { user } = renderWithApp(<Demo />);
    await user.click(screen.getByRole('button', { name: /Everyone/ }));
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    await user.click(screen.getByRole('button', { name: /Everyone/ }));
    await user.click(screen.getByText('Outside'));
    expect(screen.queryByRole('menu')).toBeNull();
    await user.click(screen.getByRole('button', { name: /Everyone/ }));
    await user.tab();
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
