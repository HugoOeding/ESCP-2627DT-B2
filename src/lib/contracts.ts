import type { Subscription } from '../types';
import { addDaysISO, daysUntil, firstRenewalWhere, nextRenewal, subDaysISO } from './dates';

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

export type CountdownKind = 'trialEnds' | 'cancelBy' | 'renews';
export type CountdownTone = 'neutral' | 'warning' | 'danger';

export const CANCEL_BY_WINDOW_DAYS = 30;

/**
 * Which date the card badge counts down to: the trial end while in trial, the last day to cancel
 * when it is within 30 days, otherwise the next renewal. Cancelled subscriptions get none.
 */
export function countdownFor(
  sub: Subscription,
  todayISO: string,
): { kind: CountdownKind; date: string } | null {
  if (sub.status === 'cancelled') return null;
  if (sub.status === 'trial' && sub.trialEndDate && todayISO < sub.trialEndDate) {
    return { kind: 'trialEnds', date: sub.trialEndDate };
  }
  if (sub.noticePeriodDays > 0) {
    const deadline = lastDayToCancel(sub, todayISO);
    if (daysUntil(deadline.date, todayISO) <= CANCEL_BY_WINDOW_DAYS) return { kind: 'cancelBy', date: deadline.date };
  }
  return { kind: 'renews', date: nextRenewal(sub.startDate, sub.billingCycle, todayISO) };
}

/** neutral above 7 days, warning at 3–7 days, danger at 2 days or less. */
export function countdownTone(days: number): CountdownTone {
  if (days <= 2) return 'danger';
  if (days <= 7) return 'warning';
  return 'neutral';
}
