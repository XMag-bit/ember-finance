# Ember Finance — Release Notes

## v1.0.3 — Category popup fix

The category list now opens correctly everywhere: it slides up from the
bottom as a full-screen sheet with a dimmed background, instead of
rendering tangled with the form behind it. Applies to Add transaction,
QR payment confirm, and New budget — same list, same animation, just
properly layered.

## Previous update — one category list everywhere

Picking a category works the same on every screen: tap the field and a
bottom sheet slides up with a themed list — icon, name, and a green check
on what's selected.

- **Add tab** — the free-typing box is now a picker button (icon + name +
  "tap to change"). All built-in categories, your custom ones from past
  transactions, plus a custom row so typing "Pets" still works.
- **QR payment confirm** — the chip grid is replaced by the same picker
  (Food stays the default).
- **New budget** — multi-pick (Food, Groceries +1 more) with checkmarks
  and a Done button.

Filter pills on Transactions stay as they are. Stored values didn't
change, so budgets, Insight, alerts, and totals are unaffected.

## Install

Use the APK matching your phone (same app in all four):

| File | Size | For |
|---|---|---|
| `app-arm64-v8a-release.apk` | 32.3 MB | **Almost all phones** — 64-bit ARM |
| `app-armeabi-v7a-release.apk` | 26.2 MB | Old / entry-level 32-bit ARM phones |
| `app-x86_64-release.apk` | 33.8 MB | Emulators on modern PCs, Chromebooks |
| `app-x86-release.apk` | 33.4 MB | Emulators on older PCs |

Uninstall the old app first, then install. On first install Android may
show a Play Protect "unknown app" prompt — tap **Install without
scanning**.
