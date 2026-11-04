import { describe, expect, it } from 'vitest';
import { findDuplicates, matchOffers } from '../offers';
import { TODAY, offerList, seedSubs } from './helpers';

describe('matchOffers', () => {
  it('finds exactly 7 best offers worth €50.00/month', () => {
    const { matches, totalSaving } = matchOffers(seedSubs(), offerList, TODAY);
    const byName = Object.fromEntries(matches.map((m) => [m.sub.name, [m.offer.id, m.saving]]));
    expect(byName).toEqual({
      TuneBox: ['o1', 6],
      WaveMusic: ['o1', 5],
      StreamFlix: ['o2', 7],
      FitZone: ['o3', 15],
      KickPass: ['o8', 10],
      DailyLedger: ['o5', 5],
      CloudVault: ['o6', 2],
    });
    expect(matches).toHaveLength(7);
    expect(totalSaving).toBe(50);
    expect(matches[0].sub.name).toBe('FitZone');
  });
  it('excludes cancelled subscriptions', () => {
    const subs = seedSubs().map((s) => (s.name === 'FitZone' ? { ...s, status: 'cancelled' as const } : s));
    const { matches, totalSaving } = matchOffers(subs, offerList, TODAY);
    expect(matches).toHaveLength(6);
    expect(totalSaving).toBe(35);
  });
});

describe('findDuplicates', () => {
  it('finds the music duplicate only', () => {
    const groups = findDuplicates(seedSubs(), TODAY);
    expect(groups).toHaveLength(1);
    expect(groups[0].category).toBe('music');
    expect(groups[0].subs.map((s) => s.name)).toEqual(['TuneBox', 'WaveMusic']);
    expect(groups[0].saving).toBe(10.99);
  });
  it('ignores cancelled duplicates', () => {
    const subs = seedSubs().map((s) => (s.name === 'WaveMusic' ? { ...s, status: 'cancelled' as const } : s));
    expect(findDuplicates(subs)).toEqual([]);
  });
});
