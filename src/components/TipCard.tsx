import type { ReactNode } from 'react';
import { Lightbulb } from 'lucide-react';
import { useT } from '../store/selectors';
import { ICON } from './iconProps';

export interface TipCardProps {
  text: string;
  saving?: string;
  action?: ReactNode;
}

export function TipCard({ text, saving, action }: TipCardProps) {
  const t = useT();
  return (
    <section className="flex items-start gap-3 rounded-lg bg-primary-soft p-4">
      <Lightbulb {...ICON} className="mt-0.5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <h3 className="sr-only">{t('tips.title')}</h3>
        <p className="text-body text-text">{text}</p>
        {saving && <p className="mt-1 text-label font-semibold tabular-nums text-success">{t('tips.save', { amount: saving })}</p>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </section>
  );
}
