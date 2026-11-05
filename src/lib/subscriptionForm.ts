import type {
  BillingCycle,
  Category,
  Language,
  Service,
  SharedPlan,
  SharedPlanMember,
  SubStatus,
  Subscription,
} from '../types';
import { equalSplit, round2 } from './calculations';
import { isValidISO } from './dates';
import { parseAmount, type NewSubscriptionInput } from './statementParser';

export type SplitMode = 'equal' | 'custom';

export interface SplitMemberForm {
  name: string;
  share: string;
  paid: boolean;
}

/** Raw S2 form values (strings as typed). */
export interface SubscriptionForm {
  serviceId?: string;
  name: string;
  price: string;
  billingCycle: BillingCycle;
  startDate: string;
  category: Category;
  trialOn: boolean;
  trialEndDate: string;
  priceAfterTrial: string;
  contractOn: boolean;
  minimumTermEnd: string;
  noticePeriodDays: string;
  customerNumber: string;
  providerName: string;
  providerAddress: string;
  providerEmail: string;
  cancelUrl: string;
  assignOn: boolean;
  assignedTo: string;
  splitOn: boolean;
  splitMode: SplitMode;
  members: SplitMemberForm[];
}

export type FormField =
  | 'name'
  | 'price'
  | 'startDate'
  | 'trialEndDate'
  | 'priceAfterTrial'
  | 'minimumTermEnd'
  | 'noticePeriodDays'
  | 'providerEmail'
  | 'cancelUrl'
  | 'split';

/** Field → i18n key of the error message. */
export type FormErrors = Partial<Record<FormField, string>>;

/** Order used to focus the first invalid field. */
export const FIELD_ORDER: FormField[] = [
  'name',
  'price',
  'startDate',
  'trialEndDate',
  'priceAfterTrial',
  'minimumTermEnd',
  'noticePeriodDays',
  'providerEmail',
  'cancelUrl',
  'split',
];

export const QUICK_PICK_IDS = ['streamflix', 'tunebox', 'cloudvault', 'fitzone', 'dailyledger', 'playvault'];

/** "11.99" (en) or "11,99" (de) for an editable price field. */
export function priceToString(n: number | undefined, lang: Language): string {
  if (typeof n !== 'number' || Number.isNaN(n)) return '';
  const s = n.toFixed(2);
  return lang === 'de' ? s.replace('.', ',') : s;
}

/** A positive amount typed with a comma or a dot, or null. */
export function parsePrice(raw: string): number | null {
  const n = parseAmount(raw.trim());
  return n !== null && n > 0 ? round2(n) : null;
}

/** The user is always the first member of a split: their first name, else "You". */
export function userMemberName(profileName: string, fallback: string): string {
  return profileName.trim().split(/\s+/)[0] || fallback;
}

export function emptyForm(todayISO: string, userName: string): SubscriptionForm {
  return {
    name: '',
    price: '',
    billingCycle: 'monthly',
    startDate: todayISO,
    category: 'other',
    trialOn: false,
    trialEndDate: '',
    priceAfterTrial: '',
    contractOn: false,
    minimumTermEnd: '',
    noticePeriodDays: '0',
    customerNumber: '',
    providerName: '',
    providerAddress: '',
    providerEmail: '',
    cancelUrl: '',
    assignOn: false,
    assignedTo: 'me',
    splitOn: false,
    splitMode: 'equal',
    members: [{ name: userName, share: '', paid: true }],
  };
}

/** Pre-fills name, category, price, cycle, notice and provider from the catalogue (all editable). */
export function formFromService(form: SubscriptionForm, service: Service, lang: Language): SubscriptionForm {
  return {
    ...form,
    serviceId: service.id,
    name: service.name,
    category: service.category,
    price: priceToString(service.defaultPrice, lang),
    billingCycle: service.billingCycle,
    noticePeriodDays: String(service.noticePeriodDays),
    providerName: service.name,
    providerAddress: service.providerAddress,
    providerEmail: service.providerEmail,
    cancelUrl: service.cancelUrl,
    contractOn: true,
  };
}

/** Switches to a custom entry: keeps what was typed as the name, clears catalogue data. */
export function customForm(form: SubscriptionForm, name: string): SubscriptionForm {
  return {
    ...form,
    serviceId: undefined,
    name,
    category: 'other',
    price: '',
    noticePeriodDays: '0',
    providerName: '',
    providerAddress: '',
    providerEmail: '',
    cancelUrl: '',
    contractOn: false,
  };
}

const sharesMatch = (shares: number[], expected: number[]) =>
  shares.length === expected.length && shares.every((s, i) => Math.round(s * 100) === Math.round(expected[i] * 100));

