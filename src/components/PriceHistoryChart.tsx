import { useEffect, useState } from 'react';
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, XAxis } from 'recharts';
import type { PricePoint } from '../lib/calculations';
import { date as formatDate, money } from '../lib/format';
import { tokenColor } from '../lib/theme';
import { useLang, useT } from '../store/selectors';

export interface PriceHistoryChartProps {
  points: PricePoint[];
}

interface Colors {
  bar: string;
  current: string;
  label: string;
}

function readColors(): Colors {
  return { bar: tokenColor('border'), current: tokenColor('primary'), label: tokenColor('text-muted') };
}

/** Re-reads the token colours whenever the theme class on <html> changes. */
function useTokenColors(): Colors {
  const [colors, setColors] = useState<Colors>(readColors);
  useEffect(() => {
    const observer = new MutationObserver(() => setColors(readColors()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return colors;
}

/** Recharts bars, 100 px tall: past prices in `border`, the current price in `primary`. */
export function PriceHistoryChart({ points }: PriceHistoryChartProps) {
  const t = useT();
  const lang = useLang();
  const colors = useTokenColors();
  const data = points.map((p) => ({ ...p, label: formatDate(p.date).slice(3), value: money(p.price, lang) }));
  const summary = t('edit.priceHistorySummary', {
    list: points.map((p) => `${formatDate(p.date)}: ${money(p.price, lang)}`).join(', '),
  });
  return (
    <div role="img" aria-label={summary} className="h-[100px] w-full">
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={data} margin={{ top: 16, right: 4, bottom: 0, left: 4 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fill: colors.label, fontSize: '0.75rem' }}
            height={18}
          />
          <Bar dataKey="price" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {data.map((d, i) => (
              <Cell key={d.date} fill={i === data.length - 1 ? colors.current : colors.bar} />
            ))}
            <LabelList dataKey="value" position="top" style={{ fill: colors.label, fontSize: '0.75rem' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
