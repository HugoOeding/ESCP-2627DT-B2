import { useState } from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithApp } from '../test/utils';
import { Overlay } from './Overlay';

function Demo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <Overlay title="Monthly budget" open={open} onClose={() => setOpen(false)}>
        <input aria-label="Limit" />
        <button type="button">Save</button>
      </Overlay>
    </>
  );
}

describe('Overlay', () => {
  it('is a labelled modal dialog that traps focus', async () => {
    const { user } = renderWithApp(<Demo />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    const dialog = screen.getByRole('dialog', { name: 'Monthly budget' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(document.body.style.overflow).toBe('hidden');
    const close = screen.getByRole('button', { name: 'Close' });
    expect(close).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText('Limit')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
  });
  it('closes on Esc and returns focus to the trigger', async () => {
    const { user } = renderWithApp(<Demo />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();
    expect(document.body.style.overflow).toBe('');
  });
  it('closes on backdrop click', async () => {
    const { user } = renderWithApp(<Demo />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(screen.getByTestId('overlay-backdrop'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
