import Papa from 'papaparse';
import type { BillingCycle, Category, DetectedPayment, Service, Subscription, Transaction } from '../types';
import { daysUntil } from './dates';

export const MAX_FILE_BYTES = 2 * 1024 * 1024;

export type StatementErrorCode = 'unreadable' | 'tooLarge';

export class StatementError extends Error {
  readonly code: StatementErrorCode;
  constructor(code: StatementErrorCode) {
    super(code);
    this.name = 'StatementError';
    this.code = code;
  }
}

export function assertFileSize(bytes: number): void {
  if (bytes > MAX_FILE_BYTES) throw new StatementError('tooLarge');
}

const DATE_COLUMNS = ['date', 'buchungstag', 'datum'];
const DESCRIPTION_COLUMNS = ['description', 'verwendungszweck', 'beschreibung', 'empfänger'];
const AMOUNT_COLUMNS = ['amount', 'betrag'];

/** Parses "-13,99", "-13.99", "-1.234,56", "-1,234.56" (and "€", "+", spaces). Returns null if invalid. */
export function parseAmount(raw: string): number | null {
  let s = raw.replace(/\s| |€|EUR/gi, '');
  if (!s) return null;
  let sign = 1;
  if (s.startsWith('-') || s.startsWith('−')) {
    sign = -1;
    s = s.slice(1);
  } else if (s.startsWith('+')) {
    s = s.slice(1);
  }
  if (s.endsWith('-')) {
    sign = -1;
    s = s.slice(0, -1);
  }
  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');
  if (lastDot !== -1 && lastComma !== -1) {
    const decimal = lastDot > lastComma ? '.' : ',';
    const thousands = decimal === '.' ? ',' : '.';
    s = s.split(thousands).join('');
    if (decimal === ',') s = s.replace(',', '.');
  } else if (lastComma !== -1) {
    const parts = s.split(',');
    s = parts.length > 2 ? parts.join('') : s.replace(',', '.');
  } else if (lastDot !== -1 && s.split('.').length > 2) {
    s = s.split('.').join('');
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return sign * Number(s);
}

/** Parses "2026-08-12", "12.08.2026" and "12/08/2026" (day first) to ISO. Returns null if invalid. */
export function parseDate(raw: string): string | null {
  const s = raw.trim();
  let y: number;
  let m: number;
  let d: number;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  const dmy = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(s);
  if (iso) {
    [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  } else if (dmy) {
    [d, m, y] = [Number(dmy[1]), Number(dmy[2]), Number(dmy[3])];
  } else {
    return null;
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Lowercase; strips *, #, digits, dates, "ref", "sepa", "lastschrift", "kartenzahlung" and extra spaces. */
export function normaliseMerchant(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[./]\d{1,2}[./]\d{2,4}/g, ' ')
    .replace(/[*#]/g, ' ')
    .replace(/\d+/g, ' ')
    .replace(/\b(ref|sepa|lastschrift|kartenzahlung)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const compact = (s: string) => s.toLowerCase().replace(/[^a-z0-9äöüß]/g, '');

function findColumn(fields: string[], candidates: string[]): string | undefined {
  return fields.find((f) => candidates.includes(f.trim().toLowerCase()));
}

/** CSV text → outgoing and zero-amount transactions are filtered later; rows with bad values are skipped. */
export function parseCsv(text: string): Transaction[] {
  const result = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ''), {
    header: true,
    skipEmptyLines: true,
  });
  const fields = result.meta.fields ?? [];
  const dateCol = findColumn(fields, DATE_COLUMNS);
  const descCol = findColumn(fields, DESCRIPTION_COLUMNS);
  const amountCol = findColumn(fields, AMOUNT_COLUMNS);
  if (!dateCol || !descCol || !amountCol) throw new StatementError('unreadable');

  const transactions: Transaction[] = [];
  for (const row of result.data) {
    const date = parseDate(row[dateCol] ?? '');
    const amount = parseAmount(row[amountCol] ?? '');
    const merchant = (row[descCol] ?? '').trim();
    if (date && amount !== null && merchant) transactions.push({ date, merchant, amount });
  }
  if (transactions.length === 0) throw new StatementError('unreadable');
  return transactions.sort((a, b) => a.date.localeCompare(b.date));
}

/** Grouping key: a catalogue service id if its name appears in the text, else the first two words. */
export function groupKey(normalised: string, catalogue: Service[]): { key: string; service?: Service } {
  const text = compact(normalised);
  const service = catalogue.find((s) => text.includes(compact(s.name)));
  if (service) return { key: service.id, service };
  return { key: normalised.split(' ').slice(0, 2).join(' ') };
}

export function titleCase(s: string): string {
  return s.replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function intervalType(days: number): BillingCycle | null {
  if (days >= 28 && days <= 33) return 'monthly';
  if (days >= 360 && days <= 370) return 'yearly';
  return null;
}

/** Every interval monthly or yearly (all the same kind) and every amount within ±5% of the median. */
function recurringCycle(charges: Transaction[]): BillingCycle | null {
  if (charges.length < 2) return null;
  const amounts = charges.map((c) => Math.abs(c.amount));
  const med = median(amounts);
  if (med <= 0 || amounts.some((a) => Math.abs(a - med) > med * 0.05)) return null;
  let cycle: BillingCycle | null = null;
  for (let i = 1; i < charges.length; i += 1) {
    const type = intervalType(daysUntil(charges[i].date, charges[i - 1].date));
    if (!type || (cycle && type !== cycle)) return null;
    cycle = type;
  }
  return cycle;
}

function isTracked(key: string, service: Service | undefined, existing: Subscription[]): boolean {
  return existing.some((sub) => {
    if (service && sub.serviceId === service.id) return true;
    const name = compact(sub.name);
    const k = compact(key);
    return name.length >= 3 && (name === k || k.includes(name) || name.includes(k));
  });
}

/**
 * Finds recurring payments and likely free trials. Pure: never touches the store.
 * Trial = a first charge of €0–€1 followed by a full-price charge 7–31 days later.
 */
export function detectRecurring(
  transactions: Transaction[],
  existingSubs: Subscription[],
  catalogue: Service[],
): DetectedPayment[] {
  const groups = new Map<string, { service?: Service; charges: Transaction[] }>();
  for (const tx of transactions) {
    if (tx.amount > 0) continue;
    const { key, service } = groupKey(normaliseMerchant(tx.merchant), catalogue);
    if (!key) continue;
    const group = groups.get(key) ?? { service, charges: [] };
    group.charges.push(tx);
    groups.set(key, group);
  }

  const detected: DetectedPayment[] = [];
  for (const [key, { service, charges }] of groups) {
    const sorted = [...charges].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0];
    const full = sorted.filter((c, i) => i > 0 && Math.abs(c.amount) > 1);
    const gap = full.length > 0 ? daysUntil(full[0].date, first.date) : -1;
    const likelyTrial = Math.abs(first.amount) <= 1 && full.length > 0 && gap >= 7 && gap <= 31;
    const cycle = likelyTrial ? (recurringCycle(full) ?? 'monthly') : recurringCycle(sorted);
    if (!likelyTrial && !cycle) continue;

    const last = sorted[sorted.length - 1];
    detected.push({
      key,
      merchant: last.merchant,
      displayName: service?.name ?? titleCase(key),
      serviceId: service?.id,
      amount: Math.abs(last.amount),
      interval: cycle ?? 'monthly',
      occurrences: sorted.length,
      likelyTrial,
      alreadyTracked: isTracked(key, service, existingSubs),
      firstDate: first.date,
      lastDate: last.date,
      firstFullChargeDate: likelyTrial ? full[0].date : undefined,
    });
  }
  return detected.sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export type NewSubscriptionInput = Omit<Subscription, 'id' | 'nextRenewal'>;

/** Turns a confirmed detection into subscription input (catalogue data where available). */
export function detectedToSubscription(payment: DetectedPayment, catalogue: Service[]): NewSubscriptionInput {
  const service = catalogue.find((s) => s.id === payment.serviceId);
  const category: Category = service?.category ?? 'other';
  const base: NewSubscriptionInput = {
    serviceId: service?.id,
    name: payment.displayName,
    category,
    price: payment.amount,
    billingCycle: payment.interval,
    startDate: payment.firstDate,
    status: 'active',
    noticePeriodDays: service?.noticePeriodDays ?? 0,
    providerName: service?.name ?? payment.displayName,
    providerAddress: service?.providerAddress,
    providerEmail: service?.providerEmail,
    cancelUrl: service?.cancelUrl,
    source: 'statement',
  };
  if (payment.likelyTrial) {
    return { ...base, status: 'trial', trialEndDate: payment.firstFullChargeDate, priceAfterTrial: payment.amount };
  }
  return base;
}
