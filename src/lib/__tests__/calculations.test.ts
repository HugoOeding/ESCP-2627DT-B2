import { describe, expect, it } from 'vitest';
import {
  budgetPercent,
  budgetStatus,
  currentPrice,
  effectiveStatus,
  equalSplit,
  filterByMember,
  hasBudget,
  isCounted,
  latestPriceChange,
  priceHistory,
  monthlyEquivalent,
  savedPerMonth,
  sharedStatus,
  spendByCategory,
  splitRemainder,
  totals,
} from '../calculations';
import { TODAY, seedData, seedSubs, sub } from './helpers';

describe('totals for the seed on 20.11.2026', () => {
  it('matches the expected monthly, yearly and count', () => {
    expect(totals(seedSubs(), TODAY)).toEqual({ monthly: 116.84, yearly: 1402.07, count: 9 });
  });
  it('uses the unrounded yearly/12 for PixelEdit', () => {
    expect(monthlyEquivalent(sub('PixelEdit'), TODAY)).toBeCloseTo(4.9991666, 6);
  });
});

describe('trials', () => {
  it('counts €0 before the trial end and the price after from the end date on', () => {
    const cloud = sub('CloudVault');
    expect(currentPrice(cloud, TODAY)).toBe(0);
    expect(effectiveStatus(cloud, TODAY)).toBe('trial');
    expect(currentPrice(cloud, '2026-11-22')).toBe(2.99);
    expect(effectiveStatus(cloud, '2026-11-23')).toBe('active');
    expect(cloud.status).toBe('trial');
    expect(totals(seedSubs('2026-11-23'), '2026-11-23').monthly).toBe(119.83);
  });
});

describe('cancelled subscriptions', () => {
  it('are excluded from totals and counted as savings', () => {
    const subs = seedSubs().map((s) =>
      s.name === 'FitZone' ? { ...s, status: 'cancelled' as const, cancelledAt: TODAY } : s,
    );
    expect(isCounted(subs.find((s) => s.name === 'FitZone')!)).toBe(false);
    expect(totals(subs, TODAY)).toMatchObject({ monthly: 76.94, count: 8 });
    expect(savedPerMonth(subs)).toBe(39.9);
    expect(savedPerMonth(seedSubs())).toBe(0);
  });
});

describe('family filter', () => {
  it('assigns unassigned subscriptions to Me', () => {
    expect(filterByMember(seedSubs(), 'max').map((s) => s.name)).toEqual(['GemsClub']);
    expect(totals(seedSubs(), TODAY, 'max')).toEqual({ monthly: 4.99, yearly: 59.88, count: 1 });
    expect(totals(seedSubs(), TODAY, 'me')).toMatchObject({ monthly: 111.85, count: 8 });
  });
});

describe('budgetStatus', () => {
  it('uses the 80% and 100% thresholds', () => {
    expect(budgetStatus(79.9, 100)).toBe('ok');
    expect(budgetStatus(80, 100)).toBe('warning');
    expect(budgetStatus(99.99, 100)).toBe('warning');
    expect(budgetStatus(100, 100)).toBe('over');
    expect(budgetStatus(116.84, 130)).toBe('warning');
    expect(budgetStatus(50, 0)).toBe('none');
    expect(budgetStatus(50, undefined)).toBe('none');
    expect(budgetPercent(116.84, 130)).toBe(90);
    expect(budgetPercent(10, 0)).toBe(0);
    expect(hasBudget({ monthlyLimit: 0 })).toBe(false);
    expect(hasBudget({ monthlyLimit: 130 })).toBe(true);
  });
});

describe('spendByCategory', () => {
  it('sums monthly equivalents per category, largest first', () => {
    const spend = spendByCategory(seedSubs(), TODAY);
    expect(spend[0]).toEqual({ category: 'fitness', amount: 39.9 });
    expect(spend[1]).toEqual({ category: 'music', amount: 22.98 });
    expect(spend.find((c) => c.category === 'cloud')).toBeUndefined();
    expect(spendByCategory(seedSubs(), TODAY, 'max')).toEqual([{ category: 'gaming', amount: 4.99 }]);
  });
});

describe('shared plans', () => {
  it('reports paid members, the user always paid', () => {
    const plan = seedData.sharedPlans[0];
    expect(sharedStatus(plan)).toEqual({ paid: 2, total: 3 });
    const allPaid = { ...plan, members: plan.members.map((m) => ({ ...m, paid: true })) };
    expect(sharedStatus(allPaid)).toEqual({ paid: 3, total: 3 });
    const userUnpaid = { ...plan, members: plan.members.map((m, i) => (i === 0 ? { ...m, paid: false } : m)) };
    expect(sharedStatus(userUnpaid).paid).toBe(2);
  });
  it('splits equally with the first member absorbing the cent', () => {
    expect(equalSplit(13.99, 3)).toEqual([4.67, 4.66, 4.66]);
    expect(equalSplit(10, 4)).toEqual([2.5, 2.5, 2.5, 2.5]);
    expect(equalSplit(0.05, 3)).toEqual([0.03, 0.01, 0.01]);
    expect(equalSplit(9.99, 0)).toEqual([]);
    const shares = equalSplit(13.99, 3);
    expect(splitRemainder(13.99, shares)).toBe(0);
    expect(splitRemainder(13.99, [5, 5])).toBe(3.99);
  });
});

describe('priceHistory', () => {
  it('builds points from the price changes', () => {
    const tune = sub('TuneBox');
    expect(priceHistory(tune, seedData.priceChanges)).toEqual([
      { date: '2024-09-05', price: 9.99 },
      { date: '2025-09-05', price: 10.99 },
      { date: '2026-11-01', price: 11.99 },
    ]);
    expect(latestPriceChange(tune.id, seedData.priceChanges)?.newPrice).toBe(11.99);
    expect(priceHistory(sub('FitZone'), seedData.priceChanges)).toEqual([{ date: '2025-03-01', price: 39.9 }]);
    expect(latestPriceChange('sub-4', seedData.priceChanges)).toBeUndefined();
    const early = [{ id: 'x', subscriptionId: tune.id, oldPrice: 8, newPrice: 9, date: '2024-01-01' }];
    expect(priceHistory(tune, early)[0]).toEqual({ date: '2024-01-01', price: 8 });
  });
});
