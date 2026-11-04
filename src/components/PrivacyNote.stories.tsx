import type { Meta, StoryObj } from '@storybook/react';
import { PrivacyNote } from './PrivacyNote';

const meta: Meta<typeof PrivacyNote> = { title: 'Domain/PrivacyNote', component: PrivacyNote };
export default meta;
type Story = StoryObj<typeof PrivacyNote>;

export const Default: Story = {};
export const Dark: Story = { globals: { theme: 'dark' } };
