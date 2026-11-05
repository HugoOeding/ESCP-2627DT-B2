import { useId, useState } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import type { Alert } from '../types';
import { useT } from '../store/selectors';
import { AlertItem } from './AlertItem';
import { ICON } from './iconProps';

export interface AlertBoxProps {
  alerts: Alert[];
  onSelect?: (alert: Alert) => void;
  visibleCount?: number;
}

export function AlertBox({ alerts, onSelect, visibleCount = 3 }: AlertBoxProps) {
  const t = useT();
  const listId = useId();
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? alerts : alerts.slice(0, visibleCount);

  return (
    <section aria-labelledby={`${listId}-title`} className="rounded-lg border border-border bg-surface p-4">
      <h2 id={`${listId}-title`} className="flex items-center gap-2 text-heading text-text">
        <Bell {...ICON} className="text-text-muted" />
        {t('alerts.title')}
      </h2>
      {alerts.length === 0 ? (
        <p className="mt-2 flex items-center gap-2 text-body text-text-muted">
          <CheckCircle2 {...ICON} className="text-success" />
          <span>
            <span className="font-semibold text-text">{t('alerts.empty')}</span> · {t('alerts.emptyBody')}
          </span>
        </p>
      ) : (
        <>
          <ul id={listId} className="mt-2 flex flex-col gap-1">
            {shown.map((alert) => (
              <li key={alert.id}>
                <AlertItem
                  type={alert.type}
                  message={alert.message}
                  dueDate={alert.dueDate}
                  onClick={onSelect ? () => onSelect(alert) : undefined}
                />
              </li>
            ))}
          </ul>
          {alerts.length > visibleCount && (
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={listId}
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 min-h-11 rounded-sm px-2 text-body font-semibold text-primary hover:underline"
            >
              {expanded ? t('alerts.showLess') : t('alerts.showAll', { count: alerts.length })}
            </button>
          )}
        </>
      )}
    </section>
  );
}
