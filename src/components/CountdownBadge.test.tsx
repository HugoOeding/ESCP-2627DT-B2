import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithApp } from '../test/utils';
import { CountdownBadge } from './CountdownBadge';

const toneOf = (text: string) => screen.getByText(text).closest('span.rounded-sm')?.className ?? '';

describe('CountdownBadge', () => {
  it('uses neutral, warning and danger tones', () => {
    renderWithApp(
      <>
        <CountdownBadge date="2026-12-12" label="Renews" today="2026-11-20" />
        <CountdownBadge date="2026-11-23" label="Cancel by" today="2026-11-20" />
        <CountdownBadge date="2026-11-21" label="Trial ends" today="2026-11-20" />
        <CountdownBadge date="2026-11-20" today="2026-11-20" />
      </>,
    );
    expect(toneOf('Renews 12.12.2026')).toContain('bg-surface-muted');
    expect(toneOf('Cancel by in 3 days')).toContain('bg-warning-soft');
    expect(toneOf('Trial ends tomorrow')).toContain('bg-danger-soft');
    expect(toneOf('today')).toContain('bg-danger-soft');
  });
  it('reads today from the store by default', () => {
    renderWithApp(<CountdownBadge date="2026-11-22" label="Renews" />);
    expect(screen.getByText('Renews in 2 days')).toBeInTheDocument();
  });
});
