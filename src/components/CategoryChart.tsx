import type { CategorySpend } from '../lib/calculations';
import { money } from '../lib/format';
import { useLang, useT } from '../store/selectors';

export interface CategoryChartProps {
  data: CategorySpend[];
}

/** Plain horizontal bars: label + bar + amount. The text is the accessible content. */
export function CategoryChart({ data }: CategoryChartProps) {
  const t = useT();
  const lang = useLang();
  const max = Math.max(0, ...data.map((d) => d.amount));
  return (
    <section aria-labelledby="category-chart-title" className="rounded-lg border border-border bg-surface p-4">
      <h2 id="category-chart-title" className="text-heading text-text">
        {t('chart.category.title')}
      </h2>
      {data.length === 0 ? (
        <p className="mt-2 text-body text-text-muted">{t('chart.category.empty')}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {data.map((d) => (
            <li key={d.category} className="grid grid-cols-[minmax(5.5rem,auto)_1fr_auto] items-center gap-3">
              <span className="text-label text-text">{t(`category.${d.category}`)}</span>
              <span className="block h-2 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${max ? (d.amount / max) * 100 : 0}%` }} />
              </span>
              <span className="text-right text-label tabular-nums text-text">{money(d.amount, lang)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
