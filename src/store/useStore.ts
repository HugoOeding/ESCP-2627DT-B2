import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import seed from '../data/seed.json';
import services from '../data/services.json';
import type {
  DetectedPayment,
  Language,
  PersistedState,
  SeedData,
  Service,
  Settings,
  SharedPlanMember,
  Subscription,
  Theme,
  UserProfile,
} from '../types';
import { DEFAULT_MEMBER_ID, round2 } from '../lib/calculations';
import { nextRenewal, today } from '../lib/dates';
import { createId } from '../lib/id';
import { detectedToSubscription, type NewSubscriptionInput } from '../lib/statementParser';

export const STORE_KEY = 'sst-store-v2';
export const STORE_VERSION = 2;

const seedData = seed as SeedData;
export const catalogue = services as Service[];

export interface ToastAction {
  label: string;
  onAction: () => void;
}

export interface ToastMessage {
  id: string;
  message: string;
  action?: ToastAction;
}

export type SubscriptionInput = NewSubscriptionInput;
export type SubscriptionPatch = Partial<Omit<Subscription, 'id' | 'nextRenewal'>>;

export interface StoreActions {
  loadDemo: () => void;
  startEmpty: () => void;
  resetDemo: () => void;
  startOver: () => void;
  dismissBudgetPrompt: () => void;
  addSubscription: (input: SubscriptionInput) => string;
  updateSubscription: (id: string, patch: SubscriptionPatch) => void;
  markCancelled: (id: string) => void;
  reactivate: (id: string) => void;
  deleteSubscription: (id: string) => void;
  setSharedPlan: (subscriptionId: string, members: SharedPlanMember[]) => void;
  togglePaid: (subscriptionId: string, index: number) => void;
  removeSharedPlan: (subscriptionId: string) => void;
  addFamilyMember: (name: string) => string | null;
  removeFamilyMember: (id: string) => void;
  setProfile: (patch: Partial<UserProfile>) => void;
  setSettings: (patch: Partial<Settings>) => void;
  setBudget: (monthlyLimit: number) => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  importDetected: (selected: DetectedPayment[]) => number;
  showToast: (message: string, action?: ToastAction) => void;
  hideToast: () => void;
}

export type StoreState = PersistedState & { toast: ToastMessage | null } & StoreActions;

const PERSISTED_KEYS: (keyof PersistedState)[] = [
  'onboarded',
  'budgetPromptDismissed',
  'profile',
  'settings',
  'budget',
  'familyMembers',
  'subscriptions',
  'priceChanges',
  'sharedPlans',
];

export function withRenewals(subs: Subscription[], todayISO: string): Subscription[] {
  return subs.map((s) => ({ ...s, nextRenewal: nextRenewal(s.startDate, s.billingCycle, todayISO) }));
}

export const defaultSettings: Settings = { reminderDaysBefore: 3, yearlyReminderDays: 30 };

export function emptyState(onboarded = false, prefs?: Pick<UserProfile, 'language' | 'theme'>): PersistedState {
  return {
    onboarded,
    budgetPromptDismissed: false,
    profile: { name: '', address: '', email: '', language: prefs?.language ?? 'en', theme: prefs?.theme ?? 'system' },
    settings: { ...defaultSettings },
    budget: { monthlyLimit: 0 },
    familyMembers: [{ id: DEFAULT_MEMBER_ID, name: 'Me' }],
    subscriptions: [],
    priceChanges: [],
    sharedPlans: [],
  };
}

/** A fresh copy of Lena's demo data with computed renewals. */
export function seedState(prefs?: Pick<UserProfile, 'language' | 'theme'>): PersistedState {
  const settings: Settings = { ...seedData.settings };
  const subs = seedData.subscriptions.map((s) => ({ ...s, nextRenewal: '' }));
  return {
    onboarded: true,
    budgetPromptDismissed: true,
    profile: { ...seedData.profile, ...(prefs ?? {}) },
    settings,
    budget: { ...seedData.budget },
    familyMembers: seedData.familyMembers.map((m) => ({ ...m })),
    subscriptions: withRenewals(subs, today(settings)),
    priceChanges: seedData.priceChanges.map((p) => ({ ...p })),
    sharedPlans: seedData.sharedPlans.map((p) => ({ ...p, members: p.members.map((m) => ({ ...m })) })),
  };
}

function isPersistedShape(value: unknown): value is PersistedState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.onboarded === 'boolean' &&
    typeof v.profile === 'object' &&
    v.profile !== null &&
    typeof v.settings === 'object' &&
    v.settings !== null &&
    typeof v.budget === 'object' &&
    v.budget !== null &&
    Array.isArray(v.familyMembers) &&
    Array.isArray(v.subscriptions) &&
    Array.isArray(v.priceChanges) &&
    Array.isArray(v.sharedPlans)
  );
}

