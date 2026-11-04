import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';
import { ICON } from './iconProps';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'sm';

interface StyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary/90',
  secondary: 'bg-surface text-text border border-border hover:bg-surface-muted',
  ghost: 'bg-transparent text-primary hover:bg-primary-soft',
  danger: 'bg-danger-soft text-danger hover:bg-danger-soft/80',
};

export function buttonClasses({ variant = 'primary', size = 'md', fullWidth }: StyleProps): string {
  return cn(
    'press inline-flex items-center justify-center gap-2 rounded-md font-semibold no-underline',
    'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50',
    size === 'md' ? 'min-h-12 px-5 text-body' : 'min-h-11 px-4 text-label',
    variants[variant],
    fullWidth && 'w-full',
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, StyleProps {
  icon?: LucideIcon;
  loading?: boolean;
  loadingLabel?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, fullWidth, icon: Icon, loading, loadingLabel, className, children, disabled, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonClasses({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 {...ICON} className="animate-spin motion-reduce:animate-none" />
          {loadingLabel && <span className="sr-only">{loadingLabel}</span>}
        </>
      ) : (
        Icon && <Icon {...ICON} />
      )}
      <span className="min-w-0">{children}</span>
    </button>
  );
});

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement>, StyleProps {
  icon?: LucideIcon;
}

/** An anchor styled as a button, for external links such as "Cancel online". */
export function ButtonLink({ variant, size, fullWidth, icon: Icon, className, children, ...rest }: ButtonLinkProps) {
  return (
    <a className={cn(buttonClasses({ variant, size, fullWidth }), className)} {...rest}>
      {Icon && <Icon {...ICON} />}
      <span className="min-w-0">{children}</span>
    </a>
  );
}
