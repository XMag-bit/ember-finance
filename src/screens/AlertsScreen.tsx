import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fonts } from "../theme";
import { Card } from "../components/ui";
import { FadeInView } from "../components/motion";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppIcon } from "../components/AppIcon";
import { getAlerts } from "../data/alerts";
import { useTxs } from "../store/TxContext";
import { useGoals } from "../store/GoalsContext";
import { useBudgets } from "../store/BudgetsContext";
import { useSubs } from "../store/SubsContext";
import { useProfile } from "../store/UserContext";

const TONE_BG = {
  bad: colors.dangerSoft,
  warn: colors.warningSoft,
  good: colors.successSoft,
} as const;

export function AlertsScreen({ navigation }: any) {
  const { txs } = useTxs();
  const { goals } = useGoals();
  const { budgets } = useBudgets();
  const { subs } = useSubs();
  const { profile } = useProfile();
  const alerts = getAlerts(txs, goals, budgets, subs, profile.currency);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}>
        <FadeInView>
          <ScreenHeader title="Notifications" sub={`${alerts.length} active`} onBack={() => navigation?.goBack()} />
        </FadeInView>
        {alerts.length === 0 ? (
          <FadeInView delay={80}>
          <Card style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={40} color={colors.success} />
            <Text style={styles.emptyTitle}>All clear</Text>
            <Text style={styles.emptySub}>
              No budget warnings or milestones right now. We'll flag overspending and goal wins here.
            </Text>
          </Card>
          </FadeInView>
        ) : (
          alerts.map((a, ai) => (
            <FadeInView key={a.id} delay={(ai % 8) * 60}>
            <Card style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
                <AppIcon
                  name={a.icon}
                  tileSize={44}
                  size={22}
                  background={TONE_BG[a.tone]}
                  color={colors.ink}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{a.title}</Text>
                  <Text style={styles.body}>{a.body}</Text>
                </View>
              </View>
            </Card>
            </FadeInView>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 15, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink },
  body: { fontSize: 13.5, fontFamily: fonts.body, color: colors.ink2, marginTop: 4, lineHeight: 19 },
  empty: { alignItems: "center", paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "800", fontFamily: fonts.bodyXB, color: colors.ink, marginTop: 8 },
  emptySub: { fontSize: 14, fontFamily: fonts.body, color: colors.muted, textAlign: "center", lineHeight: 21 },
});
