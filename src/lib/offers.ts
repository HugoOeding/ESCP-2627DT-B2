import type { Category, Offer, Subscription } from '../types';
import { isCounted, regularMonthly, round2 } from './calculations';

export interface OfferMatch {
  offer: Offer;
  sub: Subscription;
  saving: number;
}

export interface DuplicateGroup {
  category: Category;
  subs: Subscription[];
  saving: number;
}

const DUPLICATE_CATEGORIES: readonly Category[] = ['music', 'streaming'];

/**
 * One best offer per counted subscription: the offer must match the service or the category and
 * be cheaper than the subscription's regular monthly equivalent (trials: the price after the trial).
 * `todayISO` is accepted for API symmetry; comparisons use the regular price on purpose.
 */
export function matchOffers(
  subs: Subscription[],
  offers: Offer[],
  _todayISO?: string,
): { matches: OfferMatch[]; totalSaving: number } {
  const matches: OfferMatch[] = [];
  for (const sub of subs.filter(isCounted)) {
    const base = regularMonthly(sub);
    let best: OfferMatch | undefined;
    for (const offer of offers) {
      const fits =
        (offer.matchesServiceId !== undefined && offer.matchesServiceId === sub.serviceId) ||
        offer.matchesCategory === sub.category;
      if (!fits || offer.monthlyPrice >= base) continue;
      const saving = round2(base - offer.monthlyPrice);
      if (!best || saving > best.saving) best = { offer, sub, saving };
    }
    if (best) matches.push(best);
  }
  matches.sort((a, b) => b.saving - a.saving || a.sub.name.localeCompare(b.sub.name));
  return { matches, totalSaving: round2(matches.reduce((sum, m) => sum + m.saving, 0)) };
}

/** Two or more counted music or streaming subscriptions; saving = the cheaper monthly price. */
export function findDuplicates(subs: Subscription[], _todayISO?: string): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  for (const category of DUPLICATE_CATEGORIES) {
    const inCategory = subs
      .filter((s) => isCounted(s) && s.category === category)
      .sort((a, b) => regularMonthly(b) - regularMonthly(a));
    if (inCategory.length >= 2) {
      const cheapest = Math.min(...inCategory.map(regularMonthly));
      groups.push({ category, subs: inCategory, saving: round2(cheapest) });
    }
  }
  return groups;
}
