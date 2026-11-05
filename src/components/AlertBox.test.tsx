import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithApp } from '../test/utils';
import { storyAlerts } from '../stories/fixtures';
import { AlertBox } from './AlertBox';

describe('AlertBox', () => {
  it('shows 3 alerts and toggles the rest in place', async () => {
    const { user } = renderWithApp(<AlertBox alerts={storyAlerts} />);
    const list = screen.getByRole('list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    const toggle = screen.getByRole('button', { name: 'Show all (6)' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(within(list).getAllByRole('listitem')).toHaveLength(6);
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
    await user.click(screen.getByRole('button', { name: 'Show less' }));
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  });
  it('shows "All clear" without alerts', () => {
    renderWithApp(<AlertBox alerts={[]} />);
    expect(screen.getByText('All clear')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });
  it('reports the selected alert', async () => {
    const onSelect = vi.fn();
    const { user } = renderWithApp(<AlertBox alerts={storyAlerts} onSelect={onSelect} />);
    await user.click(screen.getByRole('button', { name: /FitZone: last day to cancel is 30.11.2026/ }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ type: 'cancel_deadline', subscriptionId: 'sub-4' }));
  });
});
