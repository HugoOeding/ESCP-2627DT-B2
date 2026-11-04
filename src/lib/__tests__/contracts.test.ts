import { describe, expect, it } from 'vitest';
import { lastDayToCancel, terminationDate } from '../contracts';
import { TODAY, sub } from './helpers';

describe('lastDayToCancel', () => {
  it('uses the minimum term for FitZone', () => {
    expect(lastDayToCancel(sub('FitZone'), TODAY)).toEqual({ date: '2026-11-30', anyTime: false });
  });
  it('never returns a past date (KickPass)', () => {
    expect(lastDayToCancel(sub('KickPass'), TODAY)).toEqual({ date: '2026-12-16', anyTime: false });
  });
  it('is any time before the next renewal with notice 0', () => {
    expect(lastDayToCancel(sub('DailyLedger'), TODAY)).toEqual({ date: '2026-11-22', anyTime: true });
  });
  it('falls back to renewals when the minimum term is no longer reachable', () => {
    const late = { ...sub('FitZone'), minimumTermEnd: '2026-12-15' };
    // 15.12.2026 − 90 days is in the past → first renewal R with R − 90 ≥ today: 01.03.2027 → 01.12.2026
    expect(lastDayToCancel(late, TODAY)).toEqual({ date: '2026-12-01', anyTime: false });
  });
});

describe('terminationDate', () => {
  it('is the minimum term end when today + notice reaches it (FitZone)', () => {
    expect(terminationDate(sub('FitZone'), TODAY)).toBe('2027-02-28');
  });
  it('is the first renewal on or after today + notice (KickPass)', () => {
    expect(terminationDate(sub('KickPass'), TODAY)).toBe('2027-01-15');
  });
  it('is the next renewal with notice 0', () => {
    expect(terminationDate(sub('DailyLedger'), TODAY)).toBe('2026-11-22');
  });
  it('uses the next renewal after the notice period when the minimum term is unreachable', () => {
    const late = { ...sub('FitZone'), minimumTermEnd: '2026-12-15' };
    expect(terminationDate(late, TODAY)).toBe('2027-03-01');
  });
});
