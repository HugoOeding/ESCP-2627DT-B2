import { describe, expect, it } from 'vitest';
import { deriveTips } from '../tips';
import { TODAY, seedSubs } from './helpers';

describe('deriveTips', () => {
  it('gives the duplicate and most expensive tips for the seed', () => {
    const tips = deriveTips(seedSubs(), { monthlyLimit: 130 }, TODAY);
    expect(tips).toEqual([
      { id: 'tip-duplicate-music', kind: 'duplicate', category: 'music', count: 2, saving: 10.99 },
      { id: 'tip-expensive-sub-4', kind: 'most_expensive', subscriptionId: 'sub-4', name: 'FitZone', saving: 39.9 },
    ]);
  });
  it('leads with the back-under-budget tip when over budget', () => {
    const tips = deriveTips(seedSubs(), { monthlyLimit: 100 }, TODAY);
    expect(tips).toHaveLength(2);
    expect(tips[0]).toMatchObject({ kind: 'back_under_budget', name: 'KickPass', saving: 19.99, limit: 100 });
    expect(tips[1].kind).toBe('duplicate');
  });
  it('returns nothing without subscriptions', () => {
    expect(deriveTips([], undefined, TODAY)).toEqual([]);
  });
});
