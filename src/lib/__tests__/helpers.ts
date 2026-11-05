import seed from '../../data/seed.json';
import services from '../../data/services.json';
import offers from '../../data/offers.json';
import type { Offer, PersistedState, SeedData, Service, Subscription } from '../../types';
import { nextRenewal } from '../dates';

export const TODAY = '2026-11-20';
export const seedData = seed as SeedData;
export const catalogue = services as Service[];
export const offerList = offers as Offer[];

export function seedSubs(todayISO = TODAY): Subscription[] {
  return seedData.subscriptions.map((s) => ({ ...s, nextRenewal: nextRenewal(s.startDate, s.billingCycle, todayISO) }));
}

export function sub(name: string, todayISO = TODAY): Subscription {
  const found = seedSubs(todayISO).find((s) => s.name === name);
  if (!found) throw new Error(`No seed subscription ${name}`);
  return found;
}

export function seedState(todayISO = TODAY): PersistedState {
  return {
    onboarded: true,
    budgetPromptDismissed: false,
    profile: { ...seedData.profile },
    settings: { ...seedData.settings },
    budget: { ...seedData.budget },
    familyMembers: [...seedData.familyMembers],
    subscriptions: seedSubs(todayISO),
    priceChanges: [...seedData.priceChanges],
    sharedPlans: seedData.sharedPlans.map((p) => ({ ...p, members: p.members.map((m) => ({ ...m })) })),
  };
}
