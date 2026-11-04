import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy as CopyIcon, Tag } from 'lucide-react';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { OfferCard } from '../components/OfferCard';
import { Overlay } from '../components/Overlay';
import { ICON } from '../components/iconProps';
import { regularMonthly } from '../lib/calculations';
import { countWord, money } from '../lib/format';
import type { OfferMatch } from '../lib/offers';
import { useDuplicates, useLang, useOffers, useT } from '../store/selectors';
import { usePageTitle } from './usePageTitle';

export default function Offers() {
  const t = useT();
  const lang = useLang();
  const navigate = useNavigate();
  const { matches, totalSaving } = useOffers();
  const duplicates = useDuplicates();
  const [selected, setSelected] = useState<OfferMatch | null>(null);
  usePageTitle(t('offers.title'));

  const empty = matches.length === 0 && duplicates.length === 0;

  return (
    <>
      <main className="mx-auto flex w-full max-w-[480px] flex-col gap-3 px-4 pb-[calc(64px+env(safe-area-inset-bottom)+32px)] pt-4">
        <h1 className="text-title text-text">{t('offers.title')}</h1>

        {totalSaving > 0 && (
          <section aria-labelledby="offers-saving" className="rounded-lg border border-border bg-surface p-5">
            <p id="offers-saving" className="break-words text-display tabular-nums text-success">
              {t('offers.saveUpTo', { amount: money(totalSaving, lang) })}
            </p>
            <p className="mt-1 text-label text-text-muted">{t('offers.subtitle')}</p>
          </section>
        )}

        {empty && <EmptyState icon={Tag} title={t('offers.empty')} body={t('offers.emptyBody')} />}

        {matches.length > 0 && (
          <section aria-labelledby="offers-list" className="flex flex-col gap-3">
            <h2 id="offers-list" className="text-heading text-text">
              {t('offers.listTitle')}
            </h2>
            <p className="text-caption text-text-muted">{t('offers.disclosure')}</p>
            <ul className="flex flex-col gap-3">
              {matches.map((m) => (
                <li key={`${m.offer.id}-${m.sub.id}`}>
                  <OfferCard offer={m.offer} saving={m.saving} replaces={m.sub.name} onView={() => setSelected(m)} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {duplicates.length > 0 && (
          <section aria-labelledby="offers-duplicates" className="flex flex-col gap-3">
            <h2 id="offers-duplicates" className="flex items-center gap-2 text-heading text-text">
              <CopyIcon {...ICON} className="text-text-muted" />
              {t('offers.duplicates')}
            </h2>
            {duplicates.map((group) => (
              <article key={group.category} className="flex flex-col gap-2 rounded-md border border-border bg-surface p-4">
                <p className="text-body text-text">
                  {t(`offers.duplicateBody_${group.category}`, { count: countWord(group.subs.length, t) })}
                </p>
                <ul className="flex flex-col gap-1">
                  {group.subs.map((s) => (
                    <li key={s.id} className="flex flex-wrap items-center justify-between gap-x-2">
                      <Link
                        to={`/subscription/${s.id}`}
                        className="inline-flex min-h-11 items-center font-semibold text-primary underline underline-offset-2"
                      >
                        {s.name}
                      </Link>
                      <span className="text-label tabular-nums text-text-muted">
                        {t('price.perMonth', { amount: money(regularMonthly(s), lang) })}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-label font-semibold tabular-nums text-success">
                  {t('offers.duplicateSaving', { amount: money(group.saving, lang) })}
                </p>
              </article>
            ))}
          </section>
        )}
      </main>

      <Overlay
        open={selected !== null}
        title={selected?.offer.title ?? t('offers.details')}
        onClose={() => setSelected(null)}
        footer={
          selected ? (
            <div className="flex flex-col gap-2">
              <Button fullWidth onClick={() => navigate(`/subscription/${selected.sub.id}?cancel=1`)}>
                {t('offers.switch')}
              </Button>
              <Button fullWidth variant="secondary" onClick={() => setSelected(null)}>
                {t('action.close')}
              </Button>
            </div>
          ) : undefined
        }
      >
        {selected && (
          <div className="flex flex-col gap-3">
            {selected.offer.sponsored && (
              <div>
                <Badge tone="sponsored">{t('badge.sponsored')}</Badge>
              </div>
            )}
            <p className="text-body text-text">{selected.offer.description}</p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-body tabular-nums">
              <dt className="text-text-muted">{t('field.price')}</dt>
              <dd className="text-text">{t('offers.price', { amount: money(selected.offer.monthlyPrice, lang) })}</dd>
              <dt className="text-text-muted">{t('offers.savingLabel')}</dt>
              <dd className="font-semibold text-success">{t('offers.saving', { amount: money(selected.saving, lang) })}</dd>
            </dl>
            <p className="text-label text-text-muted">{t('offers.replaces', { name: selected.sub.name })}</p>
          </div>
        )}
      </Overlay>
    </>
  );
}
