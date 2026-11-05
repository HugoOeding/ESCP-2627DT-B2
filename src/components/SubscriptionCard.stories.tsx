import type { Meta, StoryObj } from '@storybook/react';
import { storySub, storyState, storyToday } from '../stories/fixtures';
import { SubscriptionCard } from './SubscriptionCard';

const tunePrice = storyState.priceChanges.find((p) => p.newPrice === 11.99);

const meta: Meta<typeof SubscriptionCard> = {
  title: 'Domain/SubscriptionCard',
  component: SubscriptionCard,
  args: { today: storyToday, onClick: () => undefined },
};
export default meta;
type Story = StoryObj<typeof SubscriptionCard>;

export const Monthly: Story = { args: { subscription: storySub('WaveMusic') } };
export const Yearly: Story = { args: { subscription: storySub('PixelEdit') } };
export const Trial: Story = { args: { subscription: storySub('CloudVault') } };
export const PriceIncreased: Story = { args: { subscription: storySub('TuneBox'), priceChange: tunePrice } };
export const Shared: Story = { args: { subscription: storySub('StreamFlix'), sharedStatus: { paid: 2, total: 3 } } };
export const Cancelled: Story = {
  args: { subscription: { ...storySub('FitZone'), status: 'cancelled', cancelledAt: storyToday } },
};
export const LongName: Story = {
  args: { subscription: { ...storySub('KickPass'), name: 'KickPass Premium Bundle with Every League and Replay' } },
};
export const AssignedToMax: Story = { args: { subscription: storySub('GemsClub'), assignedName: 'Max' } };
export const Dark: Story = {
  globals: { theme: 'dark' },
  render: (args) => (
    <div className="flex flex-col gap-3">
      <SubscriptionCard {...args} subscription={storySub('TuneBox')} priceChange={tunePrice} />
      <SubscriptionCard {...args} subscription={storySub('CloudVault')} />
      <SubscriptionCard {...args} subscription={storySub('FitZone')} />
      <SubscriptionCard {...args} subscription={{ ...storySub('DailyLedger'), status: 'cancelled' }} />
    </div>
  ),
};
