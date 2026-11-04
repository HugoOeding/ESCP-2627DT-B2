import type { Language } from '../types';

export interface LetterValues {
  userName: string;
  userAddress: string;
  userEmail?: string;
  providerName: string;
  providerAddress?: string;
  date: string;
  customerNumber?: string;
  subscriptionName: string;
  terminationDate: string;
}

export interface LetterParts {
  subject: string;
  /** Lines of the letter; `null` lines are dropped (missing optional values). */
  lines: (string | null)[];
}

const present = (v: string | undefined): v is string => typeof v === 'string' && v.trim() !== '';
const opt = (v: string | undefined): string | null => (present(v) ? v : null);

function header(v: LetterValues): (string | null)[] {
  return [opt(v.userName), opt(v.userAddress), opt(v.userEmail), '', v.providerName, opt(v.providerAddress), '', v.date, ''];
}

function en(v: LetterValues): LetterParts {
  const subject = present(v.customerNumber)
    ? `Cancellation of my contract – customer no. ${v.customerNumber}`
    : 'Cancellation of my contract';
  const ref = present(v.customerNumber) ? ` (customer no. ${v.customerNumber})` : '';
  return {
    subject,
    lines: [
      ...header(v),
      `Subject: ${subject}`,
      '',
      'Dear Sir or Madam,',
      '',
      `I hereby cancel my contract for ${v.subscriptionName}${ref} with effect from ${v.terminationDate}, or at the earliest possible date after that.`,
      '',
      'Please send me written confirmation of the cancellation, including the date it takes effect.',
      '',
      'Please stop all payments from that date and do not use my data for advertising.',
      '',
      'Kind regards,',
      '',
      opt(v.userName),
    ],
  };
}

function de(v: LetterValues): LetterParts {
  const subject = present(v.customerNumber)
    ? `Kündigung meines Vertrags – Kundennummer ${v.customerNumber}`
    : 'Kündigung meines Vertrags';
  const ref = present(v.customerNumber) ? ` (Kundennummer ${v.customerNumber})` : '';
  return {
    subject,
    lines: [
      ...header(v),
      `Betreff: ${subject}`,
      '',
      'Sehr geehrte Damen und Herren,',
      '',
      `hiermit kündige ich meinen Vertrag über ${v.subscriptionName}${ref} fristgerecht zum ${v.terminationDate}, hilfsweise zum nächstmöglichen Zeitpunkt.`,
      '',
      'Bitte senden Sie mir eine schriftliche Bestätigung der Kündigung unter Angabe des Beendigungszeitpunkts.',
      '',
      'Bitte stellen Sie alle Abbuchungen ab diesem Zeitpunkt ein und verwenden Sie meine Daten nicht für Werbezwecke.',
      '',
      'Mit freundlichen Grüßen',
      '',
      opt(v.userName),
    ],
  };
}

export const letterTemplates: Record<Language, (values: LetterValues) => LetterParts> = { en, de };
