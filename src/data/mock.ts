// Ember Finance - data layer (production).
// Currency CODE stays "IDR" everywhere in data/logic; only the display
// symbol is "Rp." (see CURRENCY_SYMBOLS).

export type IconName = React.ComponentProps<
  typeof import("@expo/vector-icons").Ionicons
>["name"];

export type Tx = {
  id: string;
  title: string;
  category: string;
  /** Unix timestamp (ms). Display text is derived via formatTxDate. */
  ts: number;
  amount: number; // negative = expense, positive = income
  icon: IconName;
  /** Optional payment method, e.g. "GoPay". Absent on old saved records. */
  paymentMethod?: string;
};

export const categories = [
  "Groceries",
  "Food",
  "Housing",
  "Transport",
  "Shopping",
  "Health",
  "Income",
  "Other",
] as const;

export const CATEGORY_ICONS: Record<string, IconName> = {
  Groceries: "cart-outline",
  Food: "restaurant-outline",
  Housing: "home-outline",
  Transport: "car-outline",
  Shopping: "bag-handle-outline",
  Health: "heart-outline",
  Subscriptions: "tv-outline",
  Income: "briefcase-outline",
  Other: "receipt-outline",
};

// One-time rename for data saved before "Dining" became "Food".
export function normalizeCategory(category: string): string {
  return category === "Dining" ? "Food" : category;
}

export const transactions: Tx[] = [];

export type Budget = {
  id: string;
  label: string;
  limit: number;
  icon: IconName;
  /** Transaction categories counted toward this budget. */
  cats: string[];
};

export const budgets: Budget[] = [];

export type Goal = {
  id: string;
  title: string;
  saved: number;
  target: number;
  icon: IconName;
  note: string;
};

export const goals: Goal[] = [];

export const CURRENCIES = ["USD", "EUR", "GBP", "PHP", "JPY", "IDR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  PHP: "₱",
  JPY: "¥",
  IDR: "Rp.",
};

const NO_DECIMALS: Currency[] = ["JPY", "IDR"];

// Plain amount, e.g. $1,450.00 or Rp.12,481 (no decimals for JPY/IDR).
// At or above SHORTEN_FROM, amounts collapse to a letter suffix (K/M/B/T)
// with at most one truncated decimal: Rp.443K, Rp.999.9K, $1.2M, $5B.
export const SHORTEN_FROM = 100_000;

const SHORT_UNITS: Array<[number, string]> = [
  [1e12, "T"],
  [1e9, "B"],
  [1e6, "M"],
  [1e3, "K"],
];

/**
 * Largest suffix keeping the number at 1 or more, truncated (never rounded
 * up, so 999,950 reads 999.9K and never 1000K). Computed in integer cents so
 * float error can never push a value across a boundary.
 */
function shortSuffix(abs: number): string {
  const cents = Math.round(abs * 100);
  for (const [v, suffix] of SHORT_UNITS) {
    if (abs >= v) {
      return `${Math.floor(cents / ((v * 100) / 10)) / 10}${suffix}`;
    }
  }
  return `${abs}`;
}

/**
 * Full form below the threshold, matching the AmountInput separators:
 * whole currencies (IDR/JPY) group with dots (Rp.57.000), others with
 * commas and two decimals ($57,000.00). Zero decimals for whole currencies.
 */
function fullForm(abs: number, currency: string): string {
  if (isWholeCurrency(currency)) return groupInt(String(Math.round(abs)), ".");
  const [int, frac] = abs.toFixed(2).split(".");
  return `${groupInt(int, ",")}.${frac}`;
}

export function money(n: number, currency: string) {
  const symbol = (CURRENCY_SYMBOLS as Record<string, string>)[currency] ?? "$";
  const abs = Math.abs(n);
  if (!isNaN(abs) && isFinite(abs)) {
    if (abs >= SHORTEN_FROM) return `${symbol}${shortSuffix(abs)}`;
    return `${symbol}${fullForm(abs, currency)}`;
  }
  // NaN / Infinity render as zero instead of crashing or leaking "NaN".
  return `${symbol}${isWholeCurrency(currency) ? "0" : "0.00"}`;
}

// Signed amount for transaction rows, e.g. +$680.00 / −Rp.86.
export function signedMoney(n: number, currency: string) {
  const sign = n < 0 ? "−" : n > 0 ? "+" : "";
  return `${sign}${money(n, currency)}`;
}

/** IDR and JPY are whole-number currencies (no decimal part). */
export function isWholeCurrency(currency: string): boolean {
  return (NO_DECIMALS as string[]).includes(currency);
}

