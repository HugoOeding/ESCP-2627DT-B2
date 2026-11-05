import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MAX_FILE_BYTES,
  StatementError,
  assertFileSize,
  detectRecurring,
  detectedToSubscription,
  groupKey,
  normaliseMerchant,
  parseAmount,
  parseCsv,
  parseDate,
  titleCase,
} from '../statementParser';
import { catalogue, seedSubs } from './helpers';

const sample = readFileSync(resolve(__dirname, '../../../public/sample-statement.csv'), 'utf8');
const german = readFileSync(resolve(__dirname, 'fixtures/statement-de.csv'), 'utf8');

describe('parseAmount', () => {
  it.each([
    ['-13,99', -13.99],
    ['-13.99', -13.99],
    ['-1.234,56', -1234.56],
    ['-1,234.56', -1234.56],
    ['1450.00', 1450],
    ['+1.450,00', 1450],
    ['-1.234.567', -1234567],
    ['-1,234,567', -1234567],
    ['13,99-', -13.99],
    ['€ -4,99', -4.99],
    ['0', 0],
  ])('parses %s', (raw, expected) => {
    expect(parseAmount(raw)).toBe(expected);
  });
  it('rejects garbage', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
  });
});

describe('parseDate', () => {
  it('parses ISO and day-first dates', () => {
    expect(parseDate('2026-08-12')).toBe('2026-08-12');
    expect(parseDate('12.08.2026')).toBe('2026-08-12');
    expect(parseDate('12/08/2026')).toBe('2026-08-12');
    expect(parseDate('1.8.2026')).toBe('2026-08-01');
  });
  it('rejects invalid dates', () => {
    expect(parseDate('31.02.2026')).toBeNull();
    expect(parseDate('2026/08/12')).toBeNull();
    expect(parseDate('')).toBeNull();
  });
});

describe('normaliseMerchant and grouping', () => {
  it('strips references, digits and banking words', () => {
    expect(normaliseMerchant('STREAMFLIX*SUB REF 88231')).toBe('streamflix sub');
    expect(normaliseMerchant('VPNSHIELD SEPA 2291')).toBe('vpnshield');
    expect(normaliseMerchant('Lastschrift #77 Kartenzahlung 12.08.2026 CAFE   LUNA')).toBe('cafe luna');
  });
  it('groups by catalogue name or the first two words', () => {
    expect(groupKey('moviemax trial verify', catalogue).key).toBe('moviemax');
    expect(groupKey('moviemax subscription', catalogue).key).toBe('moviemax');
    expect(groupKey('freshmart supermarkt filiale', catalogue)).toEqual({ key: 'freshmart supermarkt' });
    expect(titleCase('cafe luna')).toBe('Cafe Luna');
  });
});

describe('parseCsv', () => {
  it('reads the sample statement', () => {
    const tx = parseCsv(sample);
    expect(tx).toHaveLength(40);
    expect(tx[0]).toEqual({ date: '2026-08-01', merchant: 'STIPENDIUM / GEHALT', amount: 1450 });
  });
  it('reads a German export with semicolons', () => {
    const tx = parseCsv(german);
    expect(tx).toHaveLength(8);
    expect(tx.find((t) => t.merchant.startsWith('STREAMFLIX'))).toEqual({
      date: '2026-08-12',
      merchant: 'STREAMFLIX*SUB REF 88231',
      amount: -13.99,
    });
  });
  it('throws a StatementError for unknown columns or empty data', () => {
    expect(() => parseCsv('foo,bar\n1,2\n')).toThrow(StatementError);
    expect(() => parseCsv('date,description,amount\nx,y,z\n')).toThrow(StatementError);
    try {
      parseCsv('nonsense');
    } catch (e) {
      expect((e as StatementError).code).toBe('unreadable');
    }
  });
  it('rejects files over 2 MB', () => {
    expect(() => assertFileSize(MAX_FILE_BYTES + 1)).toThrow(StatementError);
    expect(() => assertFileSize(1000)).not.toThrow();
  });
});

