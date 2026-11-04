import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

type BaseProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  prefix?: string;
  multiline?: boolean;
  rows?: number;
  containerClassName?: string;
};

export type InputProps = BaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> &
  Pick<TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows'>;

export const fieldClasses = (error?: string) =>
  cn(
    'block w-full rounded-sm border bg-surface-muted text-body text-text placeholder:text-text-muted',
    'disabled:cursor-not-allowed disabled:opacity-60',
    error ? 'border-danger' : 'border-transparent hover:border-border',
  );

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(function Input(
  { label, hint, error, prefix, multiline, rows = 3, id, className, containerClassName, type = 'text', ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;
  const common = {
    id: inputId,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
  };

  return (
    <div className={cn('flex flex-col gap-1', containerClassName)}>
      <label htmlFor={inputId} className="text-label text-text">
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-body text-text-muted" aria-hidden="true">
            {prefix}
          </span>
        )}
        {multiline ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            rows={rows}
            className={cn(fieldClasses(error), 'min-h-12 px-3 py-3', className)}
            {...common}
            {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            type={type}
            className={cn(fieldClasses(error), 'h-12 px-3', prefix && 'pl-8', type === 'number' && 'tabular-nums', className)}
            {...common}
            {...rest}
          />
        )}
      </div>
      {error && (
        <p id={errorId} className="text-label text-danger">
          {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="text-caption text-text-muted">
          {hint}
        </p>
      )}
    </div>
  );
});
