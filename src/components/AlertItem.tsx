import { Calendar, ChevronRight, Clock, FileText, Repeat, TrendingUp, Wallet, type LucideIcon } from 'lucide-react';
import type { AlertType } from '../types';
import { cn } from '../lib/cn';
import { useT } from '../store/selectors';
import { ICON, ICON_SM } from './iconProps';

type Tone = 'danger' | 'warning' | 'neutral';

export const ALERT_STYLE: Record<AlertType, { tone: Tone; icon: LucideIcon }> = {
  cancel_deadline: { tone: 'danger', icon: FileText },
  trial_end: { tone: 'danger', icon: Clock },
  price_change: { tone: 'warning', icon: TrendingUp },
  yearly_renewal: { tone: 'warning', icon: Calendar },
  renewal: { tone: 'neutral', icon: Repeat },
  budget: { tone: 'warning', icon: Wallet },
};

const labelTone: Record<Tone, string> = { danger: 'text-danger', warning: 'text-warning', neutral: 'text-text-muted' };

const toneClasses: Record<Tone, string> = {
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  neutral: 'bg-surface-muted text-text-muted',
};

export interface AlertItemProps {
  type: AlertType;
  message: string;
  dueDate?: string;
  onClick?: () => void;
}

export function AlertItem({ type, message, onClick }: AlertItemProps) {
  const t = useT();
  const { tone, icon: Icon } = ALERT_STYLE[type];
  const body = (
    <>
      <span className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full', toneClasses[tone])}>
        <Icon {...ICON} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-caption font-medium', labelTone[tone])}>
          {t(`alertType.${type}`)}
        </span>
        <span className="block text-body text-text">{message}</span>
      </span>
      {onClick && <ChevronRight {...ICON_SM} className="shrink-0 text-text-muted" />}
    </>
  );
  const classes = 'flex w-full items-center gap-3 rounded-md px-2 py-2 text-left';
  return onClick ? (
    <button type="button" onClick={onClick} className={cn(classes, 'press min-h-11 hover:bg-surface-muted')}>
      {body}
    </button>
  ) : (
    <div className={classes}>{body}</div>
  );
}
