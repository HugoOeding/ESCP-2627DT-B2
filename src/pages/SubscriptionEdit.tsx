import { Suspense, lazy, useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Ban, ExternalLink, FileText, RotateCcw, Trash2, UserPlus, X } from 'lucide-react';
import { CATEGORIES, type Language, type Service } from '../types';
import services from '../data/services.json';
import { Badge } from '../components/Badge';
import { Button, ButtonLink } from '../components/Button';
import { ConfirmOverlay } from '../components/ConfirmOverlay';
import { Input } from '../components/Input';
import { LetterPreview } from '../components/LetterPreview';
import { Overlay } from '../components/Overlay';
import { PriceChangeTag } from '../components/PriceChangeTag';
import { SegmentedControl } from '../components/SegmentedControl';
import { Select } from '../components/Select';
import { Toggle } from '../components/Toggle';
import { ICON, ICON_SM } from '../components/iconProps';
import { latestPriceChange, priceHistory, regularMonthly } from '../lib/calculations';
import { cn } from '../lib/cn';
import { lastDayToCancel } from '../lib/contracts';
import { daysUntil, isValidISO, nextRenewal } from '../lib/dates';
import { date as formatDate, money } from '../lib/format';
import { buildLetter, buildMailto, letterFileName, missingProfileFields } from '../lib/letter';
import {
  QUICK_PICK_IDS,
  customForm,
  emptyForm,
  firstInvalidField,
  formFromService,
  formFromSubscription,
  formMembers,
  formShares,
  formToInput,
  parsePrice,
  searchServices,
  splitDifference,
  userMemberName,
  validateForm,
  type FormErrors,
  type FormField,
  type SplitMode,
  type SubscriptionForm,
} from '../lib/subscriptionForm';
import { useStore } from '../store/useStore';
import { useLang, useMemberName, useSharedPlan, useSubscription, useT, useToday } from '../store/selectors';
import { copyText, downloadText } from './browserActions';
import { usePageTitle } from './usePageTitle';

const catalogue = services as Service[];
// Recharts is only needed here, so it is loaded on demand and kept out of the first bundle.
const PriceHistoryChart = lazy(() => import('../components/PriceHistoryChart').then((m) => ({ default: m.PriceHistoryChart })));
const quickPicks = QUICK_PICK_IDS.map((id) => catalogue.find((s) => s.id === id)).filter((s): s is Service => !!s);

function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <h2 id={id} className="text-heading text-text">
        {title}
      </h2>
      {children}
    </section>
  );
}

const chipClasses = (pressed: boolean) =>
  cn(
    'press min-h-11 rounded-full px-4 text-label',
    pressed ? 'bg-primary-soft text-primary ring-1 ring-primary' : 'bg-surface-muted text-text hover:bg-primary-soft',
  );

