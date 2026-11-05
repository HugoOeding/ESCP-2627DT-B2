import { describe, expect, it } from 'vitest';
import { CATEGORIES, type Category } from '../../types';
import { catalogue, offerList, seedData } from './helpers';
import { isValidISO } from '../dates';
import en from '../../i18n/en.json';
import de from '../../i18n/de.json';

const isCategory = (c: unknown): c is Category => CATEGORIES.includes(c as Category);

describe('services.json', () => {
  it('has 20 fictional services with every field', () => {
    expect(catalogue).toHaveLength(20);
    for (const s of catalogue) {
      expect(typeof s.id).toBe('string');
      expect(typeof s.name).toBe('string');
      expect(isCategory(s.category)).toBe(true);
      expect(s.defaultPrice).toBeGreaterThan(0);
      expect(['monthly', 'yearly']).toContain(s.billingCycle);
      expect(s.noticePeriodDays).toBeGreaterThanOrEqual(0);
      expect(s.providerAddress).toMatch(/^\S.+, \d{5} \S/);
      expect(s.providerEmail).toBe(`cancel@${s.id}.example`);
      expect(s.cancelUrl).toBe(`https://${s.id}.example/cancel`);
    }
    expect(new Set(catalogue.map((s) => s.id)).size).toBe(20);
  });
});

describe('seed.json', () => {
  it('matches the Subscription shape', () => {
    expect(seedData.subscriptions).toHaveLength(9);
    for (const s of seedData.subscriptions) {
      expect(isCategory(s.category)).toBe(true);
      expect(isValidISO(s.startDate)).toBe(true);
      expect(['active', 'trial', 'cancelled']).toContain(s.status);
      expect(s.source).toBe('manual');
      expect(s.customerNumber).toMatch(/^KD-\d{5}$/);
      expect(catalogue.some((c) => c.id === s.serviceId)).toBe(true);
      if (s.trialEndDate) expect(isValidISO(s.trialEndDate)).toBe(true);
      if (s.minimumTermEnd) expect(isValidISO(s.minimumTermEnd)).toBe(true);
      expect(s).not.toHaveProperty('nextRenewal');
    }
    expect(seedData.profile.email.endsWith('@example.com')).toBe(true);
    expect(seedData.familyMembers[0]).toEqual({ id: 'me', name: 'Me' });
    for (const pc of seedData.priceChanges) {
      expect(seedData.subscriptions.some((s) => s.id === pc.subscriptionId)).toBe(true);
    }
    const plan = seedData.sharedPlans[0];
    expect(seedData.subscriptions.find((s) => s.id === plan.subscriptionId)?.sharedPlanId).toBe(plan.id);
    expect(plan.members.reduce((sum, m) => sum + m.share, 0)).toBeCloseTo(13.99, 5);
  });
});

describe('offers.json', () => {
  it('has 10 offers with a description each', () => {
    expect(offerList).toHaveLength(10);
    for (const o of offerList) {
      expect(isCategory(o.matchesCategory)).toBe(true);
      expect(o.description.length).toBeGreaterThan(10);
      expect(o.monthlyPrice).toBeGreaterThan(0);
      expect(typeof o.sponsored).toBe('boolean');
      if (o.matchesServiceId) expect(catalogue.some((c) => c.id === o.matchesServiceId)).toBe(true);
    }
  });
});

describe('i18n dictionaries', () => {
  it('have identical key sets and no empty strings', () => {
    expect(Object.keys(de).sort()).toEqual(Object.keys(en).sort());
    for (const v of [...Object.values(en), ...Object.values(de)]) expect(v.trim()).not.toBe('');
  });
  it('use the same placeholders in both languages', () => {
    const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect([key, vars(de[key])]).toEqual([key, vars(en[key])]);
    }
  });
});
