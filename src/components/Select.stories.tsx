import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Select } from './Select';

const options = [
  { value: 'streaming', label: 'Streaming' },
  { value: 'music', label: 'Music' },
  { value: 'fitness', label: 'Fitness' },
];

function Demo(props: { error?: string; hint?: string }) {
  const [value, setValue] = useState('music');
  return <Select label="Category" options={options} value={value} onChange={setValue} {...props} />;
}

const meta: Meta<typeof Demo> = { title: 'Foundations/Select', component: Demo };
export default meta;
type Story = StoryObj<typeof Demo>;

export const Default: Story = {};
export const WithHint: Story = { args: { hint: 'Used for the spend by category chart' } };
export const WithError: Story = { args: { error: 'Choose a category' } };
export const Dark: Story = { globals: { theme: 'dark' } };
