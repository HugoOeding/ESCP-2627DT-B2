import { Clock } from 'lucide-react';
import { countdownTone } from '../lib/contracts';
import { daysUntil, relativeLabel } from '../lib/dates';
import { useLang, useT, useToday } from '../store/selectors';
import { Badge } from './Badge';

export interface CountdownBadgeProps {
  date: string;
  label?: string;
  today?: string;
}

/** "Renews in 3 days" etc.; neutral > 7 days, warning 3–7 days, danger ≤ 2 days. */
export function CountdownBadge({ date, label, today: todayProp }: CountdownBadgeProps) {
  const t = useT();
  const lang = useLang();
  const storeToday = useToday();
  const todayISO = todayProp ?? storeToday;
  const tone = countdownTone(daysUntil(date, todayISO));
  const when = relativeLabel(date, todayISO, lang);
  return (
    <Badge tone={tone} icon={Clock}>
      {label ? t('countdown.text', { label, when }) : when}
    </Badge>
  );
}
