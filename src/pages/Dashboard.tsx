import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileUp, Plus, Upload, Wallet } from 'lucide-react';
import type { Alert, DetectedPayment, Translate } from '../types';
import { AlertBox } from '../components/AlertBox';
import { BudgetBar } from '../components/BudgetBar';
import { Button, buttonClasses } from '../components/Button';
import { CategoryChart } from '../components/CategoryChart';
import { DetectedPaymentRow } from '../components/DetectedPaymentRow';
import { EmptyState } from '../components/EmptyState';
import { Fab } from '../components/Fab';
import { FilterMenu } from '../components/FilterMenu';
import { Input } from '../components/Input';
import { Logo } from '../components/Logo';
import { Overlay } from '../components/Overlay';
import { PrivacyNote } from '../components/PrivacyNote';
import { SegmentedControl } from '../components/SegmentedControl';
import { SubscriptionCard } from '../components/SubscriptionCard';
import { SummaryCard } from '../components/SummaryCard';
import { TipCard } from '../components/TipCard';
import { ICON } from '../components/iconProps';
import {
  filterByMember,
  hasBudget,
  isCounted,
  recentPriceChange,
  regularMonthly,
  savedPerMonth,
  sharedStatus,
  spendByCategory,
} from '../lib/calculations';
import { cn } from '../lib/cn';
import { countWord, money } from '../lib/format';
import { assertFileSize, detectRecurring, parseAmount, parseCsv } from '../lib/statementParser';
import { priceToString } from '../lib/subscriptionForm';
import type { Tip } from '../lib/tips';
import { catalogue, useStore } from '../store/useStore';
import { useAlerts, useLang, useMemberName, useT, useTips, useToday, useTotals } from '../store/selectors';
import { statementSource } from './statementSource';
import { usePageTitle } from './usePageTitle';

type SortKey = 'price' | 'renewal';
const EVERYONE = 'everyone';

function tipText(tip: Tip, t: Translate, lang: 'en' | 'de'): { text: string; saving?: string } {
  switch (tip.kind) {
    case 'duplicate':
      return { text: t(`tips.duplicate_${tip.category}`, { count: countWord(tip.count, t), saving: money(tip.saving, lang) }) };
    case 'most_expensive':
      return { text: t('tips.mostExpensive', { name: tip.name }), saving: money(tip.saving, lang) };
    case 'back_under_budget':
      return {
        text: t('tips.backUnderBudget', { name: tip.name, limit: money(tip.limit, lang, { trimZero: true }) }),
        saving: money(tip.saving, lang),
      };
  }
}

function BudgetSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const lang = useLang();
  const limit = useStore((s) => s.budget.monthlyLimit);
  const setBudget = useStore((s) => s.setBudget);
  const showToast = useStore((s) => s.showToast);
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(limit > 0 ? priceToString(limit, lang) : '');
      setError(undefined);
    }
  }, [open, limit, lang]);

  const save = () => {
    const amount = value.trim() === '' ? 0 : parseAmount(value.trim());
    if (amount === null || amount < 0) {
      setError(t('budgetSheet.error'));
      inputRef.current?.focus();
      return;
    }
    setBudget(amount);
    showToast(t(amount > 0 ? 'toast.budgetSaved' : 'toast.budgetRemoved'));
    onClose();
  };

  return (
    <Overlay
      open={open}
      title={t('budgetSheet.title')}
      onClose={onClose}
      initialFocusRef={inputRef}
      footer={
        <div className="flex flex-col gap-2">
          <Button fullWidth onClick={save}>
            {t('budgetSheet.save')}
          </Button>
          {limit > 0 && (
            <Button
              fullWidth
              variant="ghost"
              onClick={() => {
                setBudget(0);
                showToast(t('toast.budgetRemoved'));
                onClose();
              }}
            >
              {t('budgetSheet.remove')}
            </Button>
          )}
        </div>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <Input
          ref={inputRef}
          label={t('budgetSheet.label')}
          prefix="€"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          hint={t('budgetSheet.hint')}
          error={error}
        />
      </form>
    </Overlay>
  );
}

