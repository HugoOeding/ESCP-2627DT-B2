import type { Meta, StoryObj } from '@storybook/react';
import { Fab } from './Fab';

const meta: Meta<typeof Fab> = { title: 'Foundations/Fab', component: Fab, args: { onClick: () => undefined } };
export default meta;
type Story = StoryObj<typeof Fab>;

export const Default: Story = {};
export const Dark: Story = { globals: { theme: 'dark' } };
