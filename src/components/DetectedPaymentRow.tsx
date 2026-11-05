import { useId } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import type { DetectedPayment } from '../types';
import { cn } from '../lib/cn';
import { money } from '../lib/format';
import { useLang, useT } from '../store/selectors';
import { Badge } from './Badge';

export interface DetectedPaymentRowProps {
  payment: DetectedPayment;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}

export function DetectedPaymentRow({ payment, checked, onToggle }: DetectedPaymentRowProps) {
  const t = useT();
  const lang = useLang();
  const id = useId();
  const disabled = payment.alreadyTracked;
  const cycle = t(payment.interval === 'monthly' ? 'cycle.monthlyLower' : 'cycle.yearlyLower');
  return (
    <div className={cn('flex items-start gap-3 rounded-md border border-border p-3', disabled ? 'bg-surface-muted' : 'bg-surface')}>
      <input
        id={id}
        type="checkbox"
        checked={disabled ? false : checked}
        disabled={disabled}
        onChange={(e) => onToggle(e.target.checked)}
        aria-describedby={`${id}-meta`}
        className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed"
      />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className={cn('block text-heading', disabled ? 'text-text-muted' : 'cursor-pointer text-text')}>
          {payment.displayName}
        </label>
        <p id={`${id}-meta`} className="text-label tabular-nums text-text-muted">
          {t('detected.meta', { amount: money(payment.amount, lang), cycle, count: payment.occurrences })}
        </p>
        {(disabled || payment.likelyTrial) && (
          <div className="mt-1 flex flex-wrap gap-1">
            {disabled && (
              <Badge tone="neutral" icon={Check}>
                {t('badge.alreadyTracked')}
              </Badge>
            )}
            {payment.likelyTrial && (
              <Badge tone="warning" icon={AlertTriangle}>
                {t('badge.likelyTrial')}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
