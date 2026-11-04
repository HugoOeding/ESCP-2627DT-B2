import type { Meta, StoryObj } from '@storybook/react';
import { priceHistory } from '../lib/calculations';
import { storyState, storySub } from '../stories/fixtures';
import { PriceHistoryChart } from './PriceHistoryChart';

const meta: Meta<typeof PriceHistoryChart> = {
  title: 'Domain/PriceHistoryChart',
  component: PriceHistoryChart,
  args: { points: priceHistory(storySub('TuneBox'), storyState.priceChanges) },
};
export default meta;
type Story = StoryObj<typeof PriceHistoryChart>;

export const TwoIncreases: Story = {};
export const NoChanges: Story = { args: { points: priceHistory(storySub('FitZone'), storyState.priceChanges) } };
export const Dark: Story = { globals: { theme: 'dark' } };
