import { useId, useRef, type KeyboardEvent } from 'react';
import { cn } from '../lib/cn';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  label: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  hideLabel?: boolean;
  size?: 'md' | 'sm';
}

/** A radiogroup with roving focus: arrow keys move and select, Home/End jump. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  hideLabel,
  size = 'md',
}: SegmentedControlProps<T>) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const currentIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  const select = (index: number) => {
    const next = (index + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const keys: Record<string, () => void> = {
      ArrowRight: () => select(currentIndex + 1),
      ArrowDown: () => select(currentIndex + 1),
      ArrowLeft: () => select(currentIndex - 1),
      ArrowUp: () => select(currentIndex - 1),
      Home: () => select(0),
      End: () => select(options.length - 1),
    };
    const action = keys[e.key];
    if (action) {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <span id={`${id}-label`} className={cn('text-label text-text', hideLabel && 'sr-only')}>
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        className="flex flex-wrap gap-1 rounded-sm bg-surface-muted p-1"
      >
        {options.map((o, i) => {
          const selected = o.value === value;
          return (
            <button
              key={o.value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(o.value)}
              onKeyDown={onKeyDown}
              className={cn(
                'min-h-11 flex-1 rounded-sm px-3 font-medium transition-colors duration-fast ease-standard',
                size === 'md' ? 'text-body' : 'text-label',
                selected ? 'bg-surface text-primary shadow-sm ring-1 ring-border' : 'text-text-muted hover:text-text',
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
