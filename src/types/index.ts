export type BillingCycle = 'monthly' | 'yearly';
export type SubStatus = 'active' | 'trial' | 'cancelled';
export type Category =
  | 'streaming'
  | 'music'
  | 'software'
  | 'cloud'
  | 'fitness'
  | 'sports'
  | 'news'
  | 'gaming'
  | 'food'
  | 'other';

export const CATEGORIES: readonly Category[] = [
  'streaming',
  'music',
  'software',
  'cloud',
  'fitness',
  'sports',
  'news',
  'gaming',
  'food',
  'other',
];

export type Language = 'en' | 'de';
export type Theme = 'light' | 'dark' | 'system';

export interface Service {
  id: string;
  name: string;
  category: Category;
  defaultPrice: number;
  billingCycle: BillingCycle;
  noticePeriodDays: number;
  providerAddress: string;
  providerEmail: string;
  cancelUrl: string;
}

export interface Subscription {
  id: string;
  serviceId?: string;
  name: string;
  category: Category;
  price: number;
  billingCycle: BillingCycle;
  startDate: string;
  nextRenewal: string;
  status: SubStatus;
  trialEndDate?: string;
  priceAfterTrial?: number;
  minimumTermEnd?: string;
  noticePeriodDays: number;
  providerName: string;
  providerAddress?: string;
  providerEmail?: string;
  cancelUrl?: string;
  customerNumber?: string;
  assignedTo?: string;
  sharedPlanId?: string;
  source: 'manual' | 'statement';
  cancelledAt?: string;
  notes?: string;
}

export interface PriceChange {
  id: string;
  subscriptionId: string;
  oldPrice: number;
  newPrice: number;
  date: string;
}

export interface SharedPlanMember {
  name: string;
  share: number;
  paid: boolean;
}

export interface SharedPlan {
  id: string;
  subscriptionId: string;
  members: SharedPlanMember[];
}

export interface FamilyMember {
  id: string;
  name: string;
}

export interface Budget {
  monthlyLimit: number;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  matchesCategory: Category;
  matchesServiceId?: string;
  monthlyPrice: number;
  sponsored: boolean;
}

export interface UserProfile {
  name: string;
  address: string;
  email: string;
  language: Language;
  theme: Theme;
}

export interface Settings {
  reminderDaysBefore: number;
  yearlyReminderDays: number;
  demoDate?: string;
}

export interface Transaction {
  date: string;
  merchant: string;
  amount: number;
}

export interface DetectedPayment {
  merchant: string;
  amount: number;
  interval: BillingCycle;
  occurrences: number;
  likelyTrial: boolean;
  alreadyTracked: boolean;
  key: string;
  displayName: string;
  serviceId?: string;
  firstDate: string;
  lastDate: string;
  /** Date of the first full-price charge (only for likely trials). */
  firstFullChargeDate?: string;
}

export type AlertType =
  | 'trial_end'
  | 'renewal'
  | 'yearly_renewal'
  | 'price_change'
  | 'cancel_deadline'
  | 'budget';

export interface Alert {
  id: string;
  type: AlertType;
  subscriptionId?: string;
  message: string;
  dueDate: string;
  urgency: number;
}

export type BudgetState = 'ok' | 'warning' | 'over' | 'none';

export interface Totals {
  monthly: number;
  yearly: number;
  count: number;
}

/** The persisted part of the store. */
export interface PersistedState {
  onboarded: boolean;
  budgetPromptDismissed: boolean;
  profile: UserProfile;
  settings: Settings;
  budget: Budget;
  familyMembers: FamilyMember[];
  subscriptions: Subscription[];
  priceChanges: PriceChange[];
  sharedPlans: SharedPlan[];
}

/** Shape of seed.json (subscriptions without a stored nextRenewal). */
export interface SeedData {
  profile: UserProfile;
  settings: Settings;
  budget: Budget;
  familyMembers: FamilyMember[];
  subscriptions: Omit<Subscription, 'nextRenewal'>[];
  priceChanges: PriceChange[];
  sharedPlans: SharedPlan[];
}

export type TranslateVars = Record<string, string | number>;
export type Translate = (key: string, vars?: TranslateVars) => string;
