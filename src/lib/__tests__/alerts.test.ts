import { describe, expect, it } from 'vitest';
import { deriveAlerts } from '../alerts';
import { makeT } from '../../i18n/t';
import { TODAY, seedState } from './helpers';

const t = makeT('en');

describe('deriveAlerts for the seed on 20.11.2026', () => {
  it('returns exactly 6 alerts in order', () => {
    const alerts = deriveAlerts(seedState(), TODAY, t);
    expect(alerts.map((a) => a.message)).toEqual([
      'CloudVault trial ends in 2 days, then €2.99/month',
      'FitZone: last day to cancel is 30.11.2026',
      'TuneBox went up from €10.99 to €11.99 (+9%)',
      'DailyLedger renews in 2 days for €9.99',
      'PixelEdit yearly plan renews on 10.12.2026 for €59.99',
      "You've used 90% of your €130 budget",
    ]);
    expect(alerts.map((a) => a.type)).toEqual([
      'trial_end',
      'cancel_deadline',
      'price_change',
      'renewal',
      'yearly_renewal',
      'budget',
    ]);
    expect(alerts.map((a) => a.urgency)).toEqual([1, 1, 2, 3, 3, 4]);
    expect(alerts[5].subscriptionId).toBeUndefined();
  });

  it('writes German copy', () => {
    const alerts = deriveAlerts({ ...seedState(), profile: { ...seedState().profile, language: 'de' } }, TODAY, makeT('de'));
    expect(alerts[0].message).toBe('Testphase von CloudVault endet in 2 Tagen, danach 2,99 €/Monat');
    expect(alerts[5].message).toBe('Du hast 90 % deines Budgets von 130 € verbraucht');
  });

  it('lets a cancel deadline suppress the renewal alert of the same subscription', () => {
    const state = seedState('2026-11-28');
    const alerts = deriveAlerts(state, '2026-11-28', t);
    const fitzone = alerts.filter((a) => a.subscriptionId === 'sub-4');
    expect(fitzone.map((a) => a.type)).toEqual(['cancel_deadline']);
  });

  it('drops the trial alert after the trial end', () => {
    const alerts = deriveAlerts(seedState('2026-11-23'), '2026-11-23', t);
    expect(alerts.some((a) => a.type === 'trial_end')).toBe(false);
  });

  it('has no budget alert without a budget', () => {
    const alerts = deriveAlerts({ ...seedState(), budget: { monthlyLimit: 0 } }, TODAY, t);
    expect(alerts.some((a) => a.type === 'budget')).toBe(false);
  });

  it('reports an over-budget state', () => {
    const alerts = deriveAlerts({ ...seedState(), budget: { monthlyLimit: 100 } }, TODAY, t);
    expect(alerts.find((a) => a.type === 'budget')?.message).toBe("You're €16.84 over your €100 budget");
  });

  it('ignores price changes older than 30 days and reports decreases', () => {
    const old = deriveAlerts(seedState('2026-12-05'), '2026-12-05', t);
    expect(old.some((a) => a.type === 'price_change')).toBe(false);
    const state = seedState();
    state.priceChanges.push({ id: 'pc-x', subscriptionId: 'sub-3', oldPrice: 12.21, newPrice: 10.99, date: '2026-11-15' });
    const down = deriveAlerts(state, TODAY, t).find((a) => a.subscriptionId === 'sub-3' && a.type === 'price_change');
    expect(down?.message).toBe('WaveMusic went down from €12.21 to €10.99 (−10%)');
  });

  it('never alerts for cancelled subscriptions', () => {
    const state = seedState();
    state.subscriptions = state.subscriptions.map((s) => ({ ...s, status: 'cancelled' as const, cancelledAt: TODAY }));
    expect(deriveAlerts(state, TODAY, t)).toEqual([]);
  });
});
