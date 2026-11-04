import { PiggyBank } from 'lucide-react';
import { money } from '../lib/format';
import { useLang, useT } from '../store/selectors';
import { ICON_SM } from './iconProps';

export interface SummaryCardProps {
  monthlyTotal: number;
  yearlyTotal: number;
  count: number;
  savedPerMonth?: number;
}

export function SummaryCard({ monthlyTotal, yearlyTotal, count, savedPerMonth = 0 }: SummaryCardProps) {
  const t = useT();
  const lang = useLang();
  return (
    <section aria-labelledby="summary-label" className="rounded-lg border border-border bg-surface p-5">
      <p id="summary-label" className="text-label text-text-muted">
        {t('summary.label')}
      </p>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
        <span className="text-display tabular-nums text-text" data-testid="monthly-total">
          {money(monthlyTotal, lang)}
        </span>
        <span className="text-label text-text-muted">{t('summary.perMonth')}</span>
      </p>
      <p className="mt-1 text-label text-text-muted tabular-nums">
        <span data-testid="yearly-total">{t('summary.yearly', { amount: money(yearlyTotal, lang) })}</span>
        {' · '}
        <span data-testid="sub-count">{t('summary.count', { count })}</span>
      </p>
      {savedPerMonth > 0 && (
        <p className="mt-2 flex items-center gap-1 text-label text-text-muted tabular-nums">
          <PiggyBank {...ICON_SM} />
          {t('summary.saved', { amount: money(savedPerMonth, lang) })}
        </p>
      )}
    </section>
  );
}
