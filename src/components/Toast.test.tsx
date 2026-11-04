import { act, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithApp } from '../test/utils';
import { useStore } from '../store/useStore';
import { Toast } from './Toast';

describe('Toast', () => {
  it('announces politely and runs the action', async () => {
    const onAction = vi.fn();
    const { user } = renderWithApp(<Toast />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    act(() => useStore.getState().showToast('Saved', { label: 'Undo', onAction }));
    expect(region).toHaveTextContent('Saved');
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onAction).toHaveBeenCalled();
    expect(region).toHaveTextContent('');
  });
});