describe('detectRecurring', () => {
  it('finds 6 recurring payments and 1 likely trial against an empty store', () => {
    const found = detectRecurring(parseCsv(sample), [], catalogue);
    expect(found.map((d) => d.displayName)).toEqual([
      'BrightPages',
      'LingoLeap',
      'MovieMax',
      'SnackBox',
      'StreamFlix',
      'TuneBox',
      'VPNShield',
    ]);
    expect(found.every((d) => !d.alreadyTracked)).toBe(true);
    const movie = found.find((d) => d.serviceId === 'moviemax')!;
    expect(movie).toMatchObject({ likelyTrial: true, amount: 8.99, firstDate: '2026-10-06', firstFullChargeDate: '2026-10-20' });
    const stream = found.find((d) => d.serviceId === 'streamflix')!;
    expect(stream).toMatchObject({ amount: 13.99, interval: 'monthly', occurrences: 3, likelyTrial: false });
  });
  it('does not detect rent, groceries or other noise', () => {
    const keys = detectRecurring(parseCsv(sample), [], catalogue).map((d) => d.key);
    for (const noise of ['miete hausverwaltung', 'freshmart supermarkt', 'cafe luna', 'city transit', 'pharma plus', 'bookshop ecke', 'stipendium /']) {
      expect(keys).not.toContain(noise);
    }
  });
  it('marks StreamFlix and TuneBox as already tracked against the seed', () => {
    const found = detectRecurring(parseCsv(sample), seedSubs(), catalogue);
    expect(found.filter((d) => d.alreadyTracked).map((d) => d.displayName)).toEqual(['StreamFlix', 'TuneBox']);
    expect(found.filter((d) => !d.alreadyTracked)).toHaveLength(5);
  });
  it('detects the German fixture', () => {
    const found = detectRecurring(parseCsv(german), [], catalogue);
    expect(found.map((d) => d.serviceId)).toEqual(['streamflix', 'tunebox']);
  });
  it('detects yearly payments and custom merchants by name', () => {
    const tx = [
      { date: '2024-03-01', merchant: 'ACME BACKUP 2024', amount: -49 },
      { date: '2025-03-02', merchant: 'ACME BACKUP 2025', amount: -49 },
      { date: '2026-03-01', merchant: 'ACME BACKUP 2026', amount: -50 },
    ];
    const [found] = detectRecurring(tx, [], catalogue);
    expect(found).toMatchObject({ displayName: 'Acme Backup', interval: 'yearly', serviceId: undefined, amount: 50 });
    const tracked = detectRecurring(tx, [{ ...seedSubs()[0], serviceId: undefined, name: 'Acme Backup' }], catalogue);
    expect(tracked[0].alreadyTracked).toBe(true);
  });
  it('rejects mixed intervals and amounts outside ±5%', () => {
    const mixed = [
      { date: '2026-01-01', merchant: 'GYM ONE', amount: -20 },
      { date: '2026-02-01', merchant: 'GYM ONE', amount: -20 },
      { date: '2027-02-01', merchant: 'GYM ONE', amount: -20 },
    ];
    expect(detectRecurring(mixed, [], catalogue)).toEqual([]);
    const jumpy = [
      { date: '2026-01-01', merchant: 'GYM ONE', amount: -20 },
      { date: '2026-02-01', merchant: 'GYM ONE', amount: -25 },
    ];
    expect(detectRecurring(jumpy, [], catalogue)).toEqual([]);
  });
});

describe('detectedToSubscription', () => {
  it('builds a trial from a likely trial', () => {
    const movie = detectRecurring(parseCsv(sample), [], catalogue).find((d) => d.serviceId === 'moviemax')!;
    expect(detectedToSubscription(movie, catalogue)).toMatchObject({
      name: 'MovieMax',
      category: 'streaming',
      price: 8.99,
      status: 'trial',
      priceAfterTrial: 8.99,
      trialEndDate: '2026-10-20',
      startDate: '2026-10-06',
      source: 'statement',
      providerEmail: 'cancel@moviemax.example',
    });
  });
  it('falls back to category other for unknown merchants', () => {
    const custom = detectedToSubscription(
      {
        key: 'acme backup',
        merchant: 'ACME BACKUP',
        displayName: 'Acme Backup',
        amount: 5,
        interval: 'monthly',
        occurrences: 2,
        likelyTrial: false,
        alreadyTracked: false,
        firstDate: '2026-01-01',
        lastDate: '2026-02-01',
      },
      catalogue,
    );
    expect(custom).toMatchObject({ category: 'other', status: 'active', noticePeriodDays: 0, providerName: 'Acme Backup' });
  });
});
