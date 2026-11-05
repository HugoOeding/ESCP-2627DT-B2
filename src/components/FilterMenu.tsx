import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../lib/cn';
import { useT } from '../store/selectors';
import { ICON_SM } from './iconProps';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterMenuProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

/** Chip that opens a menu of radio items ("Everyone ▾"). Arrow keys move, Esc closes. */
export function FilterMenu({ options, value, onChange }: FilterMenuProps) {
  const t = useT();
  const id = useId();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return undefined;
    const index = Math.max(0, options.findIndex((o) => o.value === value));
    itemRefs.current[index]?.focus();
    const onPointer = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open, options, value]);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(i + 1) % items.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length]?.focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        aria-label={`${t('filter.label')}: ${current.label}`}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 items-center gap-1 rounded-full bg-surface-muted px-4 text-label text-text hover:bg-primary-soft"
      >
        {current.label}
        <ChevronDown {...ICON_SM} />
      </button>
      {open && (
        <div
          id={`${id}-menu`}
          role="menu"
          aria-label={t('filter.label')}
          onKeyDown={onMenuKey}
          className="absolute right-0 z-40 mt-1 min-w-44 rounded-md border border-border bg-surface p-1 shadow-overlay"
        >
          {options.map((o, i) => (
            <button
              key={o.value}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              type="button"
              role="menuitemradio"
              aria-checked={o.value === value}
              onClick={() => {
                onChange(o.value);
                close();
              }}
              className={cn(
                'flex min-h-11 w-full items-center justify-between gap-3 rounded-sm px-3 text-left text-body',
                o.value === value ? 'bg-primary-soft text-primary' : 'text-text hover:bg-surface-muted',
              )}
            >
              {o.label}
              {o.value === value && <Check {...ICON_SM} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
