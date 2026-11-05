import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithApp } from '../test/utils';
import { storyDetected } from '../stories/fixtures';
import { DetectedPaymentRow } from './DetectedPaymentRow';

describe('DetectedPaymentRow', () => {
  it('toggles a payment', async () => {
    const onToggle = vi.fn();
    const { user } = renderWithApp(<DetectedPaymentRow payment={storyDetected} checked={false} onToggle={onToggle} />);
    expect(screen.getByText('€7.99 · monthly · 3×')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'LingoLeap' }));
    expect(onToggle).toHaveBeenCalledWith(true);
  });
  it('disables already tracked payments and flags trials', () => {
    renderWithApp(
      <>
        <DetectedPaymentRow payment={{ ...storyDetected, displayName: 'StreamFlix', alreadyTracked: true }} checked onToggle={() => undefined} />
        <DetectedPaymentRow payment={{ ...storyDetected, displayName: 'MovieMax', likelyTrial: true }} checked onToggle={() => undefined} />
      </>,
    );
    expect(screen.getByRole('checkbox', { name: 'StreamFlix' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'StreamFlix' })).not.toBeChecked();
    expect(screen.getByText('Already tracked')).toBeInTheDocument();
    expect(screen.getByText('Likely free trial')).toBeInTheDocument();
  });
});
