import { useEffect } from 'react';
import { useT } from '../store/selectors';

/** Sets document.title to "{page} · SubTrack" (WCAG 2.4.2). */
export function usePageTitle(page: string): void {
  const t = useT();
  useEffect(() => {
    document.title = t('app.documentTitle', { page });
  }, [page, t]);
}
