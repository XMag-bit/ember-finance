import React, { useEffect, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, fonts } from "../theme";
import { Card, SectionTitle, ProgressBar } from "../components/ui";
import { HEADER_TOP } from "../components/ScreenHeader";
import { AppIcon } from "../components/AppIcon";
import { FadeInView, useFocusCount, useReducedMotion } from "../components/motion";
import { TransactionRow } from "../components/TransactionRow";
import {
  greetingFor,
  last7Spend,
  money,
  monthTotals,
  spentByCategory,
} from "../data/mock";
import { getAlerts } from "../data/alerts";
import { useTxs } from "../store/TxContext";
import { useGoals } from "../store/GoalsContext";
import { useBudgets } from "../store/BudgetsContext";
import { useSubs } from "../store/SubsContext";
import { useProfile, initialOf } from "../store/UserContext";

const QUICK: { label: string; icon: React.ComponentProps<typeof Ionicons>["name"]; route: string }[] = [
  { label: "Add", icon: "add-circle-outline", route: "AddModal" },
  { label: "Subs", icon: "repeat-outline", route: "Subscriptions" },
  { label: "Scan", icon: "qr-code-outline", route: "Scan" },
  { label: "Goals", icon: "trophy-outline", route: "Goals" },
  { label: "Insight", icon: "stats-chart-outline", route: "Insight" },
];