function StatementImport({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const subscriptions = useStore((s) => s.subscriptions);
  const importDetected = useStore((s) => s.importDetected);
  const showToast = useStore((s) => s.showToast);
  const [detected, setDetected] = useState<DetectedPayment[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileId = useId();

  const reset = () => {
    setDetected(null);
    setSelected(new Set());
    setError(null);
    setLoading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const close = () => {
    reset();
    onClose();
  };

  /** Unreadable or oversized files get the same copy (design.md §7); the hint states the 2 MB limit. */
  const fail = () => {
    setDetected(null);
    setError(t('import.errorCsv'));
  };

  /** The text and its transactions live only inside this call; only the detections are kept. */
  const analyse = async (load: () => Promise<string>) => {
    setLoading(true);
    setError(null);
    try {
      const found = detectRecurring(parseCsv(await load()), subscriptions, catalogue);
      setDetected(found);
      setSelected(new Set(found.filter((d) => !d.alreadyTracked).map((d) => d.key)));
    } catch {
      fail();
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      assertFileSize(file.size);
    } catch {
      fail();
      e.target.value = '';
      return;
    }
    void analyse(() => statementSource.readFile(file));
  };

  const addable = (detected ?? []).filter((d) => !d.alreadyTracked && selected.has(d.key));

  const add = () => {
    const count = importDetected(addable);
    showToast(t('import.success', { count }));
    close();
  };

  return (
    <Overlay
      open={open}
      title={t('import.title')}
      onClose={close}
      footer={
        detected && detected.length > 0 ? (
          <Button fullWidth disabled={addable.length === 0} onClick={add}>
            {t('import.add', { count: addable.length })}
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-3">
        <PrivacyNote />
        <div className="flex flex-col gap-1">
          <input
            ref={fileRef}
            id={fileId}
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            aria-describedby={`${fileId}-hint`}
            className="peer sr-only"
          />
          <label
            htmlFor={fileId}
            className={cn(
              buttonClasses({ variant: 'secondary', fullWidth: true }),
              'cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface',
            )}
          >
            <FileUp {...ICON} />
            {t('import.choose')}
          </label>
          <p id={`${fileId}-hint`} className="text-caption text-text-muted">
            {t('import.chooseHint')}
          </p>
        </div>
        <Button variant="ghost" fullWidth loading={loading} loadingLabel={t('import.reading')} onClick={() => void analyse(statementSource.loadSample)}>
          {t('import.sample')}
        </Button>
        {error && (
          <p role="alert" className="rounded-md bg-danger-soft p-3 text-label text-danger">
            {error}
          </p>
        )}
        <div aria-live="polite">
          {detected && (
            <section aria-labelledby={`${fileId}-results`} className="flex flex-col gap-2">
              <h3 id={`${fileId}-results`} className="text-heading text-text">
                {detected.length > 0 ? t('import.found', { count: detected.length }) : t('import.none')}
              </h3>
              <ul className="flex flex-col gap-2">
                {detected.map((d) => (
                  <li key={d.key}>
                    <DetectedPaymentRow
                      payment={d}
                      checked={selected.has(d.key)}
                      onToggle={(checked) =>
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (checked) next.add(d.key);
                          else next.delete(d.key);
                          return next;
                        })
                      }
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </Overlay>
  );
}

export default function Dashboard() {
  const t = useT();
  const lang = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const todayISO = useToday();
  const subscriptions = useStore((s) => s.subscriptions);
  const priceChanges = useStore((s) => s.priceChanges);
  const sharedPlans = useStore((s) => s.sharedPlans);
  const familyMembers = useStore((s) => s.familyMembers);
  const budget = useStore((s) => s.budget);
  const budgetPromptDismissed = useStore((s) => s.budgetPromptDismissed);
  const dismissBudgetPrompt = useStore((s) => s.dismissBudgetPrompt);
  const memberName = useMemberName();
  const [filter, setFilter] = useState(EVERYONE);
  const [sort, setSort] = useState<SortKey>('price');
  const [importOpen, setImportOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  usePageTitle(t('dashboard.title'));

  const memberFilter = filter !== EVERYONE && familyMembers.some((m) => m.id === filter) ? filter : undefined;
  const totals = useTotals(memberFilter);
  const alerts = useAlerts();
  const tips = useTips();

  useEffect(() => {
    const state = location.state as { openImport?: boolean } | null;
    if (state?.openImport) {
      setImportOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  const visible = useMemo(() => filterByMember(subscriptions, memberFilter), [subscriptions, memberFilter]);
  const active = useMemo(() => {
    const list = visible.filter(isCounted);
    return sort === 'price'
      ? list.sort((a, b) => regularMonthly(b) - regularMonthly(a) || a.name.localeCompare(b.name))
      : list.sort((a, b) => a.nextRenewal.localeCompare(b.nextRenewal) || a.name.localeCompare(b.name));
  }, [visible, sort]);
  const cancelled = useMemo(() => visible.filter((s) => !isCounted(s)).sort((a, b) => a.name.localeCompare(b.name)), [visible]);
  const categories = useMemo(() => spendByCategory(subscriptions, todayISO, memberFilter), [subscriptions, todayISO, memberFilter]);
  const saved = savedPerMonth(subscriptions, memberFilter);
  const filterOptions = [
    { value: EVERYONE, label: t('filter.everyone') },
    ...familyMembers.map((m) => ({ value: m.id, label: memberName(m.id) })),
  ];

  const openAlert = (alert: Alert) => {
    if (alert.subscriptionId) navigate(`/subscription/${alert.subscriptionId}`);
    else setBudgetOpen(true);
  };

  const renderCard = (id: string) => {
    const sub = subscriptions.find((s) => s.id === id);
    if (!sub) return null;
    const plan = sharedPlans.find((p) => p.subscriptionId === sub.id);
    return (
      <li key={sub.id}>
        <SubscriptionCard
          subscription={sub}
          today={todayISO}
          priceChange={recentPriceChange(sub.id, priceChanges, todayISO)}
          sharedStatus={plan ? sharedStatus(plan) : undefined}
          assignedName={!memberFilter && sub.assignedTo && sub.assignedTo !== 'me' ? memberName(sub.assignedTo) : undefined}
          onClick={() => navigate(`/subscription/${sub.id}`)}
        />
      </li>
    );
  };

  const showBudgetPrompt = !budgetPromptDismissed && !hasBudget(budget);
  const empty = subscriptions.length === 0;

  return (
    <>
      <main className="mx-auto flex w-full max-w-[480px] flex-col gap-3 px-4 pb-[calc(64px+env(safe-area-inset-bottom)+96px)] pt-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Logo showWordmark={false} size={32} />
            <h1 className="min-w-0 text-title text-text">{t('dashboard.title')}</h1>
          </div>
          {!empty && (
            <div className="ml-auto">
              <FilterMenu options={filterOptions} value={memberFilter ?? EVERYONE} onChange={setFilter} />
            </div>
          )}
        </header>

        {showBudgetPrompt && (
          <section aria-labelledby="budget-prompt-title" className="flex flex-col gap-3 rounded-lg bg-primary-soft p-4">
            <div className="flex items-start gap-3">
              <Wallet {...ICON} className="mt-0.5 shrink-0 text-primary" />
              <div>
                <h2 id="budget-prompt-title" className="text-heading text-text">
                  {t('budgetPrompt.title')}
                </h2>
                <p className="text-body text-text-muted">{t('budgetPrompt.body')}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setBudgetOpen(true)}>
                {t('budgetPrompt.set')}
              </Button>
              <Button size="sm" variant="ghost" onClick={dismissBudgetPrompt}>
                {t('budgetPrompt.dismiss')}
              </Button>
            </div>
          </section>
        )}

        {empty ? (
          <EmptyState
            icon={Plus}
            title={t('empty.title')}
            body={t('empty.body')}
            actions={
              <>
                <Button fullWidth icon={Plus} onClick={() => navigate('/subscription/new')}>
                  {t('empty.manual')}
                </Button>
                <Button fullWidth variant="secondary" icon={Upload} onClick={() => setImportOpen(true)}>
                  {t('empty.import')}
                </Button>
              </>
            }
          />
        ) : (
          <>
            <SummaryCard monthlyTotal={totals.monthly} yearlyTotal={totals.yearly} count={totals.count} savedPerMonth={saved} />
            <BudgetBar spent={totals.monthly} limit={budget.monthlyLimit} onEdit={() => setBudgetOpen(true)} />
            <AlertBox alerts={alerts} onSelect={openAlert} />
            <Button variant="secondary" icon={Upload} fullWidth onClick={() => setImportOpen(true)}>
              {t('dashboard.import')}
            </Button>
            <CategoryChart data={categories} />

            <section aria-labelledby="list-title" className="flex flex-col gap-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 id="list-title" className="text-heading text-text">
                  {t('list.title')}
                </h2>
                <div className="w-48 max-w-full">
                  <SegmentedControl
                    label={t('sort.label')}
                    hideLabel
                    size="sm"
                    value={sort}
                    onChange={setSort}
                    options={[
                      { value: 'price', label: t('sort.price') },
                      { value: 'renewal', label: t('sort.renewal') },
                    ]}
                  />
                </div>
              </div>
              {active.length === 0 && cancelled.length === 0 && (
                <p className="text-body text-text-muted">{t('list.empty', { name: memberName(memberFilter ?? 'me') })}</p>
              )}
              {active.length > 0 && <ul className="flex flex-col gap-3">{active.map((s) => renderCard(s.id))}</ul>}
              {cancelled.length > 0 && (
                <>
                  <h3 className="text-label text-text-muted">{t('list.cancelled')}</h3>
                  <ul className="flex flex-col gap-3">{cancelled.map((s) => renderCard(s.id))}</ul>
                </>
              )}
            </section>

            {tips.length > 0 && (
              <section aria-label={t('tips.title')} className="flex flex-col gap-3">
                {tips.map((tip) => {
                  const { text, saving } = tipText(tip, t, lang);
                  return (
                    <TipCard
                      key={tip.id}
                      text={text}
                      saving={saving}
                      action={
                        tip.kind !== 'duplicate' ? (
                          <Button size="sm" variant="secondary" onClick={() => navigate(`/subscription/${tip.subscriptionId}`)}>
                            {t('tips.open', { name: tip.name })}
                          </Button>
                        ) : undefined
                      }
                    />
                  );
                })}
              </section>
            )}
          </>
        )}
      </main>
      <Fab onClick={() => navigate('/subscription/new')} />
      <StatementImport open={importOpen} onClose={() => setImportOpen(false)} />
      <BudgetSheet open={budgetOpen} onClose={() => setBudgetOpen(false)} />
    </>
  );
}
