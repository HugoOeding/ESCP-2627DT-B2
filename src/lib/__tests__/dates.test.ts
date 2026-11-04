import { describe, expect, it } from 'vitest';
import {
  addDaysISO,
  daysUntil,
  firstRenewalWhere,
  isRelative,
  isValidISO,
  nextRenewal,
  relativeLabel,
  renewalAt,
  subDaysISO,
  today,
} from '../dates';

describe('today', () => {
  it('uses the demo date when set', () => {
    expect(today({ demoDate: '2026-11-20' })).toBe('2026-11-20');
  });
  it('falls back to the real date with the time zeroed', () => {
    expect(today({}, new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(today({ demoDate: 'not-a-date' }, new Date(2026, 1, 1, 8))).toBe('2026-02-01');
    expect(today(undefined, new Date(2026, 1, 2))).toBe('2026-02-02');
  });
});

describe('nextRenewal', () => {
  it('advances monthly plans to the first date after today', () => {
    expect(nextRenewal('2025-03-12', 'monthly', '2026-11-20')).toBe('2026-12-12');
    expect(nextRenewal('2025-01-22', 'monthly', '2026-11-20')).toBe('2026-11-22');
  });
  it('advances yearly plans', () => {
    expect(nextRenewal('2025-12-10', 'yearly', '2026-11-20')).toBe('2026-12-10');
    expect(nextRenewal('2020-02-29', 'yearly', '2026-11-20')).toBe('2027-02-28');
  });
  it('clamps month ends without drifting (31.01 → 28.02 → 31.03)', () => {
    expect(nextRenewal('2026-01-31', 'monthly', '2026-02-01')).toBe('2026-02-28');
    expect(nextRenewal('2026-01-31', 'monthly', '2026-02-28')).toBe('2026-03-31');
    expect(renewalAt('2026-01-31', 'monthly', 3)).toBe('2026-04-30');
  });
  it('returns a future start date itself', () => {
    expect(nextRenewal('2026-12-01', 'monthly', '2026-11-20')).toBe('2026-12-01');
  });
  it('is strictly after today on a renewal day', () => {
    expect(nextRenewal('2025-01-22', 'monthly', '2026-11-22')).toBe('2026-12-22');
    expect(nextRenewal('2026-11-20', 'monthly', '2026-11-20')).toBe('2026-12-20');
  });
});

describe('firstRenewalWhere', () => {
  it('walks renewals until the predicate holds', () => {
    expect(firstRenewalWhere('2025-08-15', 'monthly', '2026-11-20', (r) => r >= '2027-01-01')).toBe('2027-01-15');
    expect(firstRenewalWhere('2026-12-01', 'monthly', '2026-11-20', () => true)).toBe('2026-12-01');
  });
});

describe('day helpers', () => {
  it('counts calendar days', () => {
    expect(daysUntil('2026-11-22', '2026-11-20')).toBe(2);
    expect(daysUntil('2026-11-18', '2026-11-20')).toBe(-2);
    expect(addDaysISO('2026-11-20', 90)).toBe('2027-02-18');
    expect(subDaysISO('2027-02-28', 90)).toBe('2026-11-30');
  });
  it('validates ISO strings', () => {
    expect(isValidISO('2026-11-20')).toBe(true);
    expect(isValidISO('2026-13-40')).toBe(false);
    expect(isValidISO('20.11.2026')).toBe(false);
    expect(isValidISO(undefined)).toBe(false);
  });
});

describe('relativeLabel', () => {
  it('labels days within a week in English', () => {
    expect(relativeLabel('2026-11-20', '2026-11-20', 'en')).toBe('today');
    expect(relativeLabel('2026-11-21', '2026-11-20', 'en')).toBe('tomorrow');
    expect(relativeLabel('2026-11-23', '2026-11-20', 'en')).toBe('in 3 days');
    expect(relativeLabel('2026-11-27', '2026-11-20', 'en')).toBe('in 7 days');
  });
  it('labels days within a week in German', () => {
    expect(relativeLabel('2026-11-20', '2026-11-20', 'de')).toBe('heute');
    expect(relativeLabel('2026-11-21', '2026-11-20', 'de')).toBe('morgen');
    expect(relativeLabel('2026-11-23', '2026-11-20', 'de')).toBe('in 3 Tagen');
  });
  it('uses DD.MM.YYYY beyond a week or in the past', () => {
    expect(relativeLabel('2026-12-12', '2026-11-20', 'en')).toBe('12.12.2026');
    expect(relativeLabel('2026-11-01', '2026-11-20', 'de')).toBe('01.11.2026');
    expect(isRelative('2026-11-25', '2026-11-20')).toBe(true);
    expect(isRelative('2026-12-25', '2026-11-20')).toBe(false);
  });
});
