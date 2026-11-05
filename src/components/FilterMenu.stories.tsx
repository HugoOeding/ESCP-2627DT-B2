import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FilterMenu } from './FilterMenu';

const options = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'me', label: 'Me' },
  { value: 'max', label: 'Max' },
];

function Demo({ initial = 'everyone' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="flex justify-end pb-40">
      <FilterMenu options={options} value={value} onChange={setValue} />
    </div>
  );
}

const meta: Meta<typeof Demo> = { title: 'Domain/FilterMenu', component: Demo };
export default meta;
type Story = StoryObj<typeof Demo>;

export const Everyone: Story = {};
export const MemberSelected: Story = { args: { initial: 'max' } };
export const Dark: Story = { globals: { theme: 'dark' } };
