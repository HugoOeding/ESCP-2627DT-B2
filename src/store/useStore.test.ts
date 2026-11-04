import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORE_KEY, emptyState, resetStore, seedState, useStore } from './useStore';
import { useAlerts, useDuplicates, useMemberName, useOffers, useOffersBadge, useSharedPlan, useSubscription, useT, useTips, useToday, useTotals } from './selectors';
import { parseCsv, detectRecurring } from '../lib/statementParser';
import { catalogue } from './useStore';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const get = () => useStore.getState();

describe('store', () => {
  beforeEach(() => resetStore(seedState()));

  it('computes nextRenewal for the seed', () => {
    expect(get().subscriptions.find((s) => s.name === 'StreamFlix')?.nextRenewal).toBe('2026-12-12');
  });

  it('adds a subscription with a computed renewal', () => {
    const id = get().addSubscription({
      name: 'DocsPro',
      category: 'software',
      price: 6.99,
      billingCycle: 'monthly',
      startDate: '2026-11-12',
      status: 'active',
      noticePeriodDays: 0,
      providerName: 'DocsPro',
      source: 'manual',
    });
    expect(get().subscriptions.find((s) => s.id === id)?.nextRenewal).toBe('2026-12-12');
  });

  it('records a price change when the price is edited', () => {
    get().updateSubscription('sub-3', { price: 11.99 });
    const pc = get().priceChanges.at(-1);
    expect(pc).toMatchObject({ subscriptionId: 'sub-3', oldPrice: 10.99, newPrice: 11.99, date: '2026-11-20' });
    const count = get().priceChanges.length;
    get().updateSubscription('sub-3', { name: 'WaveMusic Plus', price: 11.99 });
    expect(get().priceChanges).toHaveLength(count);
    get().updateSubscription('missing', { price: 1 });
    expect(get().priceChanges).toHaveLength(count);
  });

  it('marks as cancelled and reactivates', () => {
    get().markCancelled('sub-4');
    expect(get().subscriptions.find((s) => s.id === 'sub-4')).toMatchObject({ status: 'cancelled', cancelledAt: '2026-11-20' });
    get().reactivate('sub-4');
    expect(get().subscriptions.find((s) => s.id === 'sub-4')).toMatchObject({ status: 'active', cancelledAt: undefined });
    get().markCancelled('sub-5');
    get().reactivate('sub-5');
    expect(get().subscriptions.find((s) => s.id === 'sub-5')?.status).toBe('trial');
    get().reactivate('missing');
  });

  it('deletes a subscription with its price changes and plan', () => {
    get().deleteSubscription('sub-1');
    get().deleteSubscription('sub-2');
    expect(get().subscriptions).toHaveLength(7);
    expect(get().priceChanges).toHaveLength(0);
    expect(get().sharedPlans).toHaveLength(0);
  });

  it('manages shared plans', () => {
    get().togglePaid('sub-1', 2);
    expect(get().sharedPlans[0].members[2].paid).toBe(true);
    get().togglePaid('sub-1', 0);
    expect(get().sharedPlans[0].members[0].paid).toBe(true);
    get().setSharedPlan('sub-1', [
      { name: 'Lena', share: 7, paid: true },
      { name: 'Mia', share: 6.99, paid: false },
    ]);
    expect(get().sharedPlans).toHaveLength(1);
    expect(get().sharedPlans[0].members).toHaveLength(2);
    get().setSharedPlan('sub-2', [{ name: 'Lena', share: 11.99, paid: true }]);
    expect(get().subscriptions.find((s) => s.id === 'sub-2')?.sharedPlanId).toBe(get().sharedPlans[1].id);
    get().removeSharedPlan('sub-2');
    expect(get().sharedPlans).toHaveLength(1);
    expect(get().subscriptions.find((s) => s.id === 'sub-2')?.sharedPlanId).toBeUndefined();
  });

  it('manages family members', () => {
    expect(get().addFamilyMember('  ')).toBeNull();
    const id = get().addFamilyMember('Ella')!;
    expect(get().familyMembers.map((m) => m.name)).toEqual(['Me', 'Max', 'Ella']);
    get().removeFamilyMember('max');
    expect(get().subscriptions.find((s) => s.id === 'sub-9')?.assignedTo).toBeUndefined();
    get().removeFamilyMember('me');
    get().removeFamilyMember(id);
    expect(get().familyMembers).toEqual([{ id: 'me', name: 'Me' }]);
  });

  it('updates profile, settings, budget, language and theme', () => {
    get().setProfile({ name: 'Lena W.' });
    get().setLanguage('de');
    get().setTheme('dark');
    expect(get().profile).toMatchObject({ name: 'Lena W.', language: 'de', theme: 'dark' });
    get().setSettings({ demoDate: '2026-12-13' });
    expect(get().subscriptions.find((s) => s.id === 'sub-1')?.nextRenewal).toBe('2027-01-12');
    get().setBudget(-5);
    expect(get().budget.monthlyLimit).toBe(0);
    get().setBudget(150.555);
    expect(get().budget.monthlyLimit).toBe(150.56);
  });

  it('imports detected payments', () => {
    const csv = readFileSync(resolve(__dirname, '../../public/sample-statement.csv'), 'utf8');
    const found = detectRecurring(parseCsv(csv), get().subscriptions, catalogue).filter((d) => !d.alreadyTracked);
    expect(get().importDetected(found)).toBe(5);
    const imported = get().subscriptions.filter((s) => s.source === 'statement');
    expect(imported.map((s) => s.name).sort()).toEqual(['BrightPages', 'LingoLeap', 'MovieMax', 'SnackBox', 'VPNShield']);
  });

  it('switches between demo, empty and welcome states', () => {
    get().setLanguage('de');
    get().startEmpty();
    expect(get()).toMatchObject({ onboarded: true, budgetPromptDismissed: false, subscriptions: [] });
    expect(get().profile.language).toBe('de');
    get().loadDemo();
    expect(get().subscriptions).toHaveLength(9);
    get().markCancelled('sub-4');
    get().resetDemo();
    expect(get().subscriptions.find((s) => s.id === 'sub-4')?.status).toBe('active');
    expect(get().onboarded).toBe(true);
    get().startOver();
    expect(get().onboarded).toBe(false);
    expect(get().subscriptions).toEqual([]);
    get().dismissBudgetPrompt();
    expect(get().budgetPromptDismissed).toBe(true);
  });

  it('shows one toast at a time and hides it after 3 s', () => {
    vi.useFakeTimers();
    get().showToast('First');
    get().showToast('Second', { label: 'Undo', onAction: () => undefined });
    expect(get().toast?.message).toBe('Second');
    vi.advanceTimersByTime(3000);
    expect(get().toast).toBeNull();
    get().showToast('Third');
    get().hideToast();
    expect(get().toast).toBeNull();
    vi.useRealTimers();
  });

  it('persists only the allowed keys', () => {
    get().showToast('Hello');
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}');
    expect(raw.version).toBe(2);
    expect(Object.keys(raw.state).sort()).toEqual(
      ['budget', 'budgetPromptDismissed', 'familyMembers', 'onboarded', 'priceChanges', 'profile', 'settings', 'sharedPlans', 'subscriptions'].sort(),
    );
  });

  it('rehydrates, recomputes renewals and reseeds unknown shapes', async () => {
    const stale = { ...seedState(), subscriptions: seedState().subscriptions.map((s) => ({ ...s, nextRenewal: '1999-01-01' })) };
    localStorage.setItem(STORE_KEY, JSON.stringify({ state: stale, version: 2 }));
    await useStore.persist.rehydrate();
    expect(get().subscriptions[0].nextRenewal).toBe('2026-12-12');
    localStorage.setItem(STORE_KEY, JSON.stringify({ state: { foo: 1 }, version: 2 }));
    await useStore.persist.rehydrate();
    expect(get().subscriptions).toHaveLength(9);
    localStorage.setItem(STORE_KEY, JSON.stringify({ state: { foo: 1 }, version: 1 }));
    await useStore.persist.rehydrate();
    expect(get().subscriptions).toHaveLength(9);
    expect(emptyState().onboarded).toBe(false);
  });

  it('stays on the Welcome state when nothing is stored', async () => {
    resetStore(emptyState());
    localStorage.removeItem(STORE_KEY);
    await useStore.persist.rehydrate();
    expect(get().onboarded).toBe(false);
    expect(get().subscriptions).toEqual([]);
  });
});