export function HomeScreen({ navigation }: any) {
  const { txs } = useTxs();
  const { goals } = useGoals();
  const { budgets } = useBudgets();
  const { subs } = useSubs();
  const { profile } = useProfile();
  const cur = profile.currency;

  const weekly = last7Spend(txs);
  const weekLabels = weekly.map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return "SMTWTFS"[d.getDay()];
  });
  const max = Math.max(...weekly, 1);

  // Animated 7-day bars: grow on mount, on data change, and on every revisit.
  const reduced = useReducedMotion();
  const focusCount = useFocusCount();
  const barAnims = useRef(weekly.map(() => new Animated.Value(0))).current;
  const weeklyKey = JSON.stringify(weekly.map((v) => Math.round(v)));
  useEffect(() => {
    if (reduced) {
      barAnims.forEach((a) => a.setValue(1));
      return;
    }
    barAnims.forEach((a) => a.setValue(0));
    const anim = Animated.stagger(
      70,
      barAnims.map((a) =>
        Animated.timing(a, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false })
      )
    );
    anim.start();
    return () => anim.stop();
  }, [weeklyKey, reduced, focusCount]);
  const { monthIn, monthOut } = monthTotals(txs);
  const totalBalance = monthIn - monthOut;
  const spent = spentByCategory(txs);
  const alertCount = getAlerts(txs, goals, budgets, subs, cur).length;

  // Live month-over-month spend delta for the hero chip (was hardcoded +2.4%).
  const now = new Date();
  const lastRef = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthName = lastRef.toLocaleDateString("en-US", { month: "short" });
  const lastOut = txs.reduce((s, t) => {
    if (t.amount >= 0) return s;
    const d = new Date(t.ts);
    return d.getFullYear() === lastRef.getFullYear() && d.getMonth() === lastRef.getMonth()
      ? s + Math.abs(t.amount)
      : s;
  }, 0);
  const chip = (() => {
    if (txs.length === 0) return { text: "Add to begin", icon: "sparkles-outline", color: "#B8AEA4", bg: "rgba(255,255,255,0.08)" };
    if (lastOut === 0) return { text: "First month", icon: "leaf-outline", color: "#9ED6A0", bg: "rgba(91,140,90,0.2)" };
    const pct = Math.round(((monthOut - lastOut) / lastOut) * 100);
    const down = pct <= 0;
    return {
      text: `${down ? "−" : "+"}${Math.abs(pct)}% vs ${lastMonthName}`,
      icon: down ? "trending-down-outline" : "trending-up-outline",
      color: down ? "#9ED6A0" : "#E8A08D",
      bg: down ? "rgba(91,140,90,0.2)" : "rgba(200,110,75,0.2)",
    };
  })();

  const goTab = (screen: string) => navigation.navigate("Main", { screen });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <FadeInView>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.avatar}
            onPress={() => navigation.navigate("Profile")}
            accessibilityLabel="Open profile"
          >
            <Text style={styles.avatarText}>{initialOf(profile.name)}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.hi}>{greetingFor()}, {profile.name}</Text>
            <Text style={styles.sub}>Let's check your money today</Text>
          </View>
          <TouchableOpacity
            style={styles.gear}
            onPress={() => navigation.navigate("Profile")}
            accessibilityLabel="Edit profile"
          >
            <Ionicons name="person-outline" size={22} color={colors.ink2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bell}
            onPress={() => navigation.navigate("Alerts")}
            accessibilityLabel={`Notifications, ${alertCount} active`}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.ink2} />
            {alertCount > 0 ? <View style={styles.dot} /> : null}
          </TouchableOpacity>
        </View>
        </FadeInView>

        <FadeInView delay={40}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>TOTAL BALANCE</Text>
            <View style={[styles.heroChip, { backgroundColor: chip.bg }]}>
              <Ionicons name={chip.icon as React.ComponentProps<typeof Ionicons>["name"]} size={14} color={chip.color} />
              <Text style={[styles.heroChipText, { color: chip.color }]}>{chip.text}</Text>
            </View>
          </View>
          <Text style={styles.heroBalance}>{money(totalBalance, cur)}</Text>
          <View style={styles.heroRow}>
            <View style={styles.inOut}>
              <View style={styles.inOutHead}>
                <Ionicons name="arrow-down-circle-outline" size={14} color="#9ED6A0" />
                <Text style={styles.inOutLabel}>Income</Text>
              </View>
              <Text style={styles.inOutVal}>{money(monthIn, cur)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.inOut}>
              <View style={styles.inOutHead}>
                <Ionicons name="arrow-up-circle-outline" size={14} color="#E8A08D" />
                <Text style={styles.inOutLabel}>Spent</Text>
              </View>
              <Text style={styles.inOutVal}>{money(monthOut, cur)}</Text>
            </View>
            <TouchableOpacity style={styles.reportBtn} onPress={() => navigation.navigate("Insight")}>
              <Text style={{ color: "#fff", fontWeight: "700", fontFamily: fonts.bodyBold }}>Insight</Text>
              <Ionicons name="arrow-forward-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.bars}>
            {weekly.map((v, i) => {
              const target = 10 + (max > 0 ? (v / max) * 52 : 0);
              const height = barAnims[i].interpolate({ inputRange: [0, 1], outputRange: [10, target] });
              return (
                <View key={i} style={styles.barWrap}>
                  <Animated.View style={[styles.bar, { height, backgroundColor: v === max && v > 0 ? colors.accent : "rgba(255,255,255,0.22)" }]} />
                  <Text style={styles.barLabel}>{weekLabels[i]}</Text>
                </View>
              );
            })}
          </View>
        </View>
        </FadeInView>

        <FadeInView delay={80}>
        <View style={styles.actions}>
          {QUICK.map((a) => (
            <TouchableOpacity key={a.label} style={styles.action} onPress={() => navigation.navigate(a.route, a.route === "AddModal" ? { id: undefined } : undefined)}>
              <View style={styles.actionIcon}>
                <Ionicons name={a.icon} size={24} color={colors.ink} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        </FadeInView>

        <FadeInView delay={60}>
          <SectionTitle title="October budgets" action="See all" onPress={() => goTab("Budgets")} />
        </FadeInView>
        <FadeInView delay={120}>
        <Card>
          {budgets.length === 0 ? (
            <Text style={{ color: colors.muted, textAlign: "center", paddingVertical: 8, fontFamily: fonts.body }}>No budgets yet.</Text>
          ) : (
            budgets.slice(0, 3).map((b) => {
            const used = b.cats.reduce((s, c) => s + (spent[c] ?? 0), 0);
            return (
              <View key={b.id} style={styles.budgetRow}>
                <AppIcon name={b.icon} tileSize={38} size={20} />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text style={{ fontWeight: "600", fontFamily: fonts.bodyMedium, color: colors.ink }}>{b.label}</Text>
                    <Text style={{ color: colors.muted, fontSize: 13 , fontFamily: fonts.body}}>{money(used, cur)} / {money(b.limit, cur)}</Text>
                  </View>
                  <ProgressBar value={b.limit > 0 ? used / b.limit : 0} fill={used > b.limit ? colors.danger : colors.accent} />
                </View>
              </View>
            );
          })
        )}
        </Card>
        </FadeInView>

        <View style={{ height: 16 }} />
        <FadeInView delay={180}>
          <SectionTitle title="Recent activity" action="See all" onPress={() => goTab("Transactions")} />
        </FadeInView>
        <FadeInView delay={220}>
        <Card style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
          {txs.length === 0 ? (
            <Text style={{ padding: 20, color: colors.muted, textAlign: "center", fontFamily: fonts.body }}>No transactions yet. Tap Add to record your first one.</Text>
          ) : (
            txs.slice(0, 4).map((t) => <TransactionRow key={t.id} tx={t} />)
          )}
        </Card>
        </FadeInView>

        <View style={{ height: 16 }} />
        <FadeInView delay={260}>
          <SectionTitle title="Savings goals" action="See all" onPress={() => goTab("Goals")} />
        </FadeInView>
        {goals.length === 0 ? (
          <Card style={{ marginBottom: 12 }}>
            <Text style={{ color: colors.muted, textAlign: "center", paddingVertical: 8, fontFamily: fonts.body }}>No goals yet. Create one from the Goals tab.</Text>
          </Card>
        ) : (
        goals.slice(0, 2).map((g, gi) => (
          <FadeInView key={g.id} delay={300 + gi * 80}>
          <Card style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <AppIcon name={g.icon} tileSize={38} size={20} />
              <Text style={{ fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink, flex: 1 }}>{g.title}</Text>
              <Text style={{ color: colors.accent, fontWeight: "700", fontFamily: fonts.bodyBold }}>{g.target > 0 ? Math.round((g.saved / g.target) * 100) : 0}%</Text>
            </View>
            <ProgressBar value={g.target > 0 ? g.saved / g.target : 0} fill={colors.success} />
            <Text style={{ marginTop: 6, color: colors.muted, fontSize: 13 , fontFamily: fonts.body}}>{money(Math.max(0, g.target - g.saved), cur)} to go · {g.note}</Text>
          </Card>
          </FadeInView>
        )))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: HEADER_TOP, marginBottom: 16 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 19, fontWeight: "800", fontFamily: fonts.bodyXB },
  hi: { fontSize: 17, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink },
  sub: { fontSize: 13, fontFamily: fonts.body, color: colors.muted },
  bell: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  gear: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  dot: { position: "absolute", top: 12, right: 13, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  hero: { backgroundColor: colors.dark, borderRadius: radius.xl, padding: 20, marginBottom: 16 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroLabel: { color: "#B8AEA4", fontSize: 11, letterSpacing: 1.2, fontWeight: "700", fontFamily: fonts.bodyBold },
  heroChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(91,140,90,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  heroChipText: { color: "#9ED6A0", fontSize: 12, fontWeight: "600", fontFamily: fonts.bodyMedium },
  heroBalance: { color: "#fff", fontSize: 38, fontWeight: "800", marginTop: 6, letterSpacing: -0.5, fontFamily: fonts.displayXB },
  heroRow: { flexDirection: "row", alignItems: "center", marginTop: 14, gap: 12 },
  inOut: { flex: 1 },
  inOutHead: { flexDirection: "row", alignItems: "center", gap: 4 },
  inOutLabel: { color: "#B8AEA4", fontSize: 12 , fontFamily: fonts.body},
  inOutVal: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: fonts.bodyBold, marginTop: 2 },
  divider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.15)" },
  reportBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.accent, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99 },
  bars: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 18, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 12 },
  barWrap: { alignItems: "center", gap: 6, flex: 1 },
  bar: { width: 14, borderRadius: 7 },
  barLabel: { color: "#8A8178", fontSize: 10, fontWeight: "600", fontFamily: fonts.bodyMedium },
  actions: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  action: { alignItems: "center", gap: 6, flex: 1 },
  actionIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 12.5, fontWeight: "600", fontFamily: fonts.bodyMedium, color: colors.ink2 },
  budgetRow: { flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 14 },
});
