import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { DetectedPayment } from '../types';
import { storyDetected } from '../stories/fixtures';
import { DetectedPaymentRow } from './DetectedPaymentRow';

function Demo({ payment, initial }: { payment: DetectedPayment; initial: boolean }) {
  const [checked, setChecked] = useState(initial);
  return <DetectedPaymentRow payment={payment} checked={checked} onToggle={setChecked} />;
}

const meta: Meta<typeof Demo> = { title: 'Domain/DetectedPaymentRow', component: Demo, args: { payment: storyDetected, initial: false } };
export default meta;
type Story = StoryObj<typeof Demo>;

export const Default: Story = {};
export const Checked: Story = { args: { initial: true } };
export const AlreadyTracked: Story = {
  args: { payment: { ...storyDetected, displayName: 'StreamFlix', amount: 13.99, alreadyTracked: true } },
};
export const LikelyTrial: Story = {
  args: { initial: true, payment: { ...storyDetected, displayName: 'MovieMax', amount: 8.99, occurrences: 2, likelyTrial: true } },
};
export const Dark: Story = { ...LikelyTrial, globals: { theme: 'dark' } };
