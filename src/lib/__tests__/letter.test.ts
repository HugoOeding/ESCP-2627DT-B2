import { describe, expect, it } from 'vitest';
import { buildLetter, buildMailto, letterFileName, missingProfileFields } from '../letter';
import { TODAY, seedData, sub } from './helpers';

const profile = seedData.profile;

describe('buildLetter', () => {
  it('writes the English FitZone letter', () => {
    const letter = buildLetter(sub('FitZone'), profile, TODAY, 'en');
    expect(letter.terminationDate).toBe('2027-02-28');
    expect(letter.text).toMatchInlineSnapshot(`
      "Lena Weber
      Musterstraße 12, 10115 Berlin
      lena.weber@example.com

      FitZone
      Sportpark 5, 10115 Berlin

      20.11.2026

      Subject: Cancellation of my contract – customer no. KD-20488

      Dear Sir or Madam,

      I hereby cancel my contract for FitZone (customer no. KD-20488) with effect from 28.02.2027, or at the earliest possible date after that.

      Please send me written confirmation of the cancellation, including the date it takes effect.

      Please stop all payments from that date and do not use my data for advertising.

      Kind regards,

      Lena Weber"
    `);
  });

  it('writes the German FitZone letter', () => {
    const letter = buildLetter(sub('FitZone'), profile, TODAY, 'de');
    expect(letter.text).toMatchInlineSnapshot(`
      "Lena Weber
      Musterstraße 12, 10115 Berlin
      lena.weber@example.com

      FitZone
      Sportpark 5, 10115 Berlin

      20.11.2026

      Betreff: Kündigung meines Vertrags – Kundennummer KD-20488

      Sehr geehrte Damen und Herren,

      hiermit kündige ich meinen Vertrag über FitZone (Kundennummer KD-20488) fristgerecht zum 28.02.2027, hilfsweise zum nächstmöglichen Zeitpunkt.

      Bitte senden Sie mir eine schriftliche Bestätigung der Kündigung unter Angabe des Beendigungszeitpunkts.

      Bitte stellen Sie alle Abbuchungen ab diesem Zeitpunkt ein und verwenden Sie meine Daten nicht für Werbezwecke.

      Mit freundlichen Grüßen

      Lena Weber"
    `);
  });

  it('drops lines and brackets for a missing customer number and email', () => {
    const noNumber = { ...sub('FitZone'), customerNumber: undefined };
    const en = buildLetter(noNumber, { ...profile, email: '' }, TODAY, 'en');
    expect(en.subject).toBe('Cancellation of my contract');
    expect(en.text).toContain('Subject: Cancellation of my contract\n');
    expect(en.text).toContain('my contract for FitZone with effect from 28.02.2027');
    expect(en.text).not.toMatch(/undefined|\(\)|lena\.weber/);
    expect(en.text.startsWith('Lena Weber\nMusterstraße 12, 10115 Berlin\n\nFitZone')).toBe(true);
    const de = buildLetter(noNumber, profile, TODAY, 'de');
    expect(de.subject).toBe('Kündigung meines Vertrags');
    expect(de.text).toContain('Vertrag über FitZone fristgerecht');
  });

  it('copes with an empty profile', () => {
    const letter = buildLetter(sub('KickPass'), { ...profile, name: '', address: '', email: '' }, TODAY, 'en');
    expect(letter.text.startsWith('KickPass\n')).toBe(true);
    expect(letter.text.endsWith('Kind regards,')).toBe(true);
    expect(letter.text).toContain('with effect from 15.01.2027');
  });
});

describe('missingProfileFields', () => {
  it('lists empty name and address', () => {
    expect(missingProfileFields(profile)).toEqual([]);
    expect(missingProfileFields({ name: ' ', address: '' })).toEqual(['name', 'address']);
  });
});

describe('buildMailto', () => {
  it('encodes subject and body', () => {
    const fit = sub('FitZone');
    const letter = buildLetter(fit, profile, TODAY, 'en');
    const href = buildMailto(fit, letter)!;
    expect(href.startsWith('mailto:cancel@fitzone.example?subject=Cancellation%20of%20my%20contract%20%E2%80%93%20customer%20no.%20KD-20488&body=')).toBe(true);
    expect(href).toContain('Lena%20Weber%0AMusterstra%C3%9Fe%2012');
    expect(decodeURIComponent(href.split('&body=')[1])).toBe(letter.text);
    expect(buildMailto({ ...fit, providerEmail: undefined }, letter)).toBeNull();
  });
});

describe('letterFileName', () => {
  it('names the download per language', () => {
    expect(letterFileName(sub('FitZone'), TODAY, 'en')).toBe('cancellation-fitzone-2026-11-20.txt');
    expect(letterFileName(sub('FitZone'), TODAY, 'de')).toBe('Kündigung-fitzone-2026-11-20.txt');
    expect(letterFileName({ ...sub('FitZone'), name: '+++' }, TODAY, 'en')).toBe('cancellation-subscription-2026-11-20.txt');
  });
});
