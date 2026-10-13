import { money, spentByCategory, type Budget, type Goal, type IconName, type Tx } from "./mock";
import { daysUntil, type Subscription } from "./subscriptions";

export type Alert = {
  id: string;
  icon: IconName;
  title: string;
  body: string;
  /** "bad" renders red, "warn" amber, "good" green. */
  tone: "bad" | "warn" | "good";
};

/** Computed notifications: over-budget, near-limit, goal milestones, subscription renewals. */
export function getAlerts(txs: Tx[], goals: Goal[], budgets: Budget[], subs: Subscription[], currency: string): Alert[] {
  const out: Alert[] = [];
  const spent = spentByCategory(txs);

  for (const b of budgets) {
    const used = b.cats.reduce((s, c) => s + (spent[c] ?? 0), 0);
    const pct = b.limit > 0 ? used / b.limit : 0;
    if (pct >= 1) {
      out.push({
        id: `over-${b.id}`,
        icon: "alert-circle-outline",
        title: `${b.label} is over budget`,
        body: `${money(used, currency)} spent of ${money(b.limit, currency)}. Consider pausing until next month.`,
        tone: "bad",
      });
    } else if (pct >= 0.85) {
      out.push({
        id: `near-${b.id}`,
        icon: "warning-outline",
        title: `${b.label} is at ${Math.round(pct * 100)}%`,
        body: `${money(b.limit - used, currency)} left in this budget.`,
        tone: "warn",
      });
    }
  }

  for (const g of goals) {
    const pct = g.target > 0 ? g.saved / g.target : 0;
    if (pct >= 1) {
      out.push({
        id: `goal-done-${g.id}`,
        icon: "checkmark-circle-outline",
        title: `${g.title} complete`,
        body: `You reached ${money(g.target, currency)}. Time to celebrate - or set the next goal.`,
        tone: "good",
      });
    } else if (pct >= 0.5) {
      out.push({
        id: `goal-half-${g.id}`,
        icon: "trophy-outline",
        title: `${g.title} passed halfway`,
        body: `${money(g.target - g.saved, currency)} to go.`,
        tone: "good",
      });
    }
  }

  for (const s of subs) {
    const days = daysUntil(s);
    if (days < 0) {
      out.push({
        id: `sub-over-${s.id}`,
        icon: "alert-circle-outline",
        title: `${s.name} was due ${Math.abs(days)}d ago`,
        body: `${money(s.amount, currency)} ${s.cycle} - mark it paid or check the charge.`,
        tone: "bad",
      });
    } else if (days <= 1) {
      out.push({
        id: `sub-soon-${s.id}`,
        icon: "notifications-outline",
        title: `${s.name} renews ${days === 0 ? "today" : "tomorrow"}`,
        body: `${money(s.amount, currency)} ${s.cycle} comes out of your budget.`,
        tone: "warn",
      });
    } else if (days <= 3) {
      out.push({
        id: `sub-soon-${s.id}`,
        icon: "calendar-outline",
        title: `${s.name} renews in ${days} days`,
        body: `${money(s.amount, currency)} ${s.cycle} - plan for it.`,
        tone: "warn",
      });
    }
  }

  return out;
}
