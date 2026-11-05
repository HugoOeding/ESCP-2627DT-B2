import { useId, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface ToggleProps {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: ReactNode;
  disabled?: boolean;
  /** id of the region this switch shows; referenced only while it is rendered (checked). */
  controls?: string;
}

export function Toggle({ label, checked, onChange, description, disabled, controls }: ToggleProps) {
  const id = useId();
  return (
    <div className="flex min-h-11 items-center justify-between gap-4">
      <div className="min-w-0">
        <span id={`${id}-label`} className="block text-heading text-text">
          {label}
        </span>
        {description && (
          <span id={`${id}-desc`} className="block text-caption text-text-muted">
            {description}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        aria-controls={checked ? controls : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-11 w-14 shrink-0 items-center rounded-full disabled:opacity-50',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-x-0 top-1/2 h-7 -translate-y-1/2 rounded-full border transition-colors duration-fast ease-standard',
            checked ? 'border-primary bg-primary' : 'border-border bg-surface-muted',
          )}
        />
        <span
          aria-hidden="true"
          className={cn(
            'relative ml-1 h-5 w-5 rounded-full shadow-sm transition-transform duration-fast ease-standard motion-reduce:transition-none',
            checked ? 'translate-x-7 bg-on-primary' : 'translate-x-0 bg-text-muted',
          )}
        />
      </button>
    </div>
  );
}
