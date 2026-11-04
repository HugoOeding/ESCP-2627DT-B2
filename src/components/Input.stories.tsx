import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Foundations/Input',
  component: Input,
  args: { label: 'Name', defaultValue: 'StreamFlix' },
};
export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};
export const WithPrefix: Story = { args: { label: 'Price', prefix: '€', type: 'number', defaultValue: '13.99', inputMode: 'decimal' } };
export const Date: Story = { args: { label: 'Start date', type: 'date', defaultValue: '2025-03-12' } };
export const WithHint: Story = { args: { label: 'Notice period (days)', type: 'number', defaultValue: '30', hint: '0 means you can cancel any time' } };
export const Error: Story = { args: { label: 'Price', prefix: '€', defaultValue: '0', error: 'Enter a price above €0' } };
export const Disabled: Story = { args: { disabled: true } };
export const Multiline: Story = { args: { label: 'Address', multiline: true, defaultValue: 'Musterstraße 12, 10115 Berlin' } };
export const Dark: Story = { ...Error, globals: { theme: 'dark' } };
