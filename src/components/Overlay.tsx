import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useT } from '../store/selectors';
import { ICON } from './iconProps';

export interface OverlayProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Bottom sheet: traps focus, closes on Esc and backdrop, returns focus, locks body scroll. */
export function Overlay({ title, open, onClose, children, footer }: OverlayProps) {
  const t = useT();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // A scrolling body must be keyboard-reachable (axe: scrollable-region-focusable).
  useEffect(() => {
    if (!open) return undefined;
    const body = bodyRef.current;
    const content = contentRef.current;
    if (!body || !content) return undefined;
    const check = () => setScrollable(body.scrollHeight > body.clientHeight + 1);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(body);
    observer.observe(content);
    return () => observer.disconnect();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    const first = dialog?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? dialog)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !dialog) return;
      const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === firstItem || !dialog.contains(document.activeElement))) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      if (previous && document.contains(previous)) previous.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 animate-fade-in bg-text/40"
        aria-hidden="true"
        data-testid="overlay-backdrop"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[90vh] w-full max-w-[480px] animate-slide-up flex-col rounded-t-lg bg-surface shadow-overlay focus:outline-none"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" aria-hidden="true" />
        <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-2">
          <h2 id={titleId} className="text-title text-text">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('overlay.close')}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-surface-muted"
          >
            <X {...ICON} />
          </button>
        </div>
        <div
          ref={bodyRef}
          tabIndex={scrollable ? 0 : undefined}
          role={scrollable ? 'region' : undefined}
          aria-labelledby={scrollable ? titleId : undefined}
          className="min-h-0 flex-1 overflow-y-auto px-4 pb-4"
        >
          <div ref={contentRef}>{children}</div>
        </div>
        {footer && <div className="border-t border-border px-4 pb-safe pt-3 [&>*]:mb-4">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
