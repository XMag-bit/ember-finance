import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "../theme";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function monthLabel(y: number, m: number): string {
  return new Date(y, m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function Calendar({
  value,
  onChange,
  allowFuture = false,
}: {
  value: Date;
  onChange: (d: Date) => void;
  allowFuture?: boolean;
}) {
  const [view, setView] = useState({ y: value.getFullYear(), m: value.getMonth() });
  const today = startOfToday();

  useEffect(() => {
    setView({ y: value.getFullYear(), m: value.getMonth() });
  }, [value.getFullYear(), value.getMonth()]);

  const firstWeekday = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<number | null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const canNext =
    allowFuture ||
    view.y < today.getFullYear() ||
    (view.y === today.getFullYear() && view.m < today.getMonth());

  function shift(delta: number) {
    const d = new Date(view.y, view.m + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  }

  return (
    <View>
      <View style={styles.head}>
        <TouchableOpacity onPress={() => shift(-1)} style={styles.nav} accessibilityLabel="Previous month" hitSlop={8}>
          <Ionicons name="chevron-back-outline" size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.month}>{monthLabel(view.y, view.m)}</Text>
        <TouchableOpacity
          onPress={() => shift(1)}
          style={[styles.nav, !canNext && styles.navDisabled]}
          disabled={!canNext}
          accessibilityLabel="Next month"
          hitSlop={8}
        >
          <Ionicons name="chevron-forward-outline" size={20} color={canNext ? colors.ink : colors.faint} />
        </TouchableOpacity>
      </View>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((w, i) => (
          <Text key={i} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={`b${i}`} style={styles.cell} />;
          const date = new Date(view.y, view.m, day, 12);
          const dayStart = new Date(view.y, view.m, day);
          dayStart.setHours(0, 0, 0, 0);
          const future = !allowFuture && dayStart.getTime() > today.getTime();
          const selected = sameDay(date, value);
          const isToday = sameDay(date, today);
          return (
            <TouchableOpacity
              key={day}
              style={styles.cell}
              disabled={future}
              onPress={() => onChange(date)}
              accessibilityLabel={`Select ${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`}
              accessibilityState={{ selected, disabled: future }}
              hitSlop={2}
            >
              <View style={[styles.dot, selected && styles.dotSelected, isToday && !selected && styles.dotToday]}>
                <Text
                  style={[
                    styles.dayText,
                    selected ? styles.daySelected : future ? styles.dayFuture : styles.dayDefault,
                  ]}
                >
                  {day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  month: { fontSize: 17, fontWeight: "700", fontFamily: fonts.displayBold, color: colors.ink },
  nav: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  navDisabled: { opacity: 0.5 },
  weekRow: { flexDirection: "row", marginTop: 4 },
  weekday: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    fontFamily: fonts.bodyBold,
    color: colors.muted,
    letterSpacing: 0.8,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", marginTop: 2 },
  cell: { width: "14.2857%", height: 46, alignItems: "center", justifyContent: "center" },
  dot: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  dotSelected: { backgroundColor: colors.accent },
  dotToday: { borderWidth: 1.5, borderColor: colors.accent },
  dayText: { fontSize: 15, fontFamily: fonts.body },
  dayDefault: { color: colors.ink2 },
  dayFuture: { color: colors.faint },
  daySelected: { color: "#fff", fontWeight: "700", fontFamily: fonts.bodyBold },
});
