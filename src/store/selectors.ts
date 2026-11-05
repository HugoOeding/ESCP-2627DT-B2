import { useMemo } from 'react';
import offers from '../data/offers.json';
import type { Offer, Translate } from '../types';
import { makeT } from '../i18n/t';
import { deriveAlerts } from '../lib/alerts';
import { totals } from '../lib/calculations';
import { today } from '../lib/dates';
import { findDuplicates, matchOffers } from '../lib/offers';
import { deriveTips } from '../lib/tips';
import { useStore } from './useStore';

export const offerCatalogue = offers as Offer[];

export function useToday(): string {
  const demoDate = useStore((s) => s.settings.demoDate);
  return useMemo(() => today({ demoDate }), [demoDate]);
}

export function useLang() {
  return useStore((s) => s.profile.language);
}

export function useT(): Translate {
  const lang = useLang();
  return useMemo(() => makeT(lang), [lang]);
}

export function useTotals(filterMemberId?: string) {
  const subs = useStore((s) => s.subscriptions);
  const todayISO = useToday();
  return useMemo(() => totals(subs, todayISO, filterMemberId), [subs, todayISO, filterMemberId]);
}

export function useAlerts() {
  const subscriptions = useStore((s) => s.subscriptions);
  const priceChanges = useStore((s) => s.priceChanges);
  const settings = useStore((s) => s.settings);
  const budget = useStore((s) => s.budget);
  const profile = useStore((s) => s.profile);
  const todayISO = useToday();
  const t = useT();
  return useMemo(
    () => deriveAlerts({ subscriptions, priceChanges, settings, budget, profile }, todayISO, t),
    [subscriptions, priceChanges, settings, budget, profile, todayISO, t],
  );
}

export function useOffers() {
  const subs = useStore((s) => s.subscriptions);
  const todayISO = useToday();
  return useMemo(() => matchOffers(subs, offerCatalogue, todayISO), [subs, todayISO]);
}

export function useDuplicates() {
  const subs = useStore((s) => s.subscriptions);
  const todayISO = useToday();
  return useMemo(() => findDuplicates(subs, todayISO), [subs, todayISO]);
}

/** BottomNav badge: matched offers + duplicate groups. */
export function useOffersBadge(): number {
  const { matches } = useOffers();
  const duplicates = useDuplicates();
  return matches.length + duplicates.length;
}

export function useTips() {
  const subs = useStore((s) => s.subscriptions);
  const budget = useStore((s) => s.budget);
  const todayISO = useToday();
  return useMemo(() => deriveTips(subs, budget, todayISO), [subs, budget, todayISO]);
}

export function useSubscription(id: string | undefined) {
  return useStore((s) => (id ? s.subscriptions.find((sub) => sub.id === id) : undefined));
}

export function useSharedPlan(subscriptionId: string | undefined) {
  return useStore((s) => (subscriptionId ? s.sharedPlans.find((p) => p.subscriptionId === subscriptionId) : undefined));
}

export function useMemberName(): (id: string) => string {
  const members = useStore((s) => s.familyMembers);
  const t = useT();
  return useMemo(
    () => (id: string) => {
      if (id === 'me') return t('family.me');
      return members.find((m) => m.id === id)?.name ?? t('family.me');
    },
    [members, t],
  );
}
