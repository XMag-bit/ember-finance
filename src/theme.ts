// Ember Finance - Warm Earth tokens, Golden-Ratio edition.
// φ = 1.618. All dimensions are even integers (divisible by 2) and drawn
// from a Fibonacci run (…8, 14, 22, 34, 56, 90) so every step ≈ φ.
// Type scale: 10 → 12 → 16 → 20 → 26 → 34 → 42 (each major step ×φ, minor ×√φ).

export const PHI = 1.618;

/** Round any value to the nearest even integer (keeps 1px borders crisp, Android-safe). */
export const even = (n: number) => Math.round(n / 2) * 2;

export const colors = {
  bg: "#FAF7F2",
  surface: "#FFFFFF",
  surface2: "#F3EEE7",
  surface3: "#EDE6DB",
  border: "#E8E2DC",
  borderStrong: "#D6CFC4",
  ink: "#1C1917",
  ink2: "#44403C",
  muted: "#78716C",
  faint: "#A8A29E",
  accent: "#C86E4B",
  accentDark: "#A9552F",
  accentSoft: "#FBE9DD",
  accentInk: "#7C3A21",
  success: "#5B8C5A",
  successSoft: "#E3EFE3",
  warning: "#C99A2B",
  warningSoft: "#FBF0D3",
  danger: "#C14A3A",
  dangerSoft: "#FBE3DF",
  dark: "#1E1A16",
  dark2: "#2A2420",
};

// Fibonacci → even: 5→6, 8→8, 13→14, 21→22, 34→34, 55→56, 89→90
export const spacing = {
  xs: 6, // 5 → 6
  sm: 8,
  md: 14, // 13 → 14
  lg: 22, // 21 → 22
  xl: 34,
  xxl: 56, // 55 → 56
  xxxl: 90, // tab clearance = 56 × φ ≈ 90
};

// Radii follow the same run. Pill radius 34 = half of 68px tab bar.
export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  xl: 34,
  full: 999,
};

// Display: Fraunces (bundled via @expo-google-fonts/fraunces, embedded in release APK).
// Body: Inter (bundled via @expo-google-fonts/inter, embedded in release APK).
// Family names encode the weight - use the matching file, keep fontWeight as fallback.
export const fonts = {
  displayBold: "Fraunces_700Bold",
  displayXB: "Fraunces_800ExtraBold",
  body: "Inter_400Regular",
  bodyMedium: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
  bodyXB: "Inter_800ExtraBold",
  bodyItalic: "Inter_400Regular_Italic",
};
export const type = {
  micro: 10,
  caption: 12,
  body: 16,
  subtitle: 20,
  title: 26,
  display: 34,
  hero: 42,
};

export const layout = {
  screen: 22, // outer gutter (lg)
  card: 22, // standard card padding (lg) - hero : card = φ : 1 vs list padding
  listH: 14, // dense list horizontal (card / φ ≈ 14)
  listV: 8, // dense list vertical rhythm
  sectionGap: 22, // space between sections
  itemGap: 14, // space between cards in a group
  tabClearance: 90, // scroll bottom = FAB 56 × φ
  tabBarHeight: 68, // 42 × φ ≈ 68 (even)
  fab: 56,
  tileSm: 34, // small icon tile
  tileMd: 44, // standard tile = 34 × √φ ≈ 44 (min touch target)
  tileLg: 56, // large tile = 44 × √φ ≈ 56
  barWidth: 14, // chart bars
  track: 8, // progress track = sm (even)
};

export const iconSize = {
  sm: 18,
  md: 20, // 16 × √φ ≈ 20
  lg: 24,
  xl: 26, // 16 × φ ≈ 26
};

export const shadows = {
  card: {
    shadowColor: "#1C1917",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 14, // md radius (even)
    elevation: 2,
  },
};