export function formFromSubscription(
  sub: Subscription,
  plan: SharedPlan | undefined,
  lang: Language,
  userName: string,
): SubscriptionForm {
  const hasContract =
    !!sub.minimumTermEnd ||
    sub.noticePeriodDays > 0 ||
    !!sub.customerNumber ||
    !!sub.providerAddress ||
    !!sub.providerEmail ||
    !!sub.cancelUrl;
  const members: SplitMemberForm[] = plan
    ? plan.members.map((m, i) => ({ name: m.name, share: priceToString(m.share, lang), paid: i === 0 ? true : m.paid }))
    : [{ name: userName, share: '', paid: true }];
  const equal = plan ? sharesMatch(plan.members.map((m) => m.share), equalSplit(sub.price, plan.members.length)) : true;
  return {
    serviceId: sub.serviceId,
    name: sub.name,
    price: priceToString(sub.price, lang),
    billingCycle: sub.billingCycle,
    startDate: sub.startDate,
    category: sub.category,
    trialOn: sub.status === 'trial' || (sub.status === 'cancelled' && !!sub.trialEndDate),
    trialEndDate: sub.trialEndDate ?? '',
    priceAfterTrial: priceToString(sub.priceAfterTrial, lang),
    contractOn: hasContract,
    minimumTermEnd: sub.minimumTermEnd ?? '',
    noticePeriodDays: String(sub.noticePeriodDays),
    customerNumber: sub.customerNumber ?? '',
    providerName: sub.providerName,
    providerAddress: sub.providerAddress ?? '',
    providerEmail: sub.providerEmail ?? '',
    cancelUrl: sub.cancelUrl ?? '',
    assignOn: !!sub.assignedTo && sub.assignedTo !== 'me',
    assignedTo: sub.assignedTo ?? 'me',
    splitOn: !!plan,
    splitMode: equal ? 'equal' : 'custom',
    members,
  };
}

/** Shares in euros: computed for an equal split, parsed for a custom one (invalid → 0). */
export function formShares(form: SubscriptionForm): number[] {
  if (form.splitMode === 'equal') return equalSplit(parsePrice(form.price) ?? 0, form.members.length);
  return form.members.map((m) => {
    const n = parseAmount(m.share.trim());
    return n !== null && n >= 0 ? round2(n) : 0;
  });
}

/** Price minus the sum of shares (positive = still to assign, negative = too much). */
export function splitDifference(form: SubscriptionForm): number {
  const price = parsePrice(form.price) ?? 0;
  return round2(price - formShares(form).reduce((a, b) => a + b, 0));
}

export function formMembers(form: SubscriptionForm): SharedPlanMember[] {
  const shares = formShares(form);
  return form.members.map((m, i) => ({ name: m.name.trim(), share: shares[i], paid: i === 0 ? true : m.paid }));
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WEB_URL = /^https?:\/\/[^\s]+\.[^\s]+$/i;

export function validateForm(form: SubscriptionForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = 'error.name';
  if (parsePrice(form.price) === null) errors.price = 'error.price';
  if (!isValidISO(form.startDate)) errors.startDate = 'error.date';
  if (form.trialOn) {
    if (!isValidISO(form.trialEndDate)) errors.trialEndDate = 'error.date';
    if (parsePrice(form.priceAfterTrial) === null) errors.priceAfterTrial = 'error.price';
  }
  if (form.contractOn) {
    if (form.minimumTermEnd && !isValidISO(form.minimumTermEnd)) errors.minimumTermEnd = 'error.date';
    if (!/^\d{1,4}$/.test(form.noticePeriodDays.trim())) errors.noticePeriodDays = 'error.notice';
    if (form.providerEmail.trim() && !EMAIL.test(form.providerEmail.trim())) errors.providerEmail = 'error.email';
    if (form.cancelUrl.trim() && !WEB_URL.test(form.cancelUrl.trim())) errors.cancelUrl = 'error.url';
  }
  if (form.splitOn && form.splitMode === 'custom' && errors.price === undefined && splitDifference(form) !== 0) {
    errors.split = 'error.split';
  }
  return errors;
}

export function firstInvalidField(errors: FormErrors): FormField | undefined {
  return FIELD_ORDER.find((f) => errors[f]);
}

const optional = (v: string): string | undefined => (v.trim() ? v.trim() : undefined);

/**
 * Converts a valid form into subscription input. Sections that are switched off are not saved;
 * a cancelled subscription stays cancelled.
 */
export function formToInput(form: SubscriptionForm, existing?: Subscription): NewSubscriptionInput {
  const price = parsePrice(form.price) ?? 0;
  const status: SubStatus = existing?.status === 'cancelled' ? 'cancelled' : form.trialOn ? 'trial' : 'active';
  return {
    serviceId: form.serviceId,
    name: form.name.trim(),
    category: form.category,
    price,
    billingCycle: form.billingCycle,
    startDate: form.startDate,
    status,
    trialEndDate: form.trialOn ? form.trialEndDate : undefined,
    priceAfterTrial: form.trialOn ? (parsePrice(form.priceAfterTrial) ?? price) : undefined,
    minimumTermEnd: form.contractOn ? optional(form.minimumTermEnd) : undefined,
    noticePeriodDays: form.contractOn ? Number(form.noticePeriodDays.trim() || 0) : 0,
    customerNumber: form.contractOn ? optional(form.customerNumber) : undefined,
    providerName: (form.contractOn ? optional(form.providerName) : undefined) ?? form.name.trim(),
    providerAddress: form.contractOn ? optional(form.providerAddress) : undefined,
    providerEmail: form.contractOn ? optional(form.providerEmail) : undefined,
    cancelUrl: form.contractOn ? optional(form.cancelUrl) : undefined,
    assignedTo: form.assignOn && form.assignedTo !== 'me' ? form.assignedTo : undefined,
    sharedPlanId: existing?.sharedPlanId,
    source: existing?.source ?? 'manual',
    cancelledAt: existing?.status === 'cancelled' ? existing.cancelledAt : undefined,
    notes: existing?.notes,
  };
}

/** Services whose name contains the query (case- and space-insensitive). */
export function searchServices(catalogue: Service[], query: string): Service[] {
  const q = query.toLowerCase().replace(/\s+/g, '');
  if (!q) return [];
  return catalogue.filter((s) => s.name.toLowerCase().replace(/\s+/g, '').includes(q));
}
