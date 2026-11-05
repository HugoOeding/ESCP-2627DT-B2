import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarDays,
  format,
  isValid,
  parseISO,
  subDays,
} from 'date-fns';
import type { BillingCycle, Language, Settings } from '../types';
import { translate } from '../i18n/t';
import { date as formatDate } from './format';

export function toISO(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function isValidISO(iso: string | undefined | null): iso is string {
  return typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso) && isValid(parseISO(iso));
}

/** Today's date as ISO (time zeroed): the demo date when set, otherwise the real date. */
export function today(settings?: Pick<Settings, 'demoDate'>, now: Date = new Date()): string {
  if (settings?.demoDate && isValidISO(settings.demoDate)) return settings.demoDate;
  return toISO(now);
}

/** The n-th renewal after the start date, computed from the start to avoid month-end drift. */
export function renewalAt(start: string, cycle: BillingCycle, n: number): string {
  const s = parseISO(start);
  return toISO(cycle === 'monthly' ? addMonths(s, n) : addYears(s, n));
}

function nextRenewalIndex(start: string, cycle: BillingCycle, todayISO: string): number {
  if (start > todayISO) return 0;
  let n = 1;
  while (renewalAt(start, cycle, n) <= todayISO) n += 1;
  return n;
}

/** First renewal strictly after today. A future start date is the first charge itself. */
export function nextRenewal(start: string, cycle: BillingCycle, todayISO: string): string {
  return renewalAt(start, cycle, nextRenewalIndex(start, cycle, todayISO));
}

/** The first renewal from the next one onwards for which `predicate` holds (max 600 steps). */
export function firstRenewalWhere(
  start: string,
  cycle: BillingCycle,
  todayISO: string,
  predicate: (renewal: string) => boolean,
): string {
  let n = nextRenewalIndex(start, cycle, todayISO);
  let candidate = renewalAt(start, cycle, n);
  for (let steps = 0; steps < 600 && !predicate(candidate); steps += 1) {
    n += 1;
    candidate = renewalAt(start, cycle, n);
  }
  return candidate;
}

export function daysUntil(target: string, todayISO: string): number {
  return differenceInCalendarDays(parseISO(target), parseISO(todayISO));
}

export function addDaysISO(iso: string, days: number): string {
  return toISO(addDays(parseISO(iso), days));
}

export function subDaysISO(iso: string, days: number): string {
  return toISO(subDays(parseISO(iso), days));
}

/** "today", "tomorrow", "in 3 days" within 7 days; otherwise DD.MM.YYYY. */
export function relativeLabel(target: string, todayISO: string, lang: Language): string {
  const d = daysUntil(target, todayISO);
  if (d === 0) return translate(lang, 'relative.today');
  if (d === 1) return translate(lang, 'relative.tomorrow');
  if (d > 1 && d <= 7) return translate(lang, 'relative.inDays', { count: d });
  return formatDate(target);
}

/** True when `relativeLabel` gives a word rather than a date. */
export function isRelative(target: string, todayISO: string): boolean {
  const d = daysUntil(target, todayISO);
  return d >= 0 && d <= 7;
}
