import { useState } from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithApp } from '../test/utils';
import { Toggle } from './Toggle';

function Demo() {
  const [on, setOn] = useState(false);
  return (
    <>
      <Toggle label="Free trial" description="Reminder before it is paid" checked={on} onChange={setOn} controls="trial-fields" />
      {on && <div id="trial-fields" />}
    </>
  );
}

describe('Toggle', () => {
  it('is a labelled switch', async () => {
    const { user } = renderWithApp(<Demo />);
    const sw = screen.getByRole('switch', { name: 'Free trial' });
    expect(sw).toHaveAccessibleDescription('Reminder before it is paid');
    expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(sw).not.toHaveAttribute('aria-controls');
    await user.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'true');
    expect(sw).toHaveAttribute('aria-controls', 'trial-fields');
  });
});
