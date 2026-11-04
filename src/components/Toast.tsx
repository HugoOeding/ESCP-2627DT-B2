import { useStore } from '../store/useStore';
import { useT } from '../store/selectors';

/** One toast at a time, auto-hidden after 3 s by the store. The live region is always mounted. */
export function Toast() {
  const toast = useStore((s) => s.toast);
  const hideToast = useStore((s) => s.hideToast);
  const t = useT();
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t('toast.region')}
      className="pointer-events-none fixed inset-x-0 bottom-[calc(80px+env(safe-area-inset-bottom))] z-[60] mx-auto flex w-full max-w-[480px] justify-center px-4"
    >
      {toast && (
        <div
          key={toast.id}
          className="pointer-events-auto flex w-full animate-fade-in items-center justify-between gap-3 rounded-md bg-text px-4 py-3 text-body text-bg shadow-overlay"
        >
          <span>{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onAction();
                hideToast();
              }}
              className="min-h-11 shrink-0 rounded-sm px-2 font-semibold text-bg underline underline-offset-2"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
