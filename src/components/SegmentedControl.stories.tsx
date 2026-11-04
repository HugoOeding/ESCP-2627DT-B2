import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SegmentedControl } from './SegmentedControl';

function Two() {
  const [value, setValue] = useState<'monthly' | 'yearly'>('monthly');
  return (
    <SegmentedControl
      label="Billing cycle"
      value={value}
      onChange={setValue}
      options={[
        { value: 'monthly', label: 'Monthly' },
        { value: 'yearly', label: 'Yearly' },
      ]}
    />
  );
}

function Three() {
  const [value, setValue] = useState<'light' | 'dark' | 'system'>('system');
  return (
    <SegmentedControl
      label="Colour theme"
      value={value}
      onChange={setValue}
      options={[
        { value: 'light', label: 'Light' },
        { value: 'dark', label: 'Dark' },
        { value: 'system', label: 'System' },
      ]}
    />
  );
}

const meta: Meta = { title: 'Foundations/SegmentedControl' };
export default meta;
type Story = StoryObj;

export const TwoOptions: Story = { render: () => <Two /> };
export const ThreeOptions: Story = { render: () => <Three /> };
export const Dark: Story = { render: () => <Three />, globals: { theme: 'dark' } };
