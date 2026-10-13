import type { IconName } from "./mock";

export type Cycle = "weekly" | "monthly" | "yearly";

export const CYCLES: Cycle[] = ["weekly", "monthly", "yearly"];

export type Subscription = {
  id: string;
  name: string;
  amount: number;
  cycle: Cycle;
  /** Next renewal timestamp (ms). */
  nextTs: number;
  icon: IconName;
  /** Scheduled local-notification ids for this subscription. */
  notifIds?: string[];
};

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Whole days until renewal (negative = overdue). */
export function daysUntil(sub: Pick<Subscription, "nextTs">, now = Date.now()): number {
  return Math.round((startOfDay(sub.nextTs) - startOfDay(now)) / 86400000);
}

export function advanceCycle(ts: number, cycle: Cycle): number {
  const d = new Date(ts);
  if (cycle === "weekly") d.setDate(d.getDate() + 7);
  else if (cycle === "monthly") d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d.getTime();
}

/** Next renewal strictly after now (used by mark-paid). */
export function rollForward(sub: Pick<Subscription, "nextTs" | "cycle">, now = Date.now()): number {
  if (sub.nextTs > now) return advanceCycle(sub.nextTs, sub.cycle);
  let t = sub.nextTs;
  let guard = 0;
  while (t <= now && guard++ < 1200) t = advanceCycle(t, sub.cycle);
  return t;
}

/** Normalized monthly cost across cycles. */
export function monthlyCost(subs: Subscription[]): number {
  return subs.reduce((s, b) => {
    if (b.cycle === "weekly") return s + (b.amount * 52) / 12;
    if (b.cycle === "yearly") return s + b.amount / 12;
    return s + b.amount;
  }, 0);
}

export function formatRenewal(sub: Pick<Subscription, "nextTs">, now = Date.now()): string {
  const days = daysUntil(sub, now);
  const date = new Date(sub.nextTs).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (days < 0) return `${date} · ${Math.abs(days)}d overdue`;
  if (days === 0) return `${date} · today`;
  if (days === 1) return `${date} · tomorrow`;
  return `${date} · in ${days}d`;
}
