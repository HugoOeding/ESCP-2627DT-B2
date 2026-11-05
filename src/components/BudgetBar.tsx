import { AlertTriangle, CheckCircle2, Wallet } from 'lucide-react';
import { budgetPercent, budgetStatus } from '../lib/calculations';
import { cn } from '../lib/cn';
import { money } from '../lib/format';
import { useLang, useT } from '../store/selectors';
import { ICON, ICON_SM } from './iconProps';

export interface BudgetBarProps {
  spent: number;
  limit: number;
  onEdit?: () => void;
}

const fill = { ok: 'bg-success', warning: 'bg-warning', over: 'bg-danger', none: 'bg-border' } as const;
const textTone = { ok: 'text-success', warning: 'text-warning', over: 'text-danger', none: 'text-text-muted' } as const;

export function BudgetBar({ spent, limit, onEdit }: BudgetBarProps) {
  const t = useT();
  const lang = useLang();
  const status = budgetStatus(spent, limit);

  if (status === 'none') {
    return (
      <section className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4">
        <span className="flex items-center gap-2 text-body text-text-muted">
          <Wallet {...ICON} />
          {t('budget.none')}
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="min-h-11 rounded-sm px-2 text-body font-semibold text-primary underline-offset-2 hover:underline"
        >
          {t('budget.set')}
        </button>
      </section>
    );
  }

  const percent = budgetPercent(spent, limit);
  const StatusIcon = status === 'ok' ? CheckCircle2 : AlertTriangle;
  const content = (
    <>
      <span className="flex items-center justify-between gap-2">
        <span className="text-label text-text-muted">{t('budget.title')}</span>
        <span className={cn('flex items-center gap-1 text-label', textTone[status])}>
          <StatusIcon {...ICON_SM} />
          {t(`budget.status.${status}`)}
        </span>
      </span>
      <span className="mt-1 flex items-baseline justify-between gap-2 tabular-nums">
        <span className="text-heading text-text">
          {t('budget.ofLimit', { spent: money(spent, lang), limit: money(limit, lang) })}
        </span>
        <span className="text-label text-text-muted">{t('budget.percent', { percent })}</span>
      </span>
      <span
        role="progressbar"
        aria-label={t('budget.aria', { percent })}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(percent, 100)}
        className="mt-2 block h-2 overflow-hidden rounded-full bg-surface-muted"
      >
        <span className={cn('block h-full rounded-full', fill[status])} style={{ width: `${Math.min(percent, 100)}%` }} />
      </span>
      <span className={cn('mt-2 block text-label tabular-nums', status === 'over' ? 'text-danger' : 'text-text-muted')}>
        {status === 'over'
          ? t('budget.over', { amount: money(spent - limit, lang) })
          : t('budget.left', { amount: money(limit - spent, lang) })}
      </span>
    </>
  );

  return onEdit ? (
    <button
      type="button"
      onClick={onEdit}
      aria-label={undefined}
      className="press block w-full rounded-lg border border-border bg-surface p-4 text-left"
    >
      <span className="sr-only">{t('budget.edit')}: </span>
      {content}
    </button>
  ) : (
    <section className="rounded-lg border border-border bg-surface p-4">{content}</section>
  );
}
