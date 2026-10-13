import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, fonts } from "../theme";
import { Card, ProgressBar } from "../components/ui";
import { FadeInView } from "../components/motion";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppIcon } from "../components/AppIcon";
import { CATEGORY_ICONS, money, monthTotals, spentByCategory } from "../data/mock";
import { useProfile } from "../store/UserContext";
import { useTxs } from "../store/TxContext";

// Compact single-viewport layout: everything visible without scrolling
// on a standard phone (tighter cards, smaller type, trimmed gaps).

function Kpi({
  icon,
  label,
  value,
  delta,
  deltaIcon,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  delta: string;
  deltaIcon: React.ComponentProps<typeof Ionicons>["name"];
}) {
  return (
    <View style={styles.compact}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
        <AppIcon name={icon} tileSize={30} size={17} />
        <Text style={styles.kLabel}>{label}</Text>
      </View>
      <Text style={styles.kVal}>{value}</Text>
      <View style={styles.delta}>
        <Ionicons name={deltaIcon} size={12} color={colors.success} />
        <Text style={styles.deltaText}>{delta}</Text>
      </View>
    </View>
  );
}

export function InsightScreen({ navigation }: any) {
  const { profile } = useProfile();
  const { txs } = useTxs();
  const cur = profile.currency;
  const { monthIn, monthOut } = monthTotals(txs);
  const rate = monthIn > 0 ? Math.max(0, (monthIn - monthOut) / monthIn) : 0;

  if (txs.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 110 }}>
          <FadeInView>
            <ScreenHeader title="Insight" sub="No data yet" onBack={() => navigation?.goBack()} />
          </FadeInView>
          <FadeInView delay={80}>
          <Card style={{ alignItems: "center", paddingVertical: 40 }}>
            <Ionicons name="stats-chart-outline" size={40} color={colors.faint} />
            <Text style={{ fontSize: 17, fontWeight: "800", fontFamily: fonts.bodyXB, color: colors.ink, marginTop: 10 }}>Nothing to analyze yet</Text>
            <Text style={{ color: colors.muted, textAlign: "center", marginTop: 6, lineHeight: 20, fontFamily: fonts.body }}>Add income and expenses and your spent, saved, and top categories will appear here.</Text>
          </Card>
          </FadeInView>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const spent = spentByCategory(txs);
  const cats = Object.entries(spent)
    .map(([l, v]) => ({ l, v }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 4);
  const total = cats.reduce((s, r) => s + r.v, 0);
  const max = Math.max(...cats.map((r) => r.v), 1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 110 }}>
        <FadeInView>
          <ScreenHeader title="Insight" sub="This month" onBack={() => navigation?.goBack()} />
        </FadeInView>

        <FadeInView delay={60} style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
          <Kpi
            icon="wallet-outline"
            label="SPENT"
            value={money(monthOut, cur)}
            delta="This month"
            deltaIcon="trending-down-outline"
          />
          <Kpi
            icon="leaf-outline"
            label="SAVED"
            value={money(Math.max(0, monthIn - monthOut), cur)}
            delta="This month"
            deltaIcon="trending-up-outline"
          />
        </FadeInView>

        <FadeInView delay={120}>
        <View style={[styles.compact, { marginBottom: 10 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
            <AppIcon name="pie-chart-outline" tileSize={30} size={17} />
            <Text style={{ fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink, flex: 1, fontSize: 14 }}>Savings rate</Text>
            <Text style={{ fontWeight: "800", fontFamily: fonts.bodyXB, color: colors.success, fontSize: 14 }}>{Math.round(rate * 100)}%</Text>
          </View>
          <View style={{ marginTop: 8 }}>
            <ProgressBar value={rate} fill={colors.success} />
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, fontFamily: fonts.body, marginTop: 6 }}>
            {money(monthIn, cur)} in · {money(monthOut, cur)} out.
          </Text>
        </View>
        </FadeInView>

        <FadeInView delay={180}>
        <Text style={styles.section}>Top categories</Text>
        </FadeInView>
        <FadeInView delay={210}>
        <View style={[styles.compact, { marginBottom: 10 }]}>
          {cats.map((r, i) => (
            <View key={r.l} style={{ marginBottom: i === cats.length - 1 ? 0 : 9 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <Ionicons name={(CATEGORY_ICONS[r.l] ?? "receipt-outline") as React.ComponentProps<typeof Ionicons>["name"]} size={14} color={colors.ink2} />
                <Text style={{ fontWeight: "600", fontFamily: fonts.bodyMedium, color: colors.ink, flex: 1, fontSize: 13.5 }}>{r.l}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 , fontFamily: fonts.body}}>
                  {total > 0 ? Math.round((r.v / total) * 100) : 0}% · {money(r.v, cur)}
                </Text>
              </View>
              <View style={{ height: 8, backgroundColor: "#F1ECE5", borderRadius: 99, marginLeft: 20 }}>
                <View style={{ height: 8, width: `${(r.v / max) * 100}%`, backgroundColor: colors.accent, borderRadius: 99 }} />
              </View>
            </View>
          ))}
        </View>
        </FadeInView>

        <FadeInView delay={270}>
        <View style={[styles.compact, styles.report]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="document-text-outline" size={16} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "700", fontFamily: fonts.bodyBold, fontSize: 14.5 }}>Monthly summary</Text>
          </View>
          <Text style={{ color: "#B8AEA4", marginTop: 5, lineHeight: 18, fontSize: 12.5 , fontFamily: fonts.bodyItalic}}>
            You saved {Math.round(rate * 100)}% of income this month.
          </Text>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => navigation?.navigate("Main", { screen: "Budgets" })}
            accessibilityLabel="Plan November budgets"
          >
            <Text style={styles.ctaText}>Plan November</Text>
            <Ionicons name="arrow-forward-outline" size={15} color="#fff" />
          </TouchableOpacity>
        </View>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  compact: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
  },
  section: { fontSize: 16, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink, marginBottom: 8 },
  kLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", fontFamily: fonts.bodyBold, letterSpacing: 0.8 },
  kVal: { fontSize: 20, fontWeight: "800", fontFamily: fonts.bodyXB, color: colors.ink, marginTop: 6 },
  delta: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 3,
    backgroundColor: colors.successSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    marginTop: 6,
  },
  deltaText: { color: "#2F6B30", fontWeight: "700", fontFamily: fonts.bodyBold, fontSize: 11.5 },
  report: { backgroundColor: colors.dark, borderColor: colors.dark },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.accent,
    borderRadius: 99,
    paddingVertical: 10,
    marginTop: 10,
  },
  ctaText: { color: "#fff", fontWeight: "800", fontFamily: fonts.bodyXB, fontSize: 14 },
});
