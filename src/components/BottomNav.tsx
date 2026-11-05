import { NavLink } from 'react-router-dom';
import { House, Settings, Tag, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';
import { useT } from '../store/selectors';
import { ICON_LG } from './iconProps';

export interface BottomNavProps {
  offersBadge?: number;
}

export function BottomNav({ offersBadge = 0 }: BottomNavProps) {
  const t = useT();
  const items: { to: string; label: string; icon: LucideIcon; badge?: number }[] = [
    { to: '/', label: t('nav.dashboard'), icon: House },
    { to: '/offers', label: t('nav.offers'), icon: Tag, badge: offersBadge },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];
  return (
    <nav
      aria-label={t('nav.main')}
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[480px] border-t border-border bg-surface pb-safe"
    >
      <ul className="flex h-16">
        {items.map(({ to, label, icon: Icon, badge }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end
              className={({ isActive }) =>
                cn(
                  'flex h-full flex-col items-center justify-center gap-0.5 text-caption font-medium',
                  isActive ? 'text-primary' : 'text-text-muted hover:text-text',
                )
              }
            >
              <span className="relative">
                <Icon {...ICON_LG} />
                {badge ? (
                  <span className="absolute -right-3 -top-1.5 min-w-5 rounded-full bg-danger px-1 text-center text-caption font-semibold tabular-nums text-on-primary dark:text-bg">
                    <span aria-hidden="true">{badge}</span>
                  </span>
                ) : null}
              </span>
              <span>{label}</span>
              {badge ? <span className="sr-only">{t('nav.badge', { count: badge })}</span> : null}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