export default function SubscriptionEdit() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const t = useT();
  const lang = useLang();
  const todayISO = useToday();
  const existing = useSubscription(id);
  const plan = useSharedPlan(id);
  const profile = useStore((s) => s.profile);
  const familyMembers = useStore((s) => s.familyMembers);
  const priceChanges = useStore((s) => s.priceChanges);
  const addSubscription = useStore((s) => s.addSubscription);
  const updateSubscription = useStore((s) => s.updateSubscription);
  const setSharedPlan = useStore((s) => s.setSharedPlan);
  const removeSharedPlan = useStore((s) => s.removeSharedPlan);
  const togglePaid = useStore((s) => s.togglePaid);
  const markCancelled = useStore((s) => s.markCancelled);
  const reactivate = useStore((s) => s.reactivate);
  const deleteSubscription = useStore((s) => s.deleteSubscription);
  const showToast = useStore((s) => s.showToast);
  const memberName = useMemberName();
  const uid = useId();

  const userName = userMemberName(profile.name, t('split.you'));
  const [form, setForm] = useState<SubscriptionForm>(() =>
    existing ? formFromSubscription(existing, plan, lang, userName) : emptyForm(todayISO, userName),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [query, setQuery] = useState('');
  const [custom, setCustom] = useState(false);
  const [newMember, setNewMember] = useState('');
  const [letterOpen, setLetterOpen] = useState(false);
  const [letterLang, setLetterLang] = useState<Language>(lang);
  const [confirm, setConfirm] = useState<'cancel' | 'delete' | null>(null);
  const [highlight, setHighlight] = useState(false);
  const fieldRefs = useRef<Partial<Record<FormField, HTMLElement | null>>>({});
  const cancelHeadingRef = useRef<HTMLHeadingElement>(null);
  const cancelSectionRef = useRef<HTMLElement>(null);

  const isEdit = id !== undefined;
  const title = existing ? existing.name : t('edit.titleAdd');
  usePageTitle(isEdit && !existing ? t('edit.notFound') : title);

  // "Switch" on an offer opens S2 with ?cancel=1: scroll to the cancel actions and highlight them for 2 s.
  useEffect(() => {
    if (params.get('cancel') !== '1' || !cancelSectionRef.current) return undefined;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    cancelSectionRef.current.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    cancelHeadingRef.current?.focus({ preventScroll: true });
    setHighlight(true);
    const timer = setTimeout(() => setHighlight(false), 2000);
    return () => clearTimeout(timer);
  }, [params]);

  const update = <K extends keyof SubscriptionForm>(key: K, value: SubscriptionForm[K], field?: FormField) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (field && errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const fieldRef = (field: FormField) => (el: HTMLElement | null) => {
    fieldRefs.current[field] = el;
  };
  const errorText = (field: FormField) => (errors[field] ? t(errors[field] as string) : undefined);

  const results = useMemo(() => searchServices(catalogue, query), [query]);
  const priceNumber = parsePrice(form.price) ?? 0;
  const shares = formShares(form);
  const difference = splitDifference(form);
  const paidCount = form.members.filter((m, i) => i === 0 || m.paid).length;

  const draftValid = Object.keys(validateForm(form)).length === 0;
  /** What the letter, the deadline and "Cancel online" use: the form when valid, else the saved data. */
  const previewSub = useMemo(
    () => (existing && draftValid ? { ...existing, ...formToInput(form, existing) } : existing),
    [existing, form, draftValid],
  );
  const draftDeadline =
    form.contractOn && isValidISO(form.startDate) && /^\d{1,4}$/.test(form.noticePeriodDays.trim())
      ? lastDayToCancel(
          {
            ...(previewSub ?? { id: 'draft', nextRenewal: '', ...formToInput(form) }),
            startDate: form.startDate,
            billingCycle: form.billingCycle,
            minimumTermEnd: isValidISO(form.minimumTermEnd) ? form.minimumTermEnd : undefined,
            noticePeriodDays: Number(form.noticePeriodDays.trim()),
          },
          todayISO,
        )
      : undefined;

  if (isEdit && !existing) {
    return (
      <main className="mx-auto flex w-full max-w-[480px] flex-col gap-4 px-4 py-10">
        <h1 className="text-title text-text">{t('edit.notFound')}</h1>
        <Link to="/" className="text-body font-semibold text-primary underline">
          {t('edit.toDashboard')}
        </Link>
      </main>
    );
  }

  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/'));

  const pickService = (service: Service) => {
    setCustom(false);
    setForm((f) => formFromService(f, service, lang));
    setErrors({});
  };

  const pickCustom = () => {
    setCustom(true);
    setForm((f) => customForm(f, query.trim() || (f.serviceId ? '' : f.name)));
    setErrors({});
    fieldRefs.current.name?.focus();
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const found = validateForm(form);
    setErrors(found);
    const first = firstInvalidField(found);
    if (first) {
      fieldRefs.current[first]?.focus();
      return;
    }
    const input = formToInput(form, existing);
    const subId = existing ? existing.id : addSubscription(input);
    if (existing) updateSubscription(existing.id, input);
    if (form.splitOn) setSharedPlan(subId, formMembers(form));
    else if (plan) removeSharedPlan(subId);
    showToast(t(existing ? 'toast.saved' : 'toast.added'));
    navigate('/');
  };

  const setSplitMode = (mode: SplitMode) => {
    setForm((f) => ({
      ...f,
      splitMode: mode,
      members:
        mode === 'custom'
          ? f.members.map((m, i) => ({ ...m, share: (formShares(f)[i] ?? 0).toFixed(2) }))
          : f.members,
    }));
  };

  const changeMembers = (change: (members: SubscriptionForm['members']) => SubscriptionForm['members']) => {
    setForm((f) => ({ ...f, members: change(f.members) }));
    if (errors.split) setErrors((e) => ({ ...e, split: undefined }));
  };

  const addPerson = () => {
    const name = newMember.trim();
    if (!name) return;
    changeMembers((members) => [...members, { name, share: '', paid: false }]);
    setNewMember('');
  };

  const togglePaidAt = (index: number) => {
    setForm((f) => ({ ...f, members: f.members.map((m, i) => (i === index ? { ...m, paid: !m.paid } : m)) }));
    // An existing plan keeps paid ticks immediately, like a checklist.
    if (existing && plan && plan.members[index]?.name === form.members[index]?.name) togglePaid(existing.id, index);
  };

  const confirmCancel = () => {
    if (!existing) return;
    const previous = existing.status;
    const saving = regularMonthly(existing);
    markCancelled(existing.id);
    setConfirm(null);
    showToast(t('toast.cancelled', { amount: money(saving, lang) }), {
      label: t('action.undo'),
      onAction: () => updateSubscription(existing.id, { status: previous, cancelledAt: undefined }),
    });
    navigate('/');
  };

  const confirmDelete = () => {
    if (!existing) return;
    deleteSubscription(existing.id);
    setConfirm(null);
    showToast(t('toast.deleted'));
    navigate('/');
  };

  const letter = previewSub ? buildLetter(previewSub, profile, todayISO, letterLang) : null;
  const history = existing ? priceHistory(existing, priceChanges) : [];
  const lastChange = existing ? latestPriceChange(existing.id, priceChanges) : undefined;
  const storedDeadline = existing && existing.status !== 'cancelled' ? lastDayToCancel(existing, todayISO) : undefined;
  const renewal = isValidISO(form.startDate) ? nextRenewal(form.startDate, form.billingCycle, todayISO) : undefined;
  const cancelUrl = previewSub?.cancelUrl;

  return (
    <main className="mx-auto flex w-full max-w-[480px] flex-col gap-3 px-4 pb-24 pt-2">
      <header className="flex items-center gap-1">
        <button
          type="button"
          onClick={goBack}
          aria-label={t('edit.back')}
          className="-ml-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text hover:bg-surface-muted"
        >
          <ArrowLeft {...ICON} />
        </button>
        <h1 className="min-w-0 break-words text-title text-text">{title}</h1>
      </header>

      {existing && existing.status === 'cancelled' && (
        <p className="flex items-center gap-2 text-body text-text-muted">
          <Badge tone="neutral" icon={Ban}>
            {t('badge.cancelled')}
          </Badge>
          {existing.cancelledAt && t('edit.cancelledOn', { date: formatDate(existing.cancelledAt) })}
        </p>
      )}
      {storedDeadline &&
        (storedDeadline.anyTime ? (
          <p className="text-body text-text-muted">{t('edit.anyTime', { date: formatDate(storedDeadline.date) })}</p>
        ) : (
          <p
            className={cn(
              'text-heading tabular-nums',
              daysUntil(storedDeadline.date, todayISO) <= 14 ? 'text-danger' : 'text-text',
            )}
          >
            {t('edit.lastDay', { date: formatDate(storedDeadline.date) })}
          </p>
        ))}

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3">
        <p className="text-caption text-text-muted">{t('field.requiredNote')}</p>

        {!isEdit && (
          <div className="flex flex-col gap-3">
            <Input label={t('edit.search')} type="search" value={query} onChange={(e) => setQuery(e.target.value)} hint={t('edit.searchHint')} />
            <p className="sr-only" aria-live="polite">
              {query.trim() ? t('edit.resultsCount', { count: results.length }) : ''}
            </p>
            <ul aria-label={query.trim() ? t('edit.searchResults') : t('edit.quickPicks')} className="flex flex-wrap gap-2">
              {(query.trim() ? results : quickPicks).map((service) => (
                <li key={service.id}>
                  <button type="button" aria-pressed={form.serviceId === service.id} onClick={() => pickService(service)} className={chipClasses(form.serviceId === service.id)}>
                    {service.name}
                  </button>
                </li>
              ))}
              <li>
                <button type="button" aria-pressed={custom} onClick={pickCustom} className={chipClasses(custom)}>
                  {t('edit.custom')}
                </button>
              </li>
            </ul>
            {query.trim() && results.length === 0 && <p className="text-label text-text-muted">{t('edit.noResults')}</p>}
          </div>
        )}

        <Section title={t('edit.details')} id={`${uid}-details`}>
          <Input
            ref={fieldRef('name')}
            label={t('field.required', { label: t('field.name') })}
            aria-required="true"
            value={form.name}
            onChange={(e) => update('name', e.target.value, 'name')}
            error={errorText('name')}
            autoComplete="off"
          />
          <Input
            ref={fieldRef('price')}
            label={t('field.required', { label: t('field.price') })}
            aria-required="true"
            prefix="€"
            inputMode="decimal"
            value={form.price}
            onChange={(e) => update('price', e.target.value, 'price')}
            error={errorText('price')}
          />
          <SegmentedControl
            label={t('field.cycle')}
            value={form.billingCycle}
            onChange={(v) => update('billingCycle', v)}
            options={[
              { value: 'monthly', label: t('cycle.monthly') },
              { value: 'yearly', label: t('cycle.yearly') },
            ]}
          />
          <Input
            ref={fieldRef('startDate')}
            label={t('field.required', { label: t('field.startDate') })}
            aria-required="true"
            type="date"
            value={form.startDate}
            onChange={(e) => update('startDate', e.target.value, 'startDate')}
            error={errorText('startDate')}
          />
          <Select
            label={t('field.category')}
            value={form.category}
            onChange={(v) => update('category', v as SubscriptionForm['category'])}
            options={CATEGORIES.map((c) => ({ value: c, label: t(`category.${c}`) }))}
          />
          {renewal && <p className="text-label text-text-muted tabular-nums">{t('field.nextRenewal', { date: formatDate(renewal) })}</p>}
        </Section>

        {existing && lastChange && (
          <Section title={t('edit.priceHistory')} id={`${uid}-history`}>
            <Suspense fallback={<div className="h-[100px]" aria-hidden="true" />}>
              <PriceHistoryChart points={history} />
            </Suspense>
            <p className="flex flex-wrap items-center gap-2 text-label text-text-muted">
              <PriceChangeTag oldPrice={lastChange.oldPrice} newPrice={lastChange.newPrice} />
              {t(lastChange.newPrice > lastChange.oldPrice ? 'priceChange.upOn' : 'priceChange.downOn', {
                old: money(lastChange.oldPrice, lang),
                new: money(lastChange.newPrice, lang),
                date: formatDate(lastChange.date),
              })}
            </p>
          </Section>
        )}

        <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
          <Toggle
            label={t('section.trial')}
            description={t('section.trialDescription')}
            checked={form.trialOn}
            controls={`${uid}-trial`}
            onChange={(on) =>
              setForm((f) => ({ ...f, trialOn: on, priceAfterTrial: f.priceAfterTrial || f.price }))
            }
          />
          {form.trialOn && (
            <div id={`${uid}-trial`} className="flex flex-col gap-3">
              <Input
                ref={fieldRef('trialEndDate')}
                label={t('trial.end')}
                type="date"
                value={form.trialEndDate}
                onChange={(e) => update('trialEndDate', e.target.value, 'trialEndDate')}
                error={errorText('trialEndDate')}
              />
              <Input
                ref={fieldRef('priceAfterTrial')}
                label={t('trial.priceAfter')}
                prefix="€"
                inputMode="decimal"
                value={form.priceAfterTrial}
                onChange={(e) => update('priceAfterTrial', e.target.value, 'priceAfterTrial')}
                error={errorText('priceAfterTrial')}
                hint={t('trial.hint')}
              />
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
          <Toggle
            label={t('section.contract')}
            description={t('section.contractDescription')}
            checked={form.contractOn}
            controls={`${uid}-contract`}
            onChange={(on) => update('contractOn', on)}
          />
          {form.contractOn && (
            <div id={`${uid}-contract`} className="flex flex-col gap-3">
              {draftDeadline && (
                <p className="rounded-md bg-surface-muted p-3 text-label text-text tabular-nums">
                  {draftDeadline.anyTime
                    ? t('edit.anyTime', { date: formatDate(draftDeadline.date) })
                    : t('edit.lastDay', { date: formatDate(draftDeadline.date) })}
                </p>
              )}
              <Input
                ref={fieldRef('minimumTermEnd')}
                label={t('contract.minTerm')}
                type="date"
                value={form.minimumTermEnd}
                onChange={(e) => update('minimumTermEnd', e.target.value, 'minimumTermEnd')}
                error={errorText('minimumTermEnd')}
              />
              <Input
                ref={fieldRef('noticePeriodDays')}
                label={t('contract.notice')}
                inputMode="numeric"
                value={form.noticePeriodDays}
                onChange={(e) => update('noticePeriodDays', e.target.value, 'noticePeriodDays')}
                error={errorText('noticePeriodDays')}
                hint={t('contract.noticeHint')}
              />
              <Input label={t('contract.customerNumber')} value={form.customerNumber} onChange={(e) => update('customerNumber', e.target.value)} />
              <Input label={t('contract.providerName')} value={form.providerName} onChange={(e) => update('providerName', e.target.value)} />
              <Input
                label={t('contract.providerAddress')}
                multiline
                rows={2}
                value={form.providerAddress}
                onChange={(e) => update('providerAddress', e.target.value)}
              />
              <Input
                ref={fieldRef('providerEmail')}
                label={t('contract.providerEmail')}
                type="email"
                value={form.providerEmail}
                onChange={(e) => update('providerEmail', e.target.value, 'providerEmail')}
                error={errorText('providerEmail')}
              />
              <Input
                ref={fieldRef('cancelUrl')}
                label={t('contract.cancelUrl')}
                type="url"
                inputMode="url"
                value={form.cancelUrl}
                onChange={(e) => update('cancelUrl', e.target.value, 'cancelUrl')}
                error={errorText('cancelUrl')}
              />
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
          <Toggle
            label={t('section.assign')}
            description={t('section.assignDescription')}
            checked={form.assignOn}
            controls={`${uid}-assign`}
            onChange={(on) => update('assignOn', on)}
          />
          {form.assignOn && (
            <div id={`${uid}-assign`}>
              <Select
                label={t('assign.member')}
                value={form.assignedTo}
                onChange={(v) => update('assignedTo', v)}
                options={familyMembers.map((m) => ({ value: m.id, label: memberName(m.id) }))}
              />
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
          <Toggle
            label={t('section.split')}
            description={t('section.splitDescription')}
            checked={form.splitOn}
            controls={`${uid}-split`}
            onChange={(on) => update('splitOn', on)}
          />
          {form.splitOn && (
            <div id={`${uid}-split`} className="flex flex-col gap-3">
              <SegmentedControl
                label={t('split.mode')}
                value={form.splitMode}
                onChange={setSplitMode}
                options={[
                  { value: 'equal', label: t('split.equal') },
                  { value: 'custom', label: t('split.custom') },
                ]}
              />
              <ul aria-label={t('split.members')} className="flex flex-col gap-2">
                {form.members.map((member, i) => {
                  const label = i === 0 ? t('split.youSuffix', { name: member.name }) : member.name;
                  return (
                    <li key={`${member.name}-${i}`} className="flex flex-col gap-2 rounded-md bg-surface-muted p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 break-words text-body font-semibold text-text">{label}</span>
                        {i > 0 && (
                          <button
                            type="button"
                            aria-label={t('split.remove', { name: member.name })}
                            onClick={() => changeMembers((members) => members.filter((_, j) => j !== i))}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-text-muted hover:bg-surface"
                          >
                            <X {...ICON_SM} />
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        {form.splitMode === 'custom' ? (
                          <Input
                            label={t('split.share', { name: member.name })}
                            prefix="€"
                            inputMode="decimal"
                            value={member.share}
                            containerClassName="w-36"
                            onChange={(e) =>
                              changeMembers((members) => members.map((m, j) => (j === i ? { ...m, share: e.target.value } : m)))
                            }
                          />
                        ) : (
                          <span className="text-body tabular-nums text-text">{money(shares[i] ?? 0, lang)}</span>
                        )}
                        <label className="flex min-h-11 items-center gap-2 text-label text-text">
                          <input
                            type="checkbox"
                            className="h-6 w-6 accent-primary"
                            checked={i === 0 ? true : member.paid}
                            disabled={i === 0}
                            onChange={() => togglePaidAt(i)}
                            aria-label={t('split.paid', { name: member.name })}
                          />
                          {t('split.paidShort')}
                        </label>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="flex flex-wrap items-end gap-2">
                <Input
                  label={t('split.newName')}
                  value={newMember}
                  containerClassName="flex-1"
                  onChange={(e) => setNewMember(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPerson();
                    }
                  }}
                />
                <Button variant="secondary" icon={UserPlus} onClick={addPerson} disabled={!newMember.trim()}>
                  {t('split.addPerson')}
                </Button>
              </div>
              <p className="text-label tabular-nums text-text">
                {t('split.summary', { paid: paidCount, total: form.members.length, share: money(shares[0] ?? 0, lang) })}
              </p>
              {form.splitMode === 'custom' && (
                <p
                  ref={fieldRef('split') as (el: HTMLParagraphElement | null) => void}
                  tabIndex={-1}
                  className={cn('text-label tabular-nums', difference === 0 ? 'text-success' : 'text-danger')}
                >
                  {errors.split && `${t('error.split', { price: money(priceNumber, lang) })}. `}
                  {difference === 0
                    ? t('split.balanced')
                    : t(difference > 0 ? 'split.remaining' : 'split.tooMuch', { amount: money(Math.abs(difference), lang) })}
                </p>
              )}
            </div>
          )}
        </section>

        <Button type="submit" fullWidth>
          {t('action.save')}
        </Button>
      </form>

      {existing && existing.status !== 'cancelled' && (
        <section
          ref={cancelSectionRef}
          aria-labelledby={`${uid}-cancel`}
          className={cn(
            'flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 transition-shadow duration-base ease-standard',
            highlight && 'ring-2 ring-primary ring-offset-2 ring-offset-bg',
          )}
        >
          <h2 id={`${uid}-cancel`} ref={cancelHeadingRef} tabIndex={-1} className="text-heading text-text">
            {t('edit.cancelActions')}
          </h2>
          <Button
            variant="secondary"
            icon={FileText}
            fullWidth
            onClick={() => {
              setLetterLang(lang);
              setLetterOpen(true);
            }}
          >
            {t('action.letter')}
          </Button>
          {cancelUrl && (
            <ButtonLink href={cancelUrl} target="_blank" rel="noopener noreferrer" variant="secondary" icon={ExternalLink} fullWidth>
              {t('action.cancelOnline')}
              <span className="sr-only"> ({t('action.cancelOnlineHint')})</span>
            </ButtonLink>
          )}
          <Button variant="danger" icon={Ban} fullWidth onClick={() => setConfirm('cancel')}>
            {t('action.markCancelled')}
          </Button>
        </section>
      )}

      {existing && existing.status === 'cancelled' && (
        <Button
          variant="secondary"
          icon={RotateCcw}
          fullWidth
          onClick={() => {
            reactivate(existing.id);
            showToast(t('toast.reactivated'));
          }}
        >
          {t('action.reactivate')}
        </Button>
      )}

      {existing && (
        <Button variant="ghost" icon={Trash2} fullWidth onClick={() => setConfirm('delete')}>
          {t('action.delete')}
        </Button>
      )}

      {existing && letter && (
        <Overlay open={letterOpen} title={t('letter.title')} onClose={() => setLetterOpen(false)}>
          <div className="flex flex-col gap-3">
            <SegmentedControl
              label={t('letter.language')}
              value={letterLang}
              onChange={setLetterLang}
              options={[
                { value: 'en', label: t('lang.en') },
                { value: 'de', label: t('lang.de') },
              ]}
            />
            <p className="text-label tabular-nums text-text-muted">{t('letter.termination', { date: formatDate(letter.terminationDate) })}</p>
            <LetterPreview
              letterText={letter.text}
              language={letterLang}
              emailHref={previewSub ? buildMailto(previewSub, letter) : null}
              missingInfo={missingProfileFields(profile).length > 0}
              onOpenSettings={() => setLetterOpen(false)}
              onCopy={async () => showToast(t((await copyText(letter.text)) ? 'toast.copied' : 'toast.copyFailed'))}
              onPrint={() => window.print()}
              onDownload={() => downloadText(letterFileName(existing, todayISO, letterLang), letter.text)}
            />
          </div>
        </Overlay>
      )}

      <ConfirmOverlay
        open={confirm === 'cancel'}
        title={t('confirm.cancelTitle', { name: existing?.name ?? '' })}
        body={t('confirm.cancelBody')}
        confirmLabel={t('action.markCancelled')}
        cancelLabel={t('action.keep')}
        onConfirm={confirmCancel}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmOverlay
        open={confirm === 'delete'}
        title={t('confirm.deleteTitle', { name: existing?.name ?? '' })}
        body={t('confirm.deleteBody')}
        confirmLabel={t('confirm.delete')}
        cancelLabel={t('action.goBack')}
        onConfirm={confirmDelete}
        onCancel={() => setConfirm(null)}
      />
    </main>
  );
}
