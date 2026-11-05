import type { Meta, StoryObj } from '@storybook/react';
import { Logo } from './Logo';

const meta: Meta<typeof Logo> = { title: 'Foundations/Logo', component: Logo };
export default meta;
type Story = StoryObj<typeof Logo>;

export const Wordmark: Story = {};
export const MarkOnly: Story = { args: { showWordmark: false, size: 32 } };
export const Large: Story = { args: { size: 56 } };
export const Dark: Story = { globals: { theme: 'dark' } };
