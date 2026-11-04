import { describe, expect, it } from 'vitest';
import {
  customForm,
  emptyForm,
  firstInvalidField,
  formFromService,
  formFromSubscription,
  formMembers,
  formShares,
  formToInput,
  parsePrice,
  priceToString,
  searchServices,
  splitDifference,
  userMemberName,
  validateForm,
} from '../subscriptionForm';
import { TODAY, catalogue, seedData, sub } from './helpers';

const docspro = catalogue.find((s) => s.id === 'docspro')!;

describe('prices', () => {
  it('formats and parses both decimal styles', () => {
    expect(priceToString(11.99, 'en')).toBe('11.99');
    expect(priceToString(11.99, 'de')).toBe('11,99');
    expect(priceToString(undefined, 'en')).toBe('');
    expect(parsePrice('11,99')).toBe(11.99);
    expect(parsePrice(' 6.99 ')).toBe(6.99);
    expect(parsePrice('0')).toBeNull();
    expect(parsePrice('-3')).toBeNull();
    expect(parsePrice('abc')).toBeNull();
  });
  it('names the user member', () => {
    expect(userMemberName('Lena Weber', 'You')).toBe('Lena');
    expect(userMemberName('  ', 'You')).toBe('You');
  });
});

describe('add flow', () => {
  it('pre-fills from the catalogue and converts to input', () => {
    const form = formFromService(emptyForm(TODAY, 'Lena'), docspro, 'en');
    expect(form).toMatchObject({ name: 'DocsPro', price: '6.99', category: 'software', contractOn: true, noticePeriodDays: '0' });
    expect(validateForm(form)).toEqual({});
    expect(formToInput(form)).toMatchObject({
      serviceId: 'docspro',
      name: 'DocsPro',
      price: 6.99,
      status: 'active',
      startDate: TODAY,
      providerEmail: 'cancel@docspro.example',
      cancelUrl: 'https://docspro.example/cancel',
      source: 'manual',
      assignedTo: undefined,
    });
  });
  it('switches to a custom entry', () => {
    const form = customForm(formFromService(emptyForm(TODAY, 'Lena'), docspro, 'en'), 'Local paper');
    expect(form).toMatchObject({ serviceId: undefined, name: 'Local paper', price: '', category: 'other', contractOn: false });
  });
  it('validates required fields in order', () => {
    const errors = validateForm({ ...emptyForm(TODAY, 'Lena'), startDate: '2026-02-31' });
    expect(errors).toEqual({ name: 'error.name', price: 'error.price', startDate: 'error.date' });
    expect(firstInvalidField(errors)).toBe('name');
    expect(firstInvalidField({})).toBeUndefined();
  });
  it('validates trial, contract and URLs', () => {
    const base = { ...emptyForm(TODAY, 'Lena'), name: 'X', price: '5' };
    expect(validateForm({ ...base, trialOn: true })).toEqual({ trialEndDate: 'error.date', priceAfterTrial: 'error.price' });
    expect(
      validateForm({
        ...base,
        contractOn: true,
        minimumTermEnd: 'soon',
        noticePeriodDays: '-1',
        providerEmail: 'nope',
        cancelUrl: 'javascript:alert(1)',
      }),
    ).toEqual({
      minimumTermEnd: 'error.date',
      noticePeriodDays: 'error.notice',
      providerEmail: 'error.email',
      cancelUrl: 'error.url',
    });
  });
  it('saves trials with the price after the trial', () => {
    const form = { ...emptyForm(TODAY, 'Lena'), name: 'X', price: '5', trialOn: true, trialEndDate: '2026-12-01', priceAfterTrial: '7,50' };
    expect(formToInput(form)).toMatchObject({ status: 'trial', trialEndDate: '2026-12-01', priceAfterTrial: 7.5 });
  });
  it('drops switched-off sections', () => {
    const form = {
      ...formFromSubscription(sub('FitZone'), undefined, 'en', 'Lena'),
      contractOn: false,
      assignOn: false,
    };
    expect(formToInput(form, sub('FitZone'))).toMatchObject({
      minimumTermEnd: undefined,
      noticePeriodDays: 0,
      customerNumber: undefined,
      providerEmail: undefined,
      providerName: 'FitZone',
    });
  });
});

