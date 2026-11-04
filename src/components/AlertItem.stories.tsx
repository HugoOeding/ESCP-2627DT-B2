import type { Meta, StoryObj } from '@storybook/react';
import { storyAlerts } from '../stories/fixtures';
import { AlertItem } from './AlertItem';

const byType = (type: string) => storyAlerts.find((a) => a.type === type)!;

const meta: Meta<typeof AlertItem> = { title: 'Domain/AlertItem', component: AlertItem, args: { onClick: () => undefined } };
export default meta;
type Story = StoryObj<typeof AlertItem>;

export const TrialEnd: Story = { args: { ...byType('trial_end') } };
export const CancelDeadline: Story = { args: { ...byType('cancel_deadline') } };
export const PriceChange: Story = { args: { ...byType('price_change') } };
export const Renewal: Story = { args: { ...byType('renewal') } };
export const YearlyRenewal: Story = { args: { ...byType('yearly_renewal') } };
export const Budget: Story = { args: { ...byType('budget') } };
export const Dark: Story = { args: { ...byType('cancel_deadline') }, globals: { theme: 'dark' } };