describe('selectors', () => {
  beforeEach(() => resetStore(seedState()));

  it('derive the seed numbers', () => {
    expect(renderHook(() => useToday()).result.current).toBe('2026-11-20');
    expect(renderHook(() => useTotals()).result.current).toEqual({ monthly: 116.84, yearly: 1402.07, count: 9 });
    expect(renderHook(() => useAlerts()).result.current).toHaveLength(6);
    expect(renderHook(() => useOffers()).result.current.totalSaving).toBe(50);
    expect(renderHook(() => useDuplicates()).result.current).toHaveLength(1);
    expect(renderHook(() => useOffersBadge()).result.current).toBe(8);
    expect(renderHook(() => useTips()).result.current).toHaveLength(2);
    expect(renderHook(() => useSubscription('sub-4')).result.current?.name).toBe('FitZone');
    expect(renderHook(() => useSubscription(undefined)).result.current).toBeUndefined();
    expect(renderHook(() => useSharedPlan('sub-1')).result.current?.members).toHaveLength(3);
    expect(renderHook(() => useSharedPlan(undefined)).result.current).toBeUndefined();
    const names = renderHook(() => useMemberName()).result.current;
    expect([names('me'), names('max'), names('gone')]).toEqual(['Me', 'Max', 'Me']);
  });

  it('re-translate when the language changes', () => {
    const { result } = renderHook(() => useT());
    expect(result.current('nav.settings')).toBe('Settings');
    act(() => get().setLanguage('de'));
    expect(result.current('nav.settings')).toBe('Einstellungen');
  });
});
