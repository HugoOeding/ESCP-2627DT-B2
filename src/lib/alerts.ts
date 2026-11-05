import type { Alert, AlertType, PersistedState, Translate } from '../types';
import { budgetPercent, budgetStatus, isCounted, isInTrial, regularPrice, totals } from './calculations';
import { lastDayToCancel } from './contracts';
import { daysUntil, nextRenewal, relativeLabel } from './dates';
import { date as formatDate, money, percent } from './format';

/** Sort rank per alert type (lower = more urgent); stored in Alert.urgency. */
export const ALERT_RANK: Record<AlertType, number> = {
  cancel_deadline: 1,
  trial_end: 1,
  price_change: 2,
  yearly_renewal: 3,
  renewal: 3,
  budget: 4,
};

export const CANCEL_DEADLINE_DAYS = 14;
export const PRICE_CHANGE_DAYS = 30;

export type AlertState = Pick<PersistedState, 'subscriptions' | 'priceChanges' | 'settings' | 'budget' | 'profile'>;

/** Derives in-app reminders from state; never stored. One alert per type per subscription. */
export function deriveAlerts(state: AlertState, todayISO: string, t: Translate): Alert[] {
  const lang = state.profile.language;
  const { reminderDaysBefore, yearlyReminderDays } = state.settings;
  const alerts: Alert[] = [];
  const push = (type: AlertType, message: string, dueDate: string, subscriptionId?: string) =>
    alerts.push({
      id: subscriptionId ? `${type}-${subscriptionId}` : type,
      type,
      subscriptionId,
      message,
      dueDate,
      urgency: ALERT_RANK[type],
    });

  for (const sub of state.subscriptions.filter(isCounted)) {
    const inTrial = isInTrial(sub, todayISO);
    let hasDeadline = false;

    if (inTrial && sub.trialEndDate) {
      const d = daysUntil(sub.trialEndDate, todayISO);
      if (d >= 0 && d <= reminderDaysBefore) {
        push(
          'trial_end',
          t('alert.trialEnd', {
            name: sub.name,
            when: relativeLabel(sub.trialEndDate, todayISO, lang),
            price: money(regularPrice(sub), lang),
            cycle: t(sub.billingCycle === 'monthly' ? 'cycle.perMonthShort' : 'cycle.perYearShort'),
          }),
          sub.trialEndDate,
          sub.id,
        );
      }
    }

    if (sub.noticePeriodDays > 0) {
      const deadline = lastDayToCancel(sub, todayISO);
      const d = daysUntil(deadline.date, todayISO);
      if (!deadline.anyTime && d >= 0 && d <= CANCEL_DEADLINE_DAYS) {
        hasDeadline = true;
        push('cancel_deadline', t('alert.cancelDeadline', { name: sub.name, date: formatDate(deadline.date) }), deadline.date, sub.id);
      }
    }

    if (!inTrial) {
      const renewal = nextRenewal(sub.startDate, sub.billingCycle, todayISO);
      const d = daysUntil(renewal, todayISO);
      if (sub.billingCycle === 'yearly' && d >= 0 && d <= yearlyReminderDays) {
        push(
          'yearly_renewal',
          t('alert.yearlyRenewal', { name: sub.name, date: formatDate(renewal), price: money(sub.price, lang) }),
          renewal,
          sub.id,
        );
      } else if (sub.billingCycle === 'monthly' && !hasDeadline && d >= 0 && d <= reminderDaysBefore) {
        push(
          'renewal',
          t('alert.renewal', { name: sub.name, when: relativeLabel(renewal, todayISO, lang), price: money(sub.price, lang) }),
          renewal,
          sub.id,
        );
      }
    }

    const recent = state.priceChanges
      .filter((pc) => pc.subscriptionId === sub.id)
      .filter((pc) => {
        const ago = -daysUntil(pc.date, todayISO);
        return ago >= 0 && ago <= PRICE_CHANGE_DAYS;
      })
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (recent && recent.oldPrice > 0 && recent.newPrice !== recent.oldPrice) {
      const pct = ((recent.newPrice - recent.oldPrice) / recent.oldPrice) * 100;
      push(
        'price_change',
        t(recent.newPrice > recent.oldPrice ? 'alert.priceUp' : 'alert.priceDown', {
          name: sub.name,
          old: money(recent.oldPrice, lang),
          new: money(recent.newPrice, lang),
          percent: percent(pct),
        }),
        recent.date,
        sub.id,
      );
    }
  }

  const limit = state.budget.monthlyLimit;
  const spent = totals(state.subscriptions, todayISO).monthly;
  const status = budgetStatus(spent, limit);
  if (status === 'warning' || status === 'over') {
    push(
      'budget',
      t(status === 'over' ? 'alert.budgetOver' : 'alert.budget', {
        percent: budgetPercent(spent, limit),
        limit: money(limit, lang, { trimZero: true }),
        over: money(spent - limit, lang),
      }),
      todayISO,
    );
  }

  return alerts.sort((a, b) => a.urgency - b.urgency || a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id));
}
