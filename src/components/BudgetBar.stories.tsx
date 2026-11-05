import type { Meta, StoryObj } from '@storybook/react';
import { BudgetBar } from './BudgetBar';

const meta: Meta<typeof BudgetBar> = { title: 'Domain/BudgetBar', component: BudgetBar, args: { limit: 130, onEdit: () => undefined } };
export default meta;
type Story = StoryObj<typeof BudgetBar>;

export const Ok: Story = { args: { spent: 65 } };
export const Warning: Story = { args: { spent: 116.84 } };
export const Over: Story = { args: { spent: 136.5 } };
export const NoBudget: Story = { args: { spent: 116.84, limit: 0 } };
export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () => (
    <div className="flex flex-col gap-3">
      <BudgetBar spent={65} limit={130} />
      <BudgetBar spent={116.84} limit={130} />
      <BudgetBar spent={136.5} limit={130} />
      <BudgetBar spent={10} limit={0} onEdit={() => undefined} />
    </div>
  ),
};