function groupInt(digits: string, sep: string): string {
  if (digits === "") return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

/**
 * Parses a (possibly formatted) amount string into a clean number.
 * Strips letters and extra separators; NaN when there is nothing to parse.
 * IDR/JPY read whole numbers only, other currencies allow one decimal mark
 * (".") with up to 2 fraction digits.
 */
export function parseAmount(text: string, currency: string): number {
  const t = text.trim();
  if (t === "") return NaN;
  if (isWholeCurrency(currency)) {
    const digits = t.replace(/[^0-9]/g, "");
    return digits === "" ? NaN : parseInt(digits, 10);
  }
  const stripped = t.replace(/[^0-9.]/g, "");
  if (stripped === "" || stripped === ".") return NaN;
  const dot = stripped.indexOf(".");
  const int = dot === -1 ? stripped : stripped.slice(0, dot);
  const frac = dot === -1 ? "" : stripped.slice(dot + 1).replace(/\./g, "").slice(0, 2);
  const n = parseFloat(`${int === "" ? "0" : int}.${frac === "" ? "0" : frac}`);
  return isNaN(n) ? NaN : n;
}

/**
 * Formats a clean number for the AmountInput display.
 * IDR groups with dots (5.000.000), others group with commas (5,000,000).
 * NaN renders as an empty string.
 */
export function formatAmountInput(value: number, currency: string): string {
  if (typeof value !== "number" || isNaN(value)) return "";
  const abs = Math.abs(value);
  if (isWholeCurrency(currency)) {
    return groupInt(String(Math.trunc(abs)), ".");
  }
  const parts = String(abs).split(".");
  const grouped = groupInt(parts[0], ",");
  return parts.length > 1 && parts[1] !== "" ? `${grouped}.${parts[1].slice(0, 2)}` : grouped;
}

/** Counts the decimal digits inside the first `pos` chars of s. */
export function countDigitsBefore(s: string, pos: number): number {
  const end = Math.max(0, Math.min(pos, s.length));
  let d = 0;
  for (let i = 0; i < end; i++) {
    if (s[i] >= "0" && s[i] <= "9") d++;
  }
  return d;
}

/** String index right after the k-th digit of s (0 when k <= 0, end when fewer). */
export function indexAfterDigits(s: string, k: number): number {
  if (k <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] >= "0" && s[i] <= "9") {
      seen++;
      if (seen >= k) return i + 1;
    }
  }
  return s.length;
}

export type AmountEdit = { text: string; cursor: number; value: number };

/**
 * Applies a raw TextInput change and returns the formatted text, the cursor
 * position and the clean number. The cursor stays at the end when it was at
 * the end, otherwise it lands after the same number of digits as before.
 */
export function applyAmountEdit(oldText: string, oldCursor: number, raw: string, currency: string): AmountEdit {
  const atEnd = oldCursor >= oldText.length;
  const digits = countDigitsBefore(oldText, oldCursor);
  let formatted: string;
  let value: number;
  if (isWholeCurrency(currency)) {
    const onlyDigits = raw.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "");
    value = onlyDigits === "" ? NaN : parseInt(onlyDigits, 10);
    formatted = formatAmountInput(value, currency);
  } else {
    const stripped = raw.replace(/[^0-9.]/g, "");
    const dot = stripped.indexOf(".");
    const int = (dot === -1 ? stripped : stripped.slice(0, dot)).replace(/^0+(?=\d)/, "");
    const frac = dot === -1 ? "" : stripped.slice(dot + 1).replace(/\./g, "").slice(0, 2);
    const hasDot = dot !== -1;
    const intShown = int === "" ? "" : int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    formatted = hasDot || frac !== "" ? `${intShown}.${frac}` : intShown;
    value = int === "" && frac === "" ? NaN : parseAmount(formatted, currency);
  }
  return { text: formatted, cursor: atEnd ? formatted.length : indexAfterDigits(formatted, digits), value };
}

// "Today · 09:00" / "Yesterday" / "Oct 10".
export function formatTxDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const day = (x: Date) => x.getFullYear() * 1000 + dayOfYear(x);
  const diff = day(now) - day(d);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  if (diff === 0) return `Today · ${hh}:${mm}`;
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d.getTime() - start.getTime()) / 86400000);
}

export function greetingFor(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Expense totals per category for the current month (budgets). */
export function spentByCategory(txs: Tx[]): Record<string, number> {
  const out: Record<string, number> = {};
  const now = new Date();
  for (const t of txs) {
    if (t.amount >= 0) continue;
    if (!sameMonth(new Date(t.ts), now)) continue;
    out[t.category] = (out[t.category] ?? 0) + Math.abs(t.amount);
  }
  return out;
}

/** Expense totals for each of the last 7 days, oldest → today. */
export function last7Spend(txs: Tx[]): number[] {
  const days: number[] = [0, 0, 0, 0, 0, 0, 0];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (const t of txs) {
    if (t.amount >= 0) continue;
    const d = new Date(t.ts);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((now.getTime() - d.getTime()) / 86400000);
    if (diff >= 0 && diff < 7) days[6 - diff] += Math.abs(t.amount);
  }
  return days;
}

/** Month income / outcome totals for the current month. */
export function monthTotals(txs: Tx[]): { monthIn: number; monthOut: number } {
  const now = new Date();
  let monthIn = 0;
  let monthOut = 0;
  for (const t of txs) {
    if (!sameMonth(new Date(t.ts), now)) continue;
    if (t.amount > 0) monthIn += t.amount;
    else monthOut += Math.abs(t.amount);
  }
  return { monthIn, monthOut };
}
