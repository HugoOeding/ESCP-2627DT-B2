import { describe, expect, it } from 'vitest';
import { cycleLabel, date, money, percent, pricePerCycle } from '../format';
import { makeT } from '../../i18n/t';

describe('format', () => {
  it('formats money per language', () => {
    expect(money(11.99, 'en')).toBe('€11.99');
    expect(money(11.99, 'de')).toBe('11,99 €');
    expect(money(1402.07, 'en')).toBe('€1,402.07');
    expect(money(1402.07, 'de')).toBe('1.402,07 €');
    expect(money(130, 'en', { trimZero: true })).toBe('€130');
    expect(money(130.5, 'en', { trimZero: true })).toBe('€130.50');
  });
  it('formats dates as DD.MM.YYYY', () => {
    expect(date('2026-11-30')).toBe('30.11.2026');
    expect(date('nope')).toBe('');
  });
  it('signs percentages', () => {
    expect(percent(9.099)).toBe('+9%');
    expect(percent(-10)).toBe('−10%');
    expect(percent(0.2)).toBe('0%');
  });
  it('labels cycles', () => {
    const t = makeT('en');
    expect(cycleLabel('monthly', t)).toBe('Monthly');
    expect(cycleLabel('yearly', makeT('de'))).toBe('Jährlich');
    expect(pricePerCycle(13.99, 'monthly', 'en', t)).toBe('€13.99/month');
    expect(pricePerCycle(59.99, 'yearly', 'de', makeT('de'))).toBe('59,99 €/Jahr');
  });
});
