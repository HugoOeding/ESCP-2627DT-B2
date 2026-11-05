import type { Meta, StoryObj } from '@storybook/react';
import { Check, Clock, Users } from 'lucide-react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = { title: 'Foundations/Badge', component: Badge, args: { children: 'Badge' } };
export default meta;
type Story = StoryObj<typeof Badge>;

export const Neutral: Story = { args: { tone: 'neutral', children: 'Renews 12.12.2026' } };
export const Primary: Story = { args: { tone: 'primary', children: 'Trial' } };
export const Success: Story = { args: { tone: 'success', icon: Check, children: 'Paid' } };
export const Warning: Story = { args: { tone: 'warning', icon: Clock, children: 'in 3 days' } };
export const Danger: Story = { args: { tone: 'danger', icon: Clock, children: 'tomorrow' } };
export const Trial: Story = { args: { tone: 'primary', children: 'Trial' } };
export const Sponsored: Story = { args: { tone: 'sponsored', children: 'Sponsored' } };
export const Shared: Story = { args: { tone: 'neutral', icon: Users, children: 'Shared 2/3 paid' } };
export const Paid: Story = { args: { tone: 'success', icon: Check, children: 'Paid' } };
export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge tone="neutral">Renews 12.12.2026</Badge>
      <Badge tone="primary">Trial</Badge>
      <Badge tone="success" icon={Check}>Paid</Badge>
      <Badge tone="warning" icon={Clock}>in 3 days</Badge>
      <Badge tone="danger" icon={Clock}>tomorrow</Badge>
      <Badge tone="sponsored">Sponsored</Badge>
    </div>
  ),
};
