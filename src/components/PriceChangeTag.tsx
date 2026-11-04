import { TrendingDown, TrendingUp } from 'lucide-react';
import { money, percent } from '../lib/format';
import { useLang, useT } from '../store/selectors';
import { Badge } from './Badge';

export interface PriceChangeTagProps {
  oldPrice: number;
  newPrice: number;
}

export function PriceChangeTag({ oldPrice, newPrice }: PriceChangeTagProps) {
  const t = useT();
  const lang = useLang();
  const up = newPrice > oldPrice;
  const pct = oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0;
  const description = t(up ? 'priceChange.up' : 'priceChange.down', { old: money(oldPrice, lang), new: money(newPrice, lang) });
  return (
    <span title={description}>
      <Badge tone={up ? 'danger' : 'success'} icon={up ? TrendingUp : TrendingDown}>
        <span aria-hidden="true">{percent(pct)}</span>
        <span className="sr-only">{description}</span>
      </Badge>
    </span>
  );
}
