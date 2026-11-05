import { describe, expect, it } from 'vitest';
import { countdownFor, countdownTone, lastDayToCancel, terminationDate } from '../contracts';
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

describe('countdownFor', () => {
  it('follows trial → cancel by → renews', () => {
    expect(countdownFor(sub('CloudVault'), TODAY)).toEqual({ kind: 'trialEnds', date: '2026-11-22' });
    expect(countdownFor(sub('FitZone'), TODAY)).toEqual({ kind: 'cancelBy', date: '2026-11-30' });
    expect(countdownFor(sub('KickPass'), TODAY)).toEqual({ kind: 'cancelBy', date: '2026-12-16' });
    expect(countdownFor(sub('KickPass'), '2026-11-01')).toEqual({ kind: 'cancelBy', date: '2026-11-15' });
    expect(countdownFor(sub('FitZone'), '2026-06-10')).toEqual({ kind: 'renews', date: '2026-07-01' });
    expect(countdownFor(sub('StreamFlix'), TODAY)).toEqual({ kind: 'renews', date: '2026-12-12' });
    expect(countdownFor(sub('CloudVault'), '2026-11-23')).toEqual({ kind: 'renews', date: '2026-12-08' });
    expect(countdownFor({ ...sub('StreamFlix'), status: 'cancelled' }, TODAY)).toBeNull();
  });
  it('picks the tone by days left', () => {
    expect(countdownTone(12)).toBe('neutral');
    expect(countdownTone(7)).toBe('warning');
    expect(countdownTone(3)).toBe('warning');
    expect(countdownTone(2)).toBe('danger');
    expect(countdownTone(0)).toBe('danger');
  });
});
