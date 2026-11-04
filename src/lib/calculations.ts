import type { Budget, BudgetState, Category, PriceChange, SharedPlan, SubStatus, Subscription, Totals } from '../types';

export const DEFAULT_MEMBER_ID = 'me';

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Stored status is never mutated: a trial whose end date has passed is effectively active. */
export function effectiveStatus(sub: Subscription, todayISO: string): SubStatus {
  if (sub.status === 'trial' && sub.trialEndDate && todayISO >= sub.trialEndDate) return 'active';
  return sub.status;
}

export function isInTrial(sub: Subscription, todayISO: string): boolean {
  return sub.status === 'trial' && effectiveStatus(sub, todayISO) === 'trial';
}

/** Cancelled subscriptions are listed but excluded from totals, alerts and offers. */
export function isCounted(sub: Subscription): boolean {
  return sub.status !== 'cancelled';
}

/** The price per cycle once any trial is over. */
export function regularPrice(sub: Subscription): number {
  return sub.status === 'trial' && typeof sub.priceAfterTrial === 'number' ? sub.priceAfterTrial : sub.price;
}

/** What is charged per cycle today: €0 during a trial, then the price after the trial. */
export function currentPrice(sub: Subscription, todayISO: string): number {
  if (isInTrial(sub, todayISO)) return 0;
  return regularPrice(sub);
}

/** Unrounded monthly equivalent of today's price. */
export function monthlyEquivalent(sub: Subscription, todayISO: string): number {
  const p = currentPrice(sub, todayISO);
  return sub.billingCycle === 'yearly' ? p / 12 : p;
}

/** Unrounded monthly equivalent of the regular (post-trial) price. */
export function regularMonthly(sub: Subscription): number {
  const p = regularPrice(sub);
  return sub.billingCycle === 'yearly' ? p / 12 : p;
}

export function yearlyEquivalent(sub: Subscription, todayISO: string): number {
  const p = currentPrice(sub, todayISO);
  return sub.billingCycle === 'yearly' ? p : p * 12;
}

export function memberOf(sub: Subscription): string {
  return sub.assignedTo ?? DEFAULT_MEMBER_ID;
}

export function filterByMember(subs: Subscription[], memberId?: string): Subscription[] {
  if (!memberId) return subs;
  return subs.filter((s) => memberOf(s) === memberId);
}

export function totals(subs: Subscription[], todayISO: string, filterMemberId?: string): Totals {
  const counted = filterByMember(subs, filterMemberId).filter(isCounted);
  const monthly = counted.reduce((sum, s) => sum + monthlyEquivalent(s, todayISO), 0);
  const yearly = counted.reduce((sum, s) => sum + yearlyEquivalent(s, todayISO), 0);
  return { monthly: round2(monthly), yearly: round2(yearly), count: counted.length };
}

/** ok < 80% ≤ warning < 100% ≤ over; no limit → none. */
export function budgetStatus(spent: number, limit: number | undefined): BudgetState {
  if (!limit || limit <= 0) return 'none';
  const ratio = spent / limit;
  if (ratio >= 1) return 'over';
  if (ratio >= 0.8) return 'warning';
  return 'ok';
}

export function hasBudget(budget: Budget | undefined): boolean {
  return !!budget && budget.monthlyLimit > 0;
}

export function budgetPercent(spent: number, limit: number): number {
  return limit > 0 ? Math.round((spent / limit) * 100) : 0;
}

export interface CategorySpend {
  category: Category;
  amount: number;
}

export function spendByCategory(subs: Subscription[], todayISO: string, filterMemberId?: string): CategorySpend[] {
  const map = new Map<Category, number>();
  for (const s of filterByMember(subs, filterMemberId).filter(isCounted)) {
    map.set(s.category, (map.get(s.category) ?? 0) + monthlyEquivalent(s, todayISO));
  }
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount: round2(amount) }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount || a.category.localeCompare(b.category));
}

/** Monthly equivalents of everything marked as cancelled through the app. */
export function savedPerMonth(subs: Subscription[], filterMemberId?: string): number {
  const cancelled = filterByMember(subs, filterMemberId).filter((s) => s.status === 'cancelled' && s.cancelledAt);
  return round2(cancelled.reduce((sum, s) => sum + regularMonthly(s), 0));
}

/** The user is always the first member and always counts as paid. */
export function sharedStatus(plan: SharedPlan): { paid: number; total: number } {
  const paid = plan.members.filter((m, i) => i === 0 || m.paid).length;
  return { paid, total: plan.members.length };
}

/** Splits a price into n shares that sum exactly; the first member absorbs the remaining cents. */
export function equalSplit(price: number, n: number): number[] {
  if (n <= 0) return [];
  const cents = Math.round(price * 100);
  const base = Math.floor(cents / n);
  const rest = cents - base * n;
  return Array.from({ length: n }, (_, i) => (i === 0 ? base + rest : base) / 100);
}

/** Difference between the price and the sum of custom shares (positive = still to assign). */
export function splitRemainder(price: number, shares: number[]): number {
  return round2(price - shares.reduce((a, b) => a + b, 0));
}

export interface PricePoint {
  date: string;
  price: number;
}

/** Price history from the recorded changes: the original price at the start, then each new price. */
export function priceHistory(sub: Subscription, changes: PriceChange[]): PricePoint[] {
  const own = changes.filter((c) => c.subscriptionId === sub.id).sort((a, b) => a.date.localeCompare(b.date));
  if (own.length === 0) return [{ date: sub.startDate, price: sub.price }];
  const start = sub.startDate < own[0].date ? sub.startDate : own[0].date;
  return [{ date: start, price: own[0].oldPrice }, ...own.map((c) => ({ date: c.date, price: c.newPrice }))];
}

/** The most recent price change of a subscription, if any. */
export function latestPriceChange(subId: string, changes: PriceChange[]): PriceChange | undefined {
  return changes.filter((c) => c.subscriptionId === subId).sort((a, b) => b.date.localeCompare(a.date))[0];
}
