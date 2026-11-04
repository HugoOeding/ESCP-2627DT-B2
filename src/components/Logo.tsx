import { cn } from '../lib/cn';
import { useT } from '../store/selectors';

export interface LogoProps {
  showWordmark?: boolean;
  size?: number;
  className?: string;
}

/** Circular renewal arrow in the primary colour plus the "SubTrack" wordmark. */
export function Logo({ showWordmark = true, size = 28, className }: LogoProps) {
  const t = useT();
  return (
    <span className={cn('inline-flex items-center gap-2 text-text', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        className="shrink-0 text-primary"
        role={showWordmark ? undefined : 'img'}
        aria-hidden={showWordmark ? true : undefined}
        aria-label={showWordmark ? undefined : t('app.name')}
      >
        <rect width="32" height="32" rx="8" fill="currentColor" />
        <path d="M23.5 11.5A8.5 8.5 0 1 0 24.5 17" className="stroke-on-primary" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24.5 6.5v5.5H19" className="stroke-on-primary" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showWordmark && <span className="text-title tracking-tight">{t('app.name')}</span>}
    </span>
  );
}
