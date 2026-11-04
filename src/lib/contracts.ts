import type { Subscription } from '../types';
import { addDaysISO, firstRenewalWhere, nextRenewal, subDaysISO } from './dates';

export interface CancelDeadline {
  /** Last day a cancellation still reaches the provider in time; with anyTime the next renewal. */
  date: string;
  anyTime: boolean;
}

/**
 * Last day to cancel (architecture.md §5):
 * - notice 0 → any time before the next renewal
 * - a reachable minimum term → minimumTermEnd − notice
 * - otherwise the first renewal R with R − notice ≥ today → R − notice (never a past date)
 */
export function lastDayToCancel(sub: Subscription, todayISO: string): CancelDeadline {
  const notice = sub.noticePeriodDays;
  if (!notice || notice <= 0) {
    return { date: nextRenewal(sub.startDate, sub.billingCycle, todayISO), anyTime: true };
  }
  if (sub.minimumTermEnd) {
    const byMinTerm = subDaysISO(sub.minimumTermEnd, notice);
    if (byMinTerm >= todayISO) return { date: byMinTerm, anyTime: false };
  }
  const renewal = firstRenewalWhere(sub.startDate, sub.billingCycle, todayISO, (r) => subDaysISO(r, notice) >= todayISO);
  return { date: subDaysISO(renewal, notice), anyTime: false };
}

/**
 * Termination date for the letter: the minimum term end if today + notice still reaches it,
 * otherwise the first renewal on or after today + notice. Notice 0 → the next renewal.
 */
export function terminationDate(sub: Subscription, todayISO: string): string {
  const notice = sub.noticePeriodDays;
  if (!notice || notice <= 0) return nextRenewal(sub.startDate, sub.billingCycle, todayISO);
  const earliest = addDaysISO(todayISO, notice);
  if (sub.minimumTermEnd && earliest <= sub.minimumTermEnd) return sub.minimumTermEnd;
  return firstRenewalWhere(sub.startDate, sub.billingCycle, todayISO, (r) => r >= earliest);
}
