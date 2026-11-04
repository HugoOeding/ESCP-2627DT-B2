import { Plus } from 'lucide-react';
import { useT } from '../store/selectors';
import { ICON_LG } from './iconProps';

export interface FabProps {
  onClick: () => void;
  label?: string;
}

/** 56 px floating button, 16 px from the column's right edge, above the bottom nav. */
export function Fab({ onClick, label }: FabProps) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? t('fab.add')}
      className="press fixed bottom-[calc(80px+env(safe-area-inset-bottom))] right-[max(16px,calc((100vw-480px)/2+16px))] z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-overlay hover:bg-primary/90"
    >
      <Plus {...ICON_LG} />
    </button>
  );
}
