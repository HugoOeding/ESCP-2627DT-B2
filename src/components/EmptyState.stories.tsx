import type { Meta, StoryObj } from '@storybook/react';
import { Plus, Tag, Upload } from 'lucide-react';
import { Button } from './Button';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = { title: 'Foundations/EmptyState', component: EmptyState };
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const NoSubscriptions: Story = {
  args: {
    icon: Plus,
    title: 'Add your first subscription',
    body: 'Add one manually or import a bank statement.',
    actions: (
      <>
        <Button fullWidth icon={Plus}>Add manually</Button>
        <Button fullWidth variant="secondary" icon={Upload}>Import statement</Button>
      </>
    ),
  },
};
export const NoOffers: Story = {
  args: { icon: Tag, title: 'No better offers right now', body: "We'll show cheaper plans here when they fit your subscriptions." },
};
export const Dark: Story = { ...NoSubscriptions, globals: { theme: 'dark' } };
