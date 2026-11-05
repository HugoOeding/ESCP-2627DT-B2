import type { Meta, StoryObj } from '@storybook/react';
import { BottomNav } from './BottomNav';

const meta: Meta<typeof BottomNav> = { title: 'Foundations/BottomNav', component: BottomNav };
export default meta;
type Story = StoryObj<typeof BottomNav>;

export const DashboardActive: Story = { args: { offersBadge: 0 }, parameters: { route: '/' } };
export const OffersActiveWithBadge: Story = { args: { offersBadge: 8 }, parameters: { route: '/offers' } };
export const Dark: Story = { args: { offersBadge: 8 }, parameters: { route: '/settings' }, globals: { theme: 'dark' } };
