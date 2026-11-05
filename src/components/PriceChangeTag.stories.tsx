import type { Meta, StoryObj } from '@storybook/react';
import { PriceChangeTag } from './PriceChangeTag';

const meta: Meta<typeof PriceChangeTag> = { title: 'Domain/PriceChangeTag', component: PriceChangeTag };
export default meta;
type Story = StoryObj<typeof PriceChangeTag>;

export const Increase: Story = { args: { oldPrice: 10.99, newPrice: 11.99 } };
export const Decrease: Story = { args: { oldPrice: 9.99, newPrice: 8.99 } };
export const Dark: Story = { args: { oldPrice: 10.99, newPrice: 11.99 }, globals: { theme: 'dark' } };
