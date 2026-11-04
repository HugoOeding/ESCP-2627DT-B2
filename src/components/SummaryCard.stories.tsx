import type { Meta, StoryObj } from '@storybook/react';
import { SummaryCard } from './SummaryCard';

const meta: Meta<typeof SummaryCard> = {
  title: 'Domain/SummaryCard',
  component: SummaryCard,
  args: { monthlyTotal: 116.84, yearlyTotal: 1402.07, count: 9 },
};
export default meta;
type Story = StoryObj<typeof SummaryCard>;

export const Default: Story = {};
export const ZeroState: Story = { args: { monthlyTotal: 0, yearlyTotal: 0, count: 0 } };
export const LargeAmount: Story = { args: { monthlyTotal: 1450, yearlyTotal: 17400, count: 31 } };
export const WithSavings: Story = { args: { monthlyTotal: 76.94, yearlyTotal: 923.27, count: 8, savedPerMonth: 39.9 } };
export const Dark: Story = { args: { savedPerMonth: 39.9 }, globals: { theme: 'dark' } };
