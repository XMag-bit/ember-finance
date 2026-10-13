import * as Notifications from "expo-notifications";
import { money } from "./mock";
import { daysUntil, type Subscription } from "./subscriptions";

export const SUBS_CHANNEL = "subscriptions";
export const REMINDER_TIMES = ["08:00", "09:00", "12:00", "18:00"] as const;
export const DEFAULT_REMINDER_TIME = "09:00";

export type ReminderOpts = {
  /** "HH:MM" local time. */
  time: string;
  currency: string;
  /**
   * When true (user-driven create/edit/mark-paid), an already-overdue
   * subscription also gets one immediate notice - its 3/1/0-day triggers are
   * all in the past and would otherwise stay silent forever. Pass false for
   * background re-schedules so launches don't re-notify.
   */
  overdueNow?: boolean;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** True when notifications may be posted (no prompt). */
export async function hasPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

/**
 * Asks for notification permission (Android 13+ POST_NOTIFICATIONS).
 * Call when the user first adds a subscription, never at app launch.
 */
export async function ensurePermission(): Promise<boolean> {
  try {
    if (await hasPermission()) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.status === "granted";
  } catch {
    return false;
  }
}

export async function ensureChannel(): Promise<void> {
  try {
    await Notifications.setNotificationChannelAsync(SUBS_CHANNEL, {
      name: "Subscription renewals",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  } catch {
    // Non-Android or unavailable - scheduling still works where supported.
  }
}

/** Local date for `daysBefore` the renewal, at `time` ("HH:MM"). */
export function reminderDate(nextTs: number, daysBefore: number, time: string): Date {
  const d = new Date(nextTs);
  d.setDate(d.getDate() - daysBefore);
  const [h, m] = time.split(":").map(Number);
  d.setHours(isNaN(h) ? 9 : h, isNaN(m) ? 0 : m, 0, 0);
  return d;
}

function titleFor(sub: Subscription, daysBefore: number): string {
  if (daysBefore <= 0) return `${sub.name} renews today`;
  if (daysBefore === 1) return `${sub.name} renews tomorrow`;
  return `${sub.name} renews in ${daysBefore} days`;
}

export async function cancelSubReminders(sub: Pick<Subscription, "notifIds">): Promise<void> {
  for (const id of sub.notifIds ?? []) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // Already gone - ignore.
    }
  }
}

/**
 * Schedules reminders at 3 days before, 1 day before and on the due date.
 * Past triggers are skipped. If the subscription is already overdue and
 * opts.overdueNow is set, one notice fires a few seconds from now so the
 * overdue state is actually announced. Returns the scheduled ids.
 */
export async function scheduleSubReminders(
  sub: Subscription,
  opts: ReminderOpts
): Promise<string[]> {
  await ensureChannel();
  await cancelSubReminders(sub);
  const ids: string[] = [];
  const post = async (title: string, body: string, when: Date) => {
    if (when.getTime() <= Date.now()) return;
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { screen: "Subscriptions", subId: sub.id },
          sound: true,
        },
        trigger: when,
      });
      ids.push(id);
    } catch {
      // Scheduler unavailable - the in-app alerts still cover reminders.
    }
  };
  for (const days of [3, 1, 0]) {
    await post(
      titleFor(sub, days),
      `${money(sub.amount, opts.currency)} ${sub.cycle} comes out of your budget`,
      reminderDate(sub.nextTs, days, opts.time)
    );
  }
  if (opts.overdueNow !== false) {
    const left = daysUntil(sub);
    if (left < 0) {
      await post(
        `${sub.name} was due ${Math.abs(left)}d ago`,
        `${money(sub.amount, opts.currency)} ${sub.cycle} - mark it paid or check the charge.`,
        new Date(Date.now() + 5000)
      );
    }
  }
  return ids;
}

/** Cancels everything and re-schedules every subscription. Returns ids per sub id. */
export async function rescheduleAll(
  subs: Subscription[],
  opts: ReminderOpts
): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = {};
  for (const s of subs) {
    out[s.id] = await scheduleSubReminders(s, opts);
  }
  return out;
}
