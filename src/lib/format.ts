import type { BillingCycle, Language, Translate } from '../types';
import { parseISO, format as formatDate, isValid } from 'date-fns';

const locales: Record<Language, string> = { en: 'en-IE', de: 'de-DE' };
const moneyFormatters = new Map<string, Intl.NumberFormat>();

function formatter(lang: Language, digits: number): Intl.NumberFormat {
  const key = `${lang}-${digits}`;
  let f = moneyFormatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locales[lang], {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    moneyFormatters.set(key, f);
  }
  return f;
}

/** "€11.99" (en) or "11,99 €" (de). `trimZero` drops ".00" for whole amounts ("€130"). */
export function money(n: number, lang: Language, opts: { trimZero?: boolean } = {}): string {
  const rounded = Math.round(n * 100) / 100;
  const whole = Number.isInteger(rounded);
  return formatter(lang, opts.trimZero && whole ? 0 : 2).format(rounded);
}

/** DD.MM.YYYY in both languages. */
export function date(iso: string): string {
  const d = parseISO(iso);
  return isValid(d) ? formatDate(d, 'dd.MM.yyyy') : '';
}

/** Signed, rounded percentage: 9.1 → "+9%", -10 → "−10%". */
export function percent(n: number): string {
  const r = Math.round(n);
  if (r > 0) return `+${r}%`;
  if (r < 0) return `−${Math.abs(r)}%`;
  return '0%';
}

export function cycleLabel(cycle: BillingCycle, t: Translate): string {
  return t(cycle === 'monthly' ? 'cycle.monthly' : 'cycle.yearly');
}

/** "€13.99/month" */
export function pricePerCycle(price: number, cycle: BillingCycle, lang: Language, t: Translate): string {
  return t(cycle === 'monthly' ? 'price.perMonth' : 'price.perYear', { amount: money(price, lang) });
}

/** "two", "three" … via i18n for small counts; digits otherwise. */
export function countWord(n: number, t: Translate): string {
  const key = `number.${n}`;
  const word = t(key);
  return word === key ? String(n) : word;
}
