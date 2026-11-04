import type { Budget, Category, Subscription } from '../types';
import { isCounted, monthlyEquivalent, round2, totals } from './calculations';
import { findDuplicates } from './offers';

export type Tip =
  | { id: string; kind: 'back_under_budget'; subscriptionId: string; name: string; saving: number; limit: number }
  | { id: string; kind: 'duplicate'; category: Category; count: number; saving: number }
  | { id: string; kind: 'most_expensive'; subscriptionId: string; name: string; saving: number };

/** Up to two rule-based tips: back under budget (only when over), duplicates, most expensive. */
export function deriveTips(subs: Subscription[], budget: Budget | undefined, todayISO: string): Tip[] {
  const tips: Tip[] = [];
  const counted = subs.filter(isCounted);
  const total = totals(subs, todayISO).monthly;
  const limit = budget?.monthlyLimit ?? 0;

  if (limit > 0 && total > limit) {
    const candidate = [...counted]
      .sort((a, b) => monthlyEquivalent(a, todayISO) - monthlyEquivalent(b, todayISO))
      .find((s) => round2(total - monthlyEquivalent(s, todayISO)) <= limit);
    if (candidate) {
      tips.push({
        id: `tip-budget-${candidate.id}`,
        kind: 'back_under_budget',
        subscriptionId: candidate.id,
        name: candidate.name,
        saving: round2(monthlyEquivalent(candidate, todayISO)),
        limit,
      });
    }
  }

  const duplicate = findDuplicates(subs, todayISO)[0];
  if (duplicate) {
    tips.push({
      id: `tip-duplicate-${duplicate.category}`,
      kind: 'duplicate',
      category: duplicate.category,
      count: duplicate.subs.length,
      saving: duplicate.saving,
    });
  }

  const expensive = [...counted].sort(
    (a, b) => monthlyEquivalent(b, todayISO) - monthlyEquivalent(a, todayISO) || a.name.localeCompare(b.name),
  )[0];
  if (expensive && monthlyEquivalent(expensive, todayISO) > 0) {
    tips.push({
      id: `tip-expensive-${expensive.id}`,
      kind: 'most_expensive',
      subscriptionId: expensive.id,
      name: expensive.name,
      saving: round2(monthlyEquivalent(expensive, todayISO)),
    });
  }

  return tips.slice(0, 2);
}
