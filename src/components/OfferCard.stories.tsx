import type { Meta, StoryObj } from '@storybook/react';
import { storyOffers } from '../stories/fixtures';
import { OfferCard } from './OfferCard';

const offer = (id: string) => storyOffers.find((o) => o.id === id)!;

const meta: Meta<typeof OfferCard> = { title: 'Domain/OfferCard', component: OfferCard, args: { onView: () => undefined } };
export default meta;
type Story = StoryObj<typeof OfferCard>;

export const Alternative: Story = { args: { offer: offer('o2'), saving: 7, replaces: 'StreamFlix' } };
export const Bundle: Story = { args: { offer: offer('o8'), saving: 10, replaces: 'KickPass' } };
export const Sponsored: Story = { args: { offer: offer('o3'), saving: 15, replaces: 'FitZone' } };
export const StudentDiscount: Story = { args: { offer: offer('o1'), saving: 6, replaces: 'TuneBox' } };
export const Dark: Story = { args: { offer: offer('o3'), saving: 15, replaces: 'FitZone' }, globals: { theme: 'dark' } };
