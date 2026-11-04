import type { Language, Subscription, UserProfile } from '../types';
import { letterTemplates } from '../data/letterTemplates';
import { terminationDate } from './contracts';
import { date as formatDate } from './format';

export interface Letter {
  subject: string;
  text: string;
  terminationDate: string;
  language: Language;
}

export type ProfileField = 'name' | 'address';

/** Fields a letter needs that are still empty in the profile (email is optional). */
export function missingProfileFields(profile: Pick<UserProfile, 'name' | 'address'>): ProfileField[] {
  const missing: ProfileField[] = [];
  if (!profile.name.trim()) missing.push('name');
  if (!profile.address.trim()) missing.push('address');
  return missing;
}

export function buildLetter(sub: Subscription, profile: UserProfile, todayISO: string, lang: Language): Letter {
  const termination = terminationDate(sub, todayISO);
  const parts = letterTemplates[lang]({
    userName: profile.name.trim(),
    userAddress: profile.address.trim(),
    userEmail: profile.email.trim(),
    providerName: sub.providerName || sub.name,
    providerAddress: sub.providerAddress,
    date: formatDate(todayISO),
    customerNumber: sub.customerNumber,
    subscriptionName: sub.name,
    terminationDate: formatDate(termination),
  });
  const lines = parts.lines.filter((l): l is string => l !== null);
  // Collapse blank lines left behind by dropped values and trim the edges.
  const text = lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+|\n+$/g, '');
  return { subject: parts.subject, text, terminationDate: termination, language: lang };
}

/** mailto: link to the provider with the subject and body encoded; null without an email. */
export function buildMailto(sub: Subscription, letter: Letter): string | null {
  if (!sub.providerEmail) return null;
  return `mailto:${sub.providerEmail}?subject=${encodeURIComponent(letter.subject)}&body=${encodeURIComponent(letter.text)}`;
}

/** File name for the download: `cancellation-fitzone-2026-11-20.txt` / `Kündigung-fitzone-2026-11-20.txt`. */
export function letterFileName(sub: Subscription, todayISO: string, lang: Language): string {
  const slug = sub.name.toLowerCase().replace(/[^a-z0-9äöüß]+/g, '-').replace(/^-|-$/g, '') || 'subscription';
  return `${lang === 'de' ? 'Kündigung' : 'cancellation'}-${slug}-${todayISO}.txt`;
}
