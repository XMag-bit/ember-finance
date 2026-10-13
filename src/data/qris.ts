// QRIS / EMVCo payload parser (TLV format).
// Reads tag 01 (11 = static, 12 = dynamic), 53 (currency, 360 = IDR),
// 54 (amount, dynamic only), 59 (merchant name), 60 (city) and verifies
// the CRC16-CCITT checksum in tag 63.

export type QRISResult =
  | {
      valid: true;
      dynamic: boolean;
      amount: number; // NaN when static / missing
      currency: string;
      merchantName: string;
      city: string;
    }
  | { valid: false; reason: string };

function parseTLV(s: string): Record<string, string> | null {
  const out: Record<string, string> = {};
  let i = 0;
  while (i < s.length) {
    if (i + 4 > s.length) return null;
    const tag = s.slice(i, i + 2);
    const len = parseInt(s.slice(i + 2, i + 4), 10);
    if (!/^\d{2}$/.test(tag) || isNaN(len) || i + 4 + len > s.length) return null;
    out[tag] = s.slice(i + 4, i + 4 + len);
    i += 4 + len;
  }
  return out;
}

/** CRC16-CCITT (poly 0x1021, init 0xFFFF), uppercase hex. */
export function crc16ccitt(s: string): string {
  let crc = 0xffff;
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) : crc << 1;
    }
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

const NOT_QRIS = "This QR code is not a payment code";

export function parseQRIS(data: string): QRISResult {
  const text = (data ?? "").trim();
  if (text.length < 12) return { valid: false, reason: NOT_QRIS };
  const tlv = parseTLV(text);
  if (!tlv || tlv["00"] !== "01") return { valid: false, reason: NOT_QRIS };
  const poi = tlv["01"];
  if (poi !== "11" && poi !== "12") return { valid: false, reason: NOT_QRIS };

  // CRC covers the whole payload including the "6304" tag+length trailer,
  // i.e. everything except the 4 checksum chars themselves.
  const m = text.match(/6304([0-9A-Fa-f]{4})$/);
  if (!m) return { valid: false, reason: NOT_QRIS };
  const computed = crc16ccitt(text.slice(0, -4));
  if (computed !== m[1].toUpperCase()) return { valid: false, reason: NOT_QRIS };

  const dynamic = poi === "12";
  let amount = NaN;
  if (dynamic) {
    const raw = tlv["54"];
    const parsed = raw !== undefined ? parseFloat(raw) : NaN;
    if (isNaN(parsed) || parsed <= 0) {
      return { valid: false, reason: "This dynamic code has no valid amount" };
    }
    amount = parsed;
  }
  return {
    valid: true,
    dynamic,
    amount,
    currency: tlv["53"] ?? "360",
    merchantName: (tlv["59"] ?? "").trim(),
    city: (tlv["60"] ?? "").trim(),
  };
}
