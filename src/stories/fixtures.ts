import offers from '../data/offers.json';
import type { Alert, DetectedPayment, Offer, Subscription } from '../types';
import { deriveAlerts } from '../lib/alerts';
import { makeT } from '../i18n/t';
import { seedState } from '../store/useStore';

/** Fixtures for stories, built from src/data (fictional brands only). */
export const storyState = seedState();
export const storyToday = '2026-11-20';
export const storyOffers = offers as Offer[];

export function storySub(name: string): Subscription {
  const sub = storyState.subscriptions.find((s) => s.name === name);
  if (!sub) throw new Error(name);
  return sub;
}

export const storyAlerts: Alert[] = deriveAlerts(storyState, storyToday, makeT('en'));

export const storyDetected: DetectedPayment = {
  key: 'lingoleap',
  merchant: 'LINGOLEAP LANGUAGE APP',
  displayName: 'LingoLeap',
  serviceId: 'lingoleap',
  amount: 7.99,
  interval: 'monthly',
  occurrences: 3,
  likelyTrial: false,
  alreadyTracked: false,
  firstDate: '2026-08-03',
  lastDate: '2026-10-03',
};
