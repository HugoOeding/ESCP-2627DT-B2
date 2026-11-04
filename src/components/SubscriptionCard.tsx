import { Ban, Users } from 'lucide-react';
import type { PriceChange, Subscription } from '../types';
import { cn } from '../lib/cn';
import { countdownFor } from '../lib/contracts';
import { isInTrial } from '../lib/calculations';
import { pricePerCycle } from '../lib/format';
import { useLang, useT, useToday } from '../store/selectors';
import { Badge } from './Badge';
import { CountdownBadge } from './CountdownBadge';
import { PriceChangeTag } from './PriceChangeTag';
import { ServiceIcon } from './ServiceIcon';

export interface SubscriptionCardProps {
  subscription: Subscription;
  priceChange?: PriceChange;
  sharedStatus?: { paid: number; total: number };
  assignedName?: string;
  onClick?: () => void;
  today?: string;
}

const countdownLabel = { trialEnds: 'countdown.trialEnds', cancelBy: 'countdown.cancelBy', renews: 'countdown.renews' } as const;

export function SubscriptionCard({ subscription: sub, priceChange, sharedStatus, assignedName, onClick, today }: SubscriptionCardProps) {
  const t = useT();
  const lang = useLang();
  const storeToday = useToday();
  const todayISO = today ?? storeToday;
  const cancelled = sub.status === 'cancelled';
  const countdown = countdownFor(sub, todayISO);
  const trial = isInTrial(sub, todayISO);

  return (
    <button
      type="button"
      onClick={onClick}
      className="press flex w-full items-start gap-3 rounded-md border border-border bg-surface p-3 text-left hover:bg-surface-muted"
    >
      <ServiceIcon name={sub.name} category={sub.category} />
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className={cn('min-w-0 break-words text-heading', cancelled ? 'text-text-muted' : 'text-text')}>
            {sub.name}
          </span>
          {countdown && (
            <span className="shrink-0">
              <CountdownBadge date={countdown.date} label={t(countdownLabel[countdown.kind])} today={todayISO} />
            </span>
          )}
        </span>
        <span className={cn('block text-label tabular-nums', cancelled ? 'text-text-muted line-through' : 'text-text-muted')}>
          {pricePerCycle(sub.price, sub.billingCycle, lang, t)}
        </span>
        {(cancelled || trial || priceChange || sharedStatus || assignedName) && (
          <span className="mt-2 flex flex-wrap gap-1">
            {cancelled && (
              <Badge tone="neutral" icon={Ban}>
                {t('badge.cancelled')}
              </Badge>
            )}
            {!cancelled && trial && <Badge tone="primary">{t('badge.trial')}</Badge>}
            {!cancelled && priceChange && <PriceChangeTag oldPrice={priceChange.oldPrice} newPrice={priceChange.newPrice} />}
            {!cancelled && sharedStatus && (
              <Badge tone={sharedStatus.paid === sharedStatus.total ? 'success' : 'neutral'} icon={Users}>
                {t('badge.shared', sharedStatus)}
              </Badge>
            )}
            {assignedName && <Badge tone="neutral">{t('card.assigned', { name: assignedName })}</Badge>}
          </span>
        )}
      </span>
    </button>
  );
}
