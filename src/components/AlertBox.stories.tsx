import type { Meta, StoryObj } from '@storybook/react';
import { storyAlerts } from '../stories/fixtures';
import { AlertBox } from './AlertBox';

const overflow = [
  ...storyAlerts,
  { id: 'renewal-sub-3', type: 'renewal' as const, subscriptionId: 'sub-3', message: 'WaveMusic renews in 3 days for €10.99', dueDate: '2026-11-24', urgency: 3 },
];

const meta: Meta<typeof AlertBox> = { title: 'Domain/AlertBox', component: AlertBox, args: { onSelect: () => undefined } };
export default meta;
type Story = StoryObj<typeof AlertBox>;

export const Empty: Story = { args: { alerts: [] } };
export const Mixed: Story = { args: { alerts: storyAlerts.slice(0, 3) } };
export const Overflow: Story = { args: { alerts: overflow } };
export const Dark: Story = { args: { alerts: overflow }, globals: { theme: 'dark' } };
