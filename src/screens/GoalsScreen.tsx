import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fonts } from "../theme";
import { Card, ProgressBar } from "../components/ui";
import { FadeInView } from "../components/motion";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppIcon } from "../components/AppIcon";
import { money } from "../data/mock";
import { useGoals } from "../store/GoalsContext";
import { useProfile } from "../store/UserContext";

const FUND_AMOUNTS = [50, 100, 250];

export function GoalsScreen({ navigation }: any) {
  const { goals, addFunds } = useGoals();
  const { profile } = useProfile();
  const cur = profile.currency;

  const [fundingId, setFundingId] = useState<string | null>(null);

  const savedTotal = goals.reduce((s, g) => s + g.saved, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 110 }} keyboardShouldPersistTaps="handled">
        <FadeInView>
          <ScreenHeader title="Goals & savings" sub={`${money(savedTotal, cur)} saved across ${goals.length} goal${goals.length === 1 ? "" : "s"}`} />
        </FadeInView>
        <FadeInView delay={40}>
        <TouchableOpacity style={styles.newGoal} onPress={() => navigation.navigate("NewGoal", { id: undefined })} accessibilityLabel="New savings goal">
          <Ionicons name="add-outline" size={18} color="#fff" />
          <Text style={styles.newGoalText}>New goal</Text>
        </TouchableOpacity>
        </FadeInView>

        {goals.length === 0 ? (
          <FadeInView delay={80}>
          <Card style={{ alignItems: "center", paddingVertical: 32, marginBottom: 12 }}>
            <Ionicons name="trophy-outline" size={36} color={colors.faint} />
            <Text style={{ fontWeight: "800", fontFamily: fonts.bodyXB, color: colors.ink, fontSize: 16, marginTop: 8 }}>No goals yet</Text>
            <Text style={{ color: colors.muted, textAlign: "center", marginTop: 6, lineHeight: 20, fontFamily: fonts.body }}>Tap New goal to save for something that matters.</Text>
          </Card>
          </FadeInView>
        ) : null}

        {goals.map((g, gi) => {
          const pct = g.target > 0 ? g.saved / g.target : 0;
          const funding = fundingId === g.id;
          return (
            <FadeInView key={g.id} delay={(gi % 8) * 60}>
            <Card style={{ marginBottom: 12 }}>
              <View style={styles.row}>
                <AppIcon name={g.icon} tileSize={50} size={24} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink }}>{g.title}</Text>
                  <Text style={{ color: colors.muted, fontSize: 13, fontFamily: fonts.body, marginTop: 2 }}>{money(g.saved, cur)} / {money(g.target, cur)}</Text>
                </View>
                <Text style={{ fontWeight: "800", fontFamily: fonts.bodyXB, color: colors.accent }}>{Math.round(pct * 100)}%</Text>
                <TouchableOpacity onPress={() => navigation.navigate("NewGoal", { id: g.id })} hitSlop={8} accessibilityLabel={`Edit ${g.title}`}>
                  <Ionicons name="pencil-outline" size={16} color={colors.faint} />
                </TouchableOpacity>
              </View>
              <View style={{ marginTop: 12 }}>
                <ProgressBar value={pct} fill={colors.success} />
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <Text style={{ color: colors.muted, fontSize: 13 , fontFamily: fonts.body}}>{money(Math.max(0, g.target - g.saved), cur)} to go · {g.note}</Text>
                <TouchableOpacity onPress={() => setFundingId(funding ? null : g.id)} hitSlop={8}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                    <Text style={{ color: colors.ink, fontWeight: "700", fontFamily: fonts.bodyBold, fontSize: 13 }}>Add funds</Text>
                    <Ionicons name={funding ? "chevron-down-outline" : "chevron-forward-outline"} size={14} color={colors.ink} />
                  </View>
                </TouchableOpacity>
              </View>
              {funding ? (
                <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                  {FUND_AMOUNTS.map((a) => (
                    <TouchableOpacity
                      key={a}
                      style={styles.chip}
                      onPress={() => {
                        addFunds(g.id, a);
                        setFundingId(null);
                      }}
                      accessibilityLabel={`Add ${money(a, cur)} to ${g.title}`}
                    >
                      <Text style={styles.chipText}>+{money(a, cur)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </Card>
            </FadeInView>
          );
        })}

        {goals.length > 0 ? (
        <FadeInView delay={120}>
        <Card style={{ backgroundColor: colors.accentSoft, borderColor: "#F0D3BF" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="bulb-outline" size={18} color={colors.accentInk} />
            <Text style={{ fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.accentInk }}>Smart tip</Text>
          </View>
          <Text style={{ color: colors.accentInk, marginTop: 6, lineHeight: 20, fontFamily: fonts.bodyItalic }}>
            Small monthly contributions add up - fund a goal above to get started.
          </Text>
        </Card>
        </FadeInView>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  newGoal: { flexDirection: "row", gap: 6, backgroundColor: colors.ink, borderRadius: 99, paddingVertical: 12, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  newGoalText: { color: "#fff", fontWeight: "700", fontFamily: fonts.bodyBold },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  chip: { flex: 1, backgroundColor: colors.successSoft, borderRadius: 99, paddingVertical: 10, alignItems: "center" },
  chipText: { color: "#2F6B30", fontWeight: "800", fontFamily: fonts.bodyXB, fontSize: 13 },
});