export function pickPersisted(state: PersistedState): PersistedState {
  const out = {} as Record<keyof PersistedState, unknown>;
  for (const key of PERSISTED_KEYS) out[key] = state[key];
  return out as PersistedState;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;
export const TOAST_MS = 3000;

export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      const todayISO = () => today(get().settings);
      const replace = (next: PersistedState) => set({ ...next });

      return {
        ...emptyState(),
        toast: null,

        loadDemo: () => replace(seedState({ language: get().profile.language, theme: get().profile.theme })),
        startEmpty: () => replace(emptyState(true, get().profile)),
        resetDemo: () => replace(seedState({ language: get().profile.language, theme: get().profile.theme })),
        startOver: () => replace(emptyState(false, get().profile)),
        dismissBudgetPrompt: () => set({ budgetPromptDismissed: true }),

        addSubscription: (input) => {
          const id = createId('sub');
          const sub: Subscription = { ...input, id, nextRenewal: nextRenewal(input.startDate, input.billingCycle, todayISO()) };
          set({ subscriptions: [...get().subscriptions, sub] });
          return id;
        },

        updateSubscription: (id, patch) => {
          const current = get().subscriptions.find((s) => s.id === id);
          if (!current) return;
          const updated: Subscription = { ...current, ...patch, id };
          updated.nextRenewal = nextRenewal(updated.startDate, updated.billingCycle, todayISO());
          const priceChanges = [...get().priceChanges];
          if (typeof patch.price === 'number' && round2(patch.price) !== round2(current.price)) {
            priceChanges.push({
              id: createId('pc'),
              subscriptionId: id,
              oldPrice: current.price,
              newPrice: patch.price,
              date: todayISO(),
            });
          }
          set({ subscriptions: get().subscriptions.map((s) => (s.id === id ? updated : s)), priceChanges });
        },

        markCancelled: (id) => get().updateSubscription(id, { status: 'cancelled', cancelledAt: todayISO() }),

        reactivate: (id) => {
          const sub = get().subscriptions.find((s) => s.id === id);
          if (!sub) return;
          const inTrial = !!sub.trialEndDate && todayISO() < sub.trialEndDate && typeof sub.priceAfterTrial === 'number';
          get().updateSubscription(id, { status: inTrial ? 'trial' : 'active', cancelledAt: undefined });
        },

        deleteSubscription: (id) =>
          set({
            subscriptions: get().subscriptions.filter((s) => s.id !== id),
            priceChanges: get().priceChanges.filter((p) => p.subscriptionId !== id),
            sharedPlans: get().sharedPlans.filter((p) => p.subscriptionId !== id),
          }),

        setSharedPlan: (subscriptionId, members) => {
          const existing = get().sharedPlans.find((p) => p.subscriptionId === subscriptionId);
          const planId = existing?.id ?? createId('plan');
          const plan = { id: planId, subscriptionId, members: members.map((m) => ({ ...m })) };
          set({
            sharedPlans: existing
              ? get().sharedPlans.map((p) => (p.id === planId ? plan : p))
              : [...get().sharedPlans, plan],
            subscriptions: get().subscriptions.map((s) => (s.id === subscriptionId ? { ...s, sharedPlanId: planId } : s)),
          });
        },

        togglePaid: (subscriptionId, index) =>
          set({
            sharedPlans: get().sharedPlans.map((p) =>
              p.subscriptionId === subscriptionId
                ? { ...p, members: p.members.map((m, i) => (i === index && i !== 0 ? { ...m, paid: !m.paid } : m)) }
                : p,
            ),
          }),

        removeSharedPlan: (subscriptionId) =>
          set({
            sharedPlans: get().sharedPlans.filter((p) => p.subscriptionId !== subscriptionId),
            subscriptions: get().subscriptions.map((s) =>
              s.id === subscriptionId ? { ...s, sharedPlanId: undefined } : s,
            ),
          }),

        addFamilyMember: (name) => {
          const trimmed = name.trim();
          if (!trimmed) return null;
          const id = createId('member');
          set({ familyMembers: [...get().familyMembers, { id, name: trimmed }] });
          return id;
        },

        removeFamilyMember: (id) => {
          if (id === DEFAULT_MEMBER_ID) return;
          set({
            familyMembers: get().familyMembers.filter((m) => m.id !== id),
            subscriptions: get().subscriptions.map((s) => (s.assignedTo === id ? { ...s, assignedTo: undefined } : s)),
          });
        },

        setProfile: (patch) => set({ profile: { ...get().profile, ...patch } }),

        setSettings: (patch) => {
          const settings = { ...get().settings, ...patch };
          set({ settings, subscriptions: withRenewals(get().subscriptions, today(settings)) });
        },

        setBudget: (monthlyLimit) =>
          set({ budget: { monthlyLimit: Math.max(0, round2(monthlyLimit) || 0) }, budgetPromptDismissed: true }),
        setLanguage: (language) => set({ profile: { ...get().profile, language } }),
        setTheme: (theme) => set({ profile: { ...get().profile, theme } }),

        importDetected: (selected) => {
          const add = get().addSubscription;
          selected.forEach((payment) => add(detectedToSubscription(payment, catalogue)));
          return selected.length;
        },

        showToast: (message, action) => {
          if (toastTimer) clearTimeout(toastTimer);
          set({ toast: { id: createId('toast'), message, action } });
          toastTimer = setTimeout(() => set({ toast: null }), TOAST_MS);
        },

        hideToast: () => {
          if (toastTimer) clearTimeout(toastTimer);
          set({ toast: null });
        },
      };
    },
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => pickPersisted(state),
      migrate: (persisted) => (isPersistedShape(persisted) ? persisted : seedState()) as unknown as StoreState,
      merge: (persisted, current) => {
        // Nothing stored yet (first launch): keep the initial state, which shows Welcome.
        if (persisted === undefined || persisted === null) return current;
        const base = isPersistedShape(persisted) ? persisted : seedState();
        return {
          ...current,
          ...base,
          subscriptions: withRenewals(base.subscriptions, today(base.settings)),
        };
      },
    },
  ),
);

/** Test and Storybook helper: replace the whole persisted state. */
export function resetStore(state: PersistedState): void {
  useStore.setState({ ...state, toast: null });
}