describe('edit flow', () => {
  it('round-trips the seed subscriptions', () => {
    for (const s of seedData.subscriptions.map((x) => sub(x.name))) {
      const plan = seedData.sharedPlans.find((p) => p.subscriptionId === s.id);
      const form = formFromSubscription(s, plan, 'de', 'Lena');
      expect(validateForm(form)).toEqual({});
      const input = formToInput(form, s);
      const { nextRenewal: _n, id: _i, ...rest } = s;
      expect(input).toMatchObject(rest);
    }
  });
  it('opens the sections that have data', () => {
    expect(formFromSubscription(sub('FitZone'), undefined, 'en', 'Lena')).toMatchObject({ contractOn: true, trialOn: false, splitOn: false });
    expect(formFromSubscription(sub('CloudVault'), undefined, 'en', 'Lena').trialOn).toBe(true);
    expect(formFromSubscription(sub('GemsClub'), undefined, 'en', 'Lena')).toMatchObject({ assignOn: true, assignedTo: 'max' });
    const bare = { ...sub('DailyLedger'), customerNumber: undefined, providerAddress: undefined, providerEmail: undefined, cancelUrl: undefined };
    expect(formFromSubscription(bare, undefined, 'en', 'Lena').contractOn).toBe(false);
  });
  it('keeps a cancelled subscription cancelled', () => {
    const cancelled = { ...sub('FitZone'), status: 'cancelled' as const, cancelledAt: TODAY };
    expect(formToInput(formFromSubscription(cancelled, undefined, 'en', 'Lena'), cancelled)).toMatchObject({
      status: 'cancelled',
      cancelledAt: TODAY,
    });
    const cancelledTrial = { ...sub('CloudVault'), status: 'cancelled' as const };
    expect(formFromSubscription(cancelledTrial, undefined, 'en', 'Lena').trialOn).toBe(true);
  });
});

describe('split', () => {
  const plan = seedData.sharedPlans[0];
  it('reads the seed plan as an equal split', () => {
    const form = formFromSubscription(sub('StreamFlix'), plan, 'en', 'Lena');
    expect(form.splitOn).toBe(true);
    expect(form.splitMode).toBe('equal');
    expect(formShares(form)).toEqual([4.67, 4.66, 4.66]);
    expect(splitDifference(form)).toBe(0);
    expect(formMembers(form).map((m) => m.paid)).toEqual([true, true, false]);
  });
  it('detects custom splits and validates their sum', () => {
    const custom = { ...plan, members: [{ name: 'Lena', share: 8, paid: true }, { name: 'Mia', share: 5.99, paid: false }] };
    const form = formFromSubscription(sub('StreamFlix'), custom, 'en', 'Lena');
    expect(form.splitMode).toBe('custom');
    expect(validateForm(form)).toEqual({});
    const off = { ...form, members: [{ ...form.members[0], share: '5' }, { ...form.members[1], share: 'x' }] };
    expect(formShares(off)).toEqual([5, 0]);
    expect(splitDifference(off)).toBe(8.99);
    expect(validateForm(off)).toEqual({ split: 'error.split' });
  });
  it('keeps the user first and paid', () => {
    const form = { ...emptyForm(TODAY, 'Lena'), price: '9', splitOn: true, members: [{ name: 'Lena', share: '', paid: false }, { name: ' Ana ', share: '', paid: true }] };
    expect(formMembers(form)).toEqual([
      { name: 'Lena', share: 4.5, paid: true },
      { name: 'Ana', share: 4.5, paid: true },
    ]);
  });
});

describe('searchServices', () => {
  it('matches names ignoring case and spaces', () => {
    expect(searchServices(catalogue, 'tune').map((s) => s.id)).toEqual(['tunebox']);
    expect(searchServices(catalogue, 'Cine Max').map((s) => s.id)).toEqual(['cinemaxplus']);
    expect(searchServices(catalogue, 'max').map((s) => s.id)).toEqual(['cinemaxplus', 'moviemax']);
    expect(searchServices(catalogue, ' ')).toEqual([]);
  });
});
