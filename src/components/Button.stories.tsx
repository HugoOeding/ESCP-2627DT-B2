import type { Meta, StoryObj } from '@storybook/react';
import { FileText } from 'lucide-react';
import { Button } from './Button';

const meta: Meta<typeof Button> = { title: 'Foundations/Button', component: Button, args: { children: 'Save' } };
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { variant: 'primary' } };
export const Secondary: Story = { args: { variant: 'secondary', children: 'Import bank statement' } };
export const Ghost: Story = { args: { variant: 'ghost', children: 'Use sample statement' } };
export const Danger: Story = { args: { variant: 'danger', children: 'Mark as cancelled' } };
export const WithIcon: Story = { args: { variant: 'secondary', icon: FileText, children: 'Create cancellation letter' } };
export const Small: Story = { args: { size: 'sm', variant: 'secondary', children: 'View' } };
export const FullWidth: Story = { args: { fullWidth: true } };
export const Loading: Story = { args: { loading: true, loadingLabel: 'Loading' } };
export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () => (
    <div className="flex flex-col gap-2">
      <Button>Save</Button>
      <Button variant="secondary">Import bank statement</Button>
      <Button variant="ghost">Use sample statement</Button>
      <Button variant="danger">Mark as cancelled</Button>
    </div>
  ),
};
