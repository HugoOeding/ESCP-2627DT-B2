import { Lock } from 'lucide-react';
import { useT } from '../store/selectors';
import { ICON } from './iconProps';

export function PrivacyNote({ text }: { text?: string }) {
  const t = useT();
  return (
    <p className="flex items-start gap-2 rounded-md bg-surface-muted p-3 text-label text-text">
      <Lock {...ICON} className="mt-px shrink-0 text-text-muted" />
      <span>{text ?? t('privacy.note')}</span>
    </p>
  );
}
