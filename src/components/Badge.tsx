import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';
import { ICON_SM } from './iconProps';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'sponsored';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-text-muted',
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  sponsored: 'bg-surface-muted text-sponsored ring-1 ring-inset ring-border',
};

export interface BadgeProps {
  tone?: BadgeTone;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', icon: Icon, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-sm px-2 py-0.5 text-label tabular-nums',
        tones[tone],
        className,
      )}
    >
      {Icon && <Icon {...ICON_SM} className="shrink-0" />}
      <span className="min-w-0 break-words">{children}</span>
    </span>
  );
}
