import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ICON_LG } from './iconProps';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body: string;
  actions?: ReactNode;
  headingLevel?: 'h2' | 'h3';
}

export function EmptyState({ icon: Icon, title, body, actions, headingLevel = 'h2' }: EmptyStateProps) {
  const Heading = headingLevel;
  return (
    <section className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface px-6 py-8 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Icon {...ICON_LG} />
      </span>
      <Heading className="text-heading text-text">{title}</Heading>
      <p className="text-body text-text-muted">{body}</p>
      {actions && <div className="mt-2 flex w-full flex-col gap-2">{actions}</div>}
    </section>
  );
}
