import type { Meta, StoryObj } from '@storybook/react';
import { CountdownBadge } from './CountdownBadge';

const meta: Meta<typeof CountdownBadge> = {
  title: 'Domain/CountdownBadge',
  component: CountdownBadge,
  args: { today: '2026-11-20', label: 'Renews' },
};
export default meta;
type Story = StoryObj<typeof CountdownBadge>;

export const Far: Story = { args: { date: '2026-12-12' } };
export const Soon: Story = { args: { date: '2026-11-23', label: 'Cancel by' } };
export const Tomorrow: Story = { args: { date: '2026-11-21', label: 'Trial ends' } };
export const Today: Story = { args: { date: '2026-11-20' } };
export const Dark: Story = {
  globals: { theme: 'dark' },
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      <CountdownBadge {...args} date="2026-12-12" />
      <CountdownBadge {...args} date="2026-11-23" />
      <CountdownBadge {...args} date="2026-11-21" />
    </div>
  ),
};
