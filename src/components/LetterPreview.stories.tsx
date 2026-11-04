import type { Meta, StoryObj } from '@storybook/react';
import { buildLetter, buildMailto } from '../lib/letter';
import { storyState, storySub, storyToday } from '../stories/fixtures';
import { LetterPreview } from './LetterPreview';

const fitzone = storySub('FitZone');
const en = buildLetter(fitzone, storyState.profile, storyToday, 'en');
const de = buildLetter(fitzone, storyState.profile, storyToday, 'de');
const empty = buildLetter(fitzone, { ...storyState.profile, name: '', address: '' }, storyToday, 'en');
const noop = () => undefined;

const meta: Meta<typeof LetterPreview> = {
  title: 'Domain/LetterPreview',
  component: LetterPreview,
  args: { onCopy: noop, onPrint: noop, onDownload: noop },
};
export default meta;
type Story = StoryObj<typeof LetterPreview>;

export const English: Story = { args: { letterText: en.text, language: 'en', emailHref: buildMailto(fitzone, en) } };
export const German: Story = { args: { letterText: de.text, language: 'de', emailHref: buildMailto(fitzone, de) } };
export const MissingUserInfo: Story = { args: { letterText: empty.text, language: 'en', emailHref: null, missingInfo: true } };
export const Dark: Story = { ...English, globals: { theme: 'dark' } };
