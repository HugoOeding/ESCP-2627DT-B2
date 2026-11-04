import type { Offer } from '../types';
import { money } from '../lib/format';
import { useLang, useT } from '../store/selectors';
import { Badge } from './Badge';
import { Button } from './Button';

export interface OfferCardProps {
  offer: Offer;
  saving: number;
  replaces: string;
  onView?: () => void;
}

export function OfferCard({ offer, saving, replaces, onView }: OfferCardProps) {
  const t = useT();
  const lang = useLang();
  return (
    <article className="flex flex-col gap-2 rounded-md border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 text-heading text-text">{offer.title}</h3>
        {offer.sponsored && <Badge tone="sponsored">{t('badge.sponsored')}</Badge>}
      </div>
      <p className="text-label text-text-muted">{t('offers.replaces', { name: replaces })}</p>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="tabular-nums">
          <p className="text-label text-text-muted">{t('offers.price', { amount: money(offer.monthlyPrice, lang) })}</p>
          <p className="text-heading text-success">{t('offers.saving', { amount: money(saving, lang) })}</p>
        </div>
        {onView && (
          <Button variant="secondary" size="sm" onClick={onView} aria-label={t('offers.viewLabel', { title: offer.title })}>
            {t('offers.view')}
          </Button>
        )}
      </div>
    </article>
  );
}
