import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Trash2, UserPlus } from 'lucide-react';
import type { Language, Theme } from '../types';
import { Button } from '../components/Button';
import { ConfirmOverlay } from '../components/ConfirmOverlay';
import { Input } from '../components/Input';
import { SegmentedControl } from '../components/SegmentedControl';
import { ICON_SM } from '../components/iconProps';
import { DEFAULT_MEMBER_ID } from '../lib/calculations';
import { isValidISO } from '../lib/dates';
import { parseAmount } from '../lib/statementParser';
import { priceToString } from '../lib/subscriptionForm';
import { useStore } from '../store/useStore';
import { useLang, useMemberName, useT } from '../store/selectors';
import { usePageTitle } from './usePageTitle';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Card({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <h2 id={id} className="text-heading text-text">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function Settings() {
  const t = useT();
  const lang = useLang();
  const navigate = useNavigate();
  const profile = useStore((s) => s.profile);
  const settings = useStore((s) => s.settings);
  const budget = useStore((s) => s.budget);
  const familyMembers = useStore((s) => s.familyMembers);
  const setProfile = useStore((s) => s.setProfile);
  const setLanguage = useStore((s) => s.setLanguage);
  const setTheme = useStore((s) => s.setTheme);
  const setSettings = useStore((s) => s.setSettings);
  const setBudget = useStore((s) => s.setBudget);
  const addFamilyMember = useStore((s) => s.addFamilyMember);
  const removeFamilyMember = useStore((s) => s.removeFamilyMember);
  const resetDemo = useStore((s) => s.resetDemo);
  const startOver = useStore((s) => s.startOver);
  const showToast = useStore((s) => s.showToast);
  const memberName = useMemberName();
  usePageTitle(t('settings.title'));

  const [name, setName] = useState(profile.name);
  const [address, setAddress] = useState(profile.address);
  const [email, setEmail] = useState(profile.email);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [budgetValue, setBudgetValue] = useState(priceToString(budget.monthlyLimit || undefined, lang));
  const [budgetError, setBudgetError] = useState<string | undefined>();
  const [newMember, setNewMember] = useState('');
  const [confirm, setConfirm] = useState<'reset' | 'startOver' | null>(null);

  // Keep the local fields in sync when the store changes (e.g. after "Reset demo data").
  useEffect(() => {
    setName(profile.name);
    setAddress(profile.address);
    setEmail(profile.email);
  }, [profile.name, profile.address, profile.email]);
  useEffect(() => {
    setBudgetValue(priceToString(budget.monthlyLimit || undefined, lang));
  }, [budget.monthlyLimit, lang]);

  const saveProfile = (e: FormEvent) => {
    e.preventDefault();
    if (email.trim() && !EMAIL.test(email.trim())) {
      setEmailError(t('error.email'));
      return;
    }
    setEmailError(undefined);
    setProfile({ name: name.trim(), address: address.trim(), email: email.trim() });
    showToast(t('toast.saved'));
  };

  const commitBudget = () => {
    const amount = budgetValue.trim() === '' ? 0 : parseAmount(budgetValue.trim());
    if (amount === null || amount < 0) {
      setBudgetError(t('budgetSheet.error'));
      return;
    }
    setBudgetError(undefined);
    if (Math.round(amount * 100) === Math.round(budget.monthlyLimit * 100)) return;
    setBudget(amount);
    showToast(t(amount > 0 ? 'toast.budgetSaved' : 'toast.budgetRemoved'));
  };

  const addMember = (e: FormEvent) => {
    e.preventDefault();
    if (addFamilyMember(newMember)) setNewMember('');
  };

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-3 px-4 pb-[calc(64px+env(safe-area-inset-bottom)+32px)] pt-4">
      <h1 className="text-title text-text">{t('settings.title')}</h1>

      <Card id="settings-user" title={t('settings.user')}>
        <form noValidate onSubmit={saveProfile} className="flex flex-col gap-3">
          <Input label={t('field.fullName')} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <Input
            label={t('field.address')}
            multiline
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            autoComplete="street-address"
          />
          <Input
            label={t('field.email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={emailError}
            autoComplete="email"
          />
          <p className="text-caption text-text-muted">{t('settings.userNote')}</p>
          <Button type="submit" variant="secondary" fullWidth>
            {t('settings.saveProfile')}
          </Button>
        </form>
      </Card>

      <Card id="settings-language" title={t('settings.language')}>
        <SegmentedControl<Language>
          label={t('settings.language')}
          hideLabel
          value={profile.language}
          onChange={setLanguage}
          options={[
            { value: 'en', label: t('lang.en') },
            { value: 'de', label: t('lang.de') },
          ]}
        />
      </Card>

      <Card id="settings-theme" title={t('settings.theme')}>
        <SegmentedControl<Theme>
          label={t('settings.theme')}
          hideLabel
          value={profile.theme}
          onChange={setTheme}
          options={[
            { value: 'light', label: t('theme.light') },
            { value: 'dark', label: t('theme.dark') },
            { value: 'system', label: t('theme.system') },
          ]}
        />
      </Card>

      <Card id="settings-reminders" title={t('settings.reminders')}>
        <SegmentedControl<string>
          label={t('reminders.label')}
          value={String(settings.reminderDaysBefore)}
          onChange={(v) => setSettings({ reminderDaysBefore: Number(v) })}
          options={[1, 3, 7].map((n) => ({ value: String(n), label: t('reminders.days', { count: n }) }))}
        />
        <p className="text-label text-text-muted">{t('reminders.yearly', { count: settings.yearlyReminderDays })}</p>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            commitBudget();
          }}
        >
          <Input
            label={t('reminders.budget')}
            prefix="€"
            inputMode="decimal"
            value={budgetValue}
            onChange={(e) => setBudgetValue(e.target.value)}
            onBlur={commitBudget}
            hint={t('reminders.budgetHint')}
            error={budgetError}
          />
        </form>
      </Card>

      <Card id="settings-family" title={t('settings.family')}>
        <ul className="flex flex-col gap-1">
          {familyMembers.map((m) => (
            <li key={m.id} className="flex min-h-11 items-center justify-between gap-2">
              <span className="text-body text-text">{memberName(m.id)}</span>
              {m.id !== DEFAULT_MEMBER_ID && (
                <button
                  type="button"
                  aria-label={t('family.remove', { name: m.name })}
                  onClick={() => removeFamilyMember(m.id)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted"
                >
                  <Trash2 {...ICON_SM} />
                </button>
              )}
            </li>
          ))}
        </ul>
        <p className="text-caption text-text-muted">{t('family.meNote')}</p>
        <form onSubmit={addMember} className="flex flex-wrap items-end gap-2">
          <Input label={t('family.newName')} value={newMember} onChange={(e) => setNewMember(e.target.value)} containerClassName="flex-1" />
          <Button type="submit" variant="secondary" icon={UserPlus} disabled={!newMember.trim()}>
            {t('family.add')}
          </Button>
        </form>
      </Card>

      <Card id="settings-demo" title={t('settings.demo')}>
        <Input
          label={t('demo.date')}
          type="date"
          value={settings.demoDate ?? ''}
          onChange={(e) => {
            if (isValidISO(e.target.value)) setSettings({ demoDate: e.target.value });
          }}
          hint={settings.demoDate ? t('demo.dateHint') : t('demo.usingReal')}
        />
        <Button variant="ghost" icon={RotateCcw} disabled={!settings.demoDate} onClick={() => setSettings({ demoDate: undefined })}>
          {t('demo.realDate')}
        </Button>
        <Button variant="danger" fullWidth onClick={() => setConfirm('reset')}>
          {t('demo.reset')}
        </Button>
        <Button variant="ghost" fullWidth onClick={() => setConfirm('startOver')}>
          {t('demo.startOver')}
        </Button>
      </Card>

      <Card id="settings-about" title={t('settings.about')}>
        <p className="text-body text-text-muted">{t('about.text')}</p>
        <p className="text-caption text-text-muted">{t('about.credits')}</p>
      </Card>

      <ConfirmOverlay
        open={confirm === 'reset'}
        title={t('demo.resetTitle')}
        body={t('demo.resetBody')}
        confirmLabel={t('demo.reset')}
        cancelLabel={t('action.goBack')}
        onConfirm={() => {
          resetDemo();
          setConfirm(null);
          showToast(t('toast.reset'));
        }}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmOverlay
        open={confirm === 'startOver'}
        title={t('demo.startOverTitle')}
        body={t('demo.startOverBody')}
        confirmLabel={t('demo.startOver')}
        cancelLabel={t('action.goBack')}
        onConfirm={() => {
          setConfirm(null);
          startOver();
          navigate('/welcome', { replace: true });
        }}
        onCancel={() => setConfirm(null)}
      />
    </main>
  );
}
