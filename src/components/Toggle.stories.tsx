import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Toggle } from './Toggle';

function Demo({ initial = false, description }: { initial?: boolean; description?: string }) {
  const [checked, setChecked] = useState(initial);
  return <Toggle label="Free trial" checked={checked} onChange={setChecked} description={description} />;
}

const meta: Meta<typeof Demo> = { title: 'Foundations/Toggle', component: Demo };
export default meta;
type Story = StoryObj<typeof Demo>;

export const Off: Story = {};
export const On: Story = { args: { initial: true } };
export const WithDescription: Story = { args: { description: 'Get a reminder before it turns into a paid plan' } };
export const Dark: Story = { args: { initial: true, description: 'Get a reminder before it turns into a paid plan' }, globals: { theme: 'dark' } };
