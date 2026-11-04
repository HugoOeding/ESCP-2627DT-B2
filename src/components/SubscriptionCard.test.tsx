import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithApp } from '../test/utils';
import { storySub, storyState, storyToday } from '../stories/fixtures';
import { SubscriptionCard } from './SubscriptionCard';

describe('SubscriptionCard', () => {
  it('shows a cancelled subscription muted with a badge and no countdown', () => {
    renderWithApp(<SubscriptionCard subscription={{ ...storySub('FitZone'), status: 'cancelled', cancelledAt: storyToday }} />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.getByText('FitZone')).toHaveClass('text-text-muted');
    expect(screen.queryByText(/Cancel by|Renews/)).toBeNull();
  });
  it('shows countdown, price change, trial and shared badges', async () => {
    const onClick = vi.fn();
    const { user } = renderWithApp(
      <>
        <SubscriptionCard subscription={storySub('FitZone')} onClick={onClick} />
        <SubscriptionCard subscription={storySub('CloudVault')} />
        <SubscriptionCard subscription={storySub('TuneBox')} priceChange={storyState.priceChanges[1]} />
        <SubscriptionCard subscription={storySub('StreamFlix')} sharedStatus={{ paid: 2, total: 3 }} />
        <SubscriptionCard subscription={storySub('PixelEdit')} />
      </>,
    );
    expect(screen.getByText('Cancel by 30.11.2026')).toBeInTheDocument();
    expect(screen.getByText('Trial ends in 2 days')).toBeInTheDocument();
    expect(screen.getByText('Trial')).toBeInTheDocument();
    expect(screen.getByText('+9%')).toBeInTheDocument();
    expect(screen.getByText('Price went up from €10.99 to €11.99')).toBeInTheDocument();
    expect(screen.getByText('Shared 2/3 paid')).toBeInTheDocument();
    expect(screen.getByText('€59.99/year')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /FitZone/ }));
    expect(onClick).toHaveBeenCalled();
  });
});
