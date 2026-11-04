import type { Meta, StoryObj } from '@storybook/react';
import { ConfirmOverlay } from './ConfirmOverlay';

const meta: Meta<typeof ConfirmOverlay> = {
  title: 'Foundations/ConfirmOverlay',
  component: ConfirmOverlay,
  parameters: { a11y: { element: 'body' } },
  args: {
    open: true,
    title: 'Mark FitZone as cancelled?',
    body: 'It stays in your list but no longer counts towards your totals.',
    confirmLabel: 'Mark as cancelled',
    cancelLabel: 'Keep it',
    onConfirm: () => undefined,
    onCancel: () => undefined,
  },
};
export default meta;
type Story = StoryObj<typeof ConfirmOverlay>;

export const MarkCancelled: Story = {};
export const ResetDemo: Story = {
  args: {
    title: 'Reset demo data?',
    body: "This replaces everything with Lena's demo subscriptions.",
    confirmLabel: 'Reset demo data',
    cancelLabel: 'Go back',
  },
};
export const Dark: Story = { globals: { theme: 'dark' } };
