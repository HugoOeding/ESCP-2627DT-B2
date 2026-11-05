import type { Meta, StoryObj } from '@storybook/react';
import { spendByCategory } from '../lib/calculations';
import { storyState, storyToday } from '../stories/fixtures';
import { CategoryChart } from './CategoryChart';

const data = spendByCategory(storyState.subscriptions, storyToday);

const meta: Meta<typeof CategoryChart> = { title: 'Domain/CategoryChart', component: CategoryChart, args: { data } };
export default meta;
type Story = StoryObj<typeof CategoryChart>;

export const Default: Story = {};
export const SingleCategory: Story = { args: { data: [{ category: 'gaming', amount: 4.99 }] } };
export const Empty: Story = { args: { data: [] } };
export const Dark: Story = { globals: { theme: 'dark' } };
