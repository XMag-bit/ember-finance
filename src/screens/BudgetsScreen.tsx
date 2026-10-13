import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fonts } from "../theme";
import { Card, ProgressBar } from "../components/ui";
import { FadeInView } from "../components/motion";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppIcon } from "../components/AppIcon";
import { money, spentByCategory } from "../data/mock";
import { useTxs } from "../store/TxContext";
import { useBudgets } from "../store/BudgetsContext";
import { useProfile } from "../store/UserContext";

export function BudgetsScreen({ navigation }: any) {
  const { txs } = useTxs();
  const { budgets, removeBudget } = useBudgets();
  const { profile } = useProfile();
  const cur = profile.currency;
  const spent = spentByCategory(txs);
  const usedOf = (cats: string[]) => cats.reduce((s, c) => s + (spent[c] ?? 0), 0);

  const totalSpent = budgets.reduce((s, b) => s + usedOf(b.cats), 0);
  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const overall = totalLimit > 0 ? totalSpent / totalLimit : 0;

  function confirmRemove(id: string, name: string) {
    Alert.alert("Delete budget?", `"${name}" will be removed. Your transactions stay.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => removeBudget(id) },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 110 }} keyboardShouldPersistTaps="handled">
        <FadeInView>
          <ScreenHeader title="Budgets" sub={budgets.length === 0 ? "Set your first limit below" : `October · ${money(totalSpent, cur)} of ${money(totalLimit, cur)} used`} />
        </FadeInView>
        <FadeInView delay={40}>
        <TouchableOpacity style={styles.newBudget} onPress={() => navigation.navigate("NewBudget", { id: undefined })} accessibilityLabel="New budget">
          <Ionicons name="add-outline" size={18} color="#fff" />
          <Text style={styles.newBudgetText}>New budget</Text>
        </TouchableOpacity>
        </FadeInView>

        {budgets.length === 0 ? (
          <FadeInView delay={80}>
          <Card style={{ alignItems: "center", paddingVertical: 40 }}>
            <Ionicons name="pie-chart-outline" size={40} color={colors.faint} />
            <Text style={{ fontSize: 17, fontWeight: "800", fontFamily: fonts.bodyXB, color: colors.ink, marginTop: 10 }}>No budgets yet</Text>
            <Text style={{ color: colors.muted, textAlign: "center", marginTop: 6, lineHeight: 20, fontFamily: fonts.body }}>Tap New budget to set your first spending limit - usage tracks automatically.</Text>
          </Card>
          </FadeInView>
        ) : null}

        {budgets.length > 0 ? (
        <>
        <FadeInView delay={60}>
        <Card style={{ marginBottom: 16, backgroundColor: colors.dark, borderColor: colors.dark }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="pie-chart-outline" size={16} color="#B8AEA4" />
            <Text style={{ color: "#B8AEA4", fontSize: 12, fontWeight: "700", fontFamily: fonts.bodyBold, letterSpacing: 1 }}>OVERALL</Text>
          </View>
          <Text style={{ color: "#fff", fontSize: 26, fontWeight: "800", fontFamily: fonts.bodyXB, marginVertical: 4 }}>
            {Math.round(overall * 100)}% used
          </Text>
          <ProgressBar value={overall} track="rgba(255,255,255,0.15)" fill={colors.accent} />
          <Text style={{ color: "#8A8178", marginTop: 8, fontSize: 13 , fontFamily: fonts.body}}>
            {overall >= 1
              ? `${money(totalSpent - totalLimit, cur)} over · time to pause spending`
              : `${money(totalLimit - totalSpent, cur)} left · on track`}
          </Text>
        </Card>
        </FadeInView>
        {budgets.map((b, bi) => {
          const used = usedOf(b.cats);
          const pct = b.limit > 0 ? used / b.limit : 0;
          const over = used > b.limit;
          return (
            <FadeInView key={b.id} delay={(bi % 8) * 60}>
            <Card style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <AppIcon name={b.icon} tileSize={42} size={20} />
                <Text style={{ fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 16, flex: 1 }}>{b.label}</Text>
                <Text style={[styles.badge, over ? styles.over : styles.ok]}>{over ? "Over " + money(used - b.limit, cur) : Math.round(pct * 100) + "%"}</Text>
                <TouchableOpacity onPress={() => navigation.navigate("NewBudget", { id: b.id })} hitSlop={8} accessibilityLabel={`Edit ${b.label}`}>
                  <Ionicons name="pencil-outline" size={18} color={colors.faint} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmRemove(b.id, b.label)} hitSlop={8} accessibilityLabel={`Delete ${b.label}`}>
                  <Ionicons name="trash-outline" size={18} color={colors.faint} />
                </TouchableOpacity>
              </View>
              <View style={{ marginVertical: 10, marginLeft: 52 }}>
                <ProgressBar value={pct} fill={over ? colors.danger : pct > 0.85 ? colors.warning : colors.accent} />
              </View>
              <Text style={{ color: colors.muted, fontSize: 13, fontFamily: fonts.body, marginLeft: 52 }}>{money(used, cur)} of {money(b.limit, cur)} · {money(Math.max(0, b.limit - used), cur)} left</Text>
            </Card>
            </FadeInView>
          );
        })}
        <Text style={styles.hint}>Budgets track this month's spending automatically - new transactions count instantly.</Text>
        </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  badge: { fontSize: 12, fontWeight: "800", fontFamily: fonts.bodyXB, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, overflow: "hidden" },
  ok: { backgroundColor: "#E3EFE3", color: "#2F6B30" },
  over: { backgroundColor: "#FBE3DF", color: "#9C2F23" },
  hint: { color: colors.faint, fontSize: 12.5, fontFamily: fonts.body, textAlign: "center", marginTop: 4 },
  newBudget: { flexDirection: "row", gap: 6, backgroundColor: colors.ink, borderRadius: 99, paddingVertical: 12, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  newBudgetText: { color: "#fff", fontWeight: "700", fontFamily: fonts.bodyBold },
});
