import { describe, expect, it } from 'vitest';
import { makeT, translate } from './t';

describe('translate', () => {
  it('interpolates variables', () => {
    expect(translate('en', 'offers.replaces', { name: 'TuneBox' })).toBe('Replaces TuneBox');
    expect(translate('de', 'offers.replaces', { name: 'TuneBox' })).toBe('Ersetzt TuneBox');
  });
  it('chooses plural forms by count', () => {
    expect(translate('en', 'import.success', { count: 1 })).toBe('1 new subscription found');
    expect(translate('en', 'import.success', { count: 5 })).toBe('5 new subscriptions found');
    expect(translate('de', 'relative.inDays', { count: 3 })).toBe('in 3 Tagen');
  });
  it('keeps unknown placeholders and falls back to the key', () => {
    expect(translate('en', 'offers.replaces')).toBe('Replaces {name}');
    expect(translate('en', 'does.not.exist')).toBe('does.not.exist');
    expect(makeT('de')('nav.settings')).toBe('Einstellungen');
  });
});
