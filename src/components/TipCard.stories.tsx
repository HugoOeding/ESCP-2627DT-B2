import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { TipCard } from './TipCard';

const meta: Meta<typeof TipCard> = { title: 'Domain/TipCard', component: TipCard };
export default meta;
type Story = StoryObj<typeof TipCard>;

export const Duplicate: Story = { args: { text: 'You pay for two music services. Keep one and save €10.99/month.' } };
export const MostExpensive: Story = {
  args: {
    text: 'FitZone is your most expensive subscription. Still worth it?',
    saving: '€39.90',
    action: <Button size="sm" variant="secondary">Open FitZone</Button>,
  },
};
export const BackUnderBudget: Story = {
  args: { text: 'Cancelling KickPass would bring you back under your €100 budget.', saving: '€19.99' },
};
export const Dark: Story = { ...MostExpensive, globals: { theme: 'dark' } };
