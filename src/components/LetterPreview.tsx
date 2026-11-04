import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Copy, Download, Info, Mail, Printer } from 'lucide-react';
import type { Language } from '../types';
import { cn } from '../lib/cn';
import { useT } from '../store/selectors';
import { ICON } from './iconProps';

export interface LetterPreviewProps {
  letterText: string;
  language: Language;
  onCopy: () => void;
  onPrint: () => void;
  onDownload: () => void;
  emailHref: string | null;
  missingInfo?: boolean;
  onOpenSettings?: () => void;
}

const actionClasses =
  'press flex min-h-16 flex-col items-center justify-center gap-1 rounded-md border border-border bg-surface px-1 py-2 text-caption font-medium text-text hover:bg-surface-muted';

export function LetterPreview({
  letterText,
  language,
  onCopy,
  onPrint,
  onDownload,
  emailHref,
  missingInfo,
  onOpenSettings,
}: LetterPreviewProps) {
  const t = useT();
  return (
    <div className="flex flex-col gap-3">
      {missingInfo && (
        <p className="flex items-start gap-2 rounded-md bg-warning-soft p-3 text-label text-warning">
          <Info {...ICON} className="shrink-0" />
          <span>
            {t('letter.missing')}.{' '}
            <Link to="/settings" onClick={onOpenSettings} className="font-semibold underline underline-offset-2">
              {t('letter.missingLink')}
            </Link>
          </span>
        </p>
      )}
      {/* Print-only copy as a direct child of <body>, so print CSS can hide everything else. */}
      {createPortal(
        <div data-print-root lang={language} className="hidden whitespace-pre-wrap">
          {letterText}
        </div>,
        document.body,
      )}
      <div
        lang={language}
        aria-label={t('letter.preview')}
        role="document"
        tabIndex={0}
        className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-border bg-paper p-4 text-body text-ink"
      >
        {letterText}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <button type="button" onClick={onCopy} className={actionClasses}>
          <Copy {...ICON} />
          {t('letter.copy')}
        </button>
        <button type="button" onClick={onPrint} className={actionClasses}>
          <Printer {...ICON} />
          {t('letter.print')}
        </button>
        <button type="button" onClick={onDownload} className={actionClasses}>
          <Download {...ICON} />
          {t('letter.download')}
        </button>
        {emailHref ? (
          <a href={emailHref} className={cn(actionClasses, 'no-underline')}>
            <Mail {...ICON} />
            {t('letter.email')}
          </a>
        ) : (
          <button type="button" disabled aria-describedby="letter-no-email" className={cn(actionClasses, 'cursor-not-allowed opacity-50')}>
            <Mail {...ICON} />
            {t('letter.email')}
          </button>
        )}
      </div>
      {!emailHref && (
        <p id="letter-no-email" className="text-caption text-text-muted">
          {t('letter.noEmail')}
        </p>
      )}
    </div>
  );
}
