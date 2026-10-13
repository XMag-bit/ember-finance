import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fonts } from "../theme";
import { Card } from "../components/ui";
import { FadeInView } from "../components/motion";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppIcon } from "../components/AppIcon";
import { money } from "../data/mock";
import { daysUntil, formatRenewal, monthlyCost, rollForward } from "../data/subscriptions";
import { cancelSubReminders, hasPermission, scheduleSubReminders } from "../data/notifications";
import { useSubs } from "../store/SubsContext";
import { useProfile } from "../store/UserContext";

export function SubscriptionsScreen({ navigation }: any) {
  const { subs, removeSub, markPaid, setSubNotifIds } = useSubs();
  const { profile } = useProfile();
  const cur = profile.currency;

  const total = monthlyCost(subs);
  const soonest = subs.length > 0 ? subs.reduce((a, b) => (daysUntil(a) <= daysUntil(b) ? a : b)) : null;

  async function scheduleFor(sub: Parameters<typeof scheduleSubReminders>[0]) {
    if (!profile.remindersEnabled) return;
    if (!(await hasPermission())) return;
    const ids = await scheduleSubReminders(sub, { time: profile.reminderTime, currency: profile.currency });
    setSubNotifIds(sub.id, ids);
  }

  async function handleMarkPaid(id: string) {
    const s = subs.find((x) => x.id === id);
    if (!s) return;
    await cancelSubReminders(s);
    markPaid(id);
    const moved = { ...s, nextTs: rollForward(s) };
    await scheduleFor(moved);
  }

  function confirmRemove(id: string, subName: string) {
    Alert.alert("Delete subscription?", `"${subName}" will be removed from tracking.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const s = subs.find((x) => x.id === id);
          cancelSubReminders(s ?? { notifIds: [] }).then(() => removeSub(id));
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <FadeInView>
          <ScreenHeader
            title="Subscriptions"
            sub={subs.length === 0 ? "Track renewals below" : `${money(total, cur)}/mo across ${subs.length} sub${subs.length === 1 ? "" : "s"}`}
            onBack={() => navigation?.goBack()}
          />
        </FadeInView>
        <FadeInView delay={40}>
          <TouchableOpacity
            style={styles.newSub}
            onPress={() => navigation.navigate("NewSubscription", { id: undefined })}
            accessibilityLabel="New subscription"
          >
            <Ionicons name="add-outline" size={18} color="#fff" />
            <Text style={styles.newSubText}>New subscription</Text>
          </TouchableOpacity>
        </FadeInView>

        {subs.length === 0 ? (
          <FadeInView delay={80}>
            <Card style={{ alignItems: "center", paddingVertical: 40 }}>
              <Ionicons name="card-outline" size={40} color={colors.faint} />
              <Text style={{ fontSize: 17, fontWeight: "800", fontFamily: fonts.bodyXB, color: colors.ink, marginTop: 10 }}>
                No subscriptions yet
              </Text>
              <Text style={{ color: colors.muted, textAlign: "center", marginTop: 6, lineHeight: 20, fontFamily: fonts.body }}>
                Add Netflix, Spotify, gym - we'll remind you before each renewal.
              </Text>
            </Card>
          </FadeInView>
        ) : null}

        {soonest ? (
          <FadeInView delay={60}>
            <Card style={{ marginBottom: 12, backgroundColor: colors.dark, borderColor: colors.dark }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="notifications-outline" size={16} color="#B8AEA4" />
                <Text style={{ color: "#B8AEA4", fontSize: 12, fontWeight: "700", fontFamily: fonts.bodyBold, letterSpacing: 1 }}>
                  UP NEXT
                </Text>
              </View>
              <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800", fontFamily: fonts.bodyXB, marginVertical: 4 }}>
                {soonest.name} · {money(soonest.amount, cur)}
              </Text>
              <Text style={{ color: "#8A8178", fontSize: 13, fontFamily: fonts.body }}>
                Renews {formatRenewal(soonest)}
              </Text>
            </Card>
          </FadeInView>
        ) : null}

        {subs.map((s, si) => {
          const left = daysUntil(s);
          const overdue = left < 0;
          return (
            <FadeInView key={s.id} delay={(si % 8) * 60}>
              <Card style={{ marginBottom: 12 }}>
                <View style={styles.row}>
                  <AppIcon name={s.icon} tileSize={50} size={24} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: "700", fontSize: 16, fontFamily: fonts.bodyBold, color: colors.ink }}>
                      {s.name}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 13, fontFamily: fonts.body, marginTop: 2 }}>
                      {money(s.amount, cur)} / {s.cycle}
                    </Text>
                  </View>
                  <Text style={[styles.status, overdue && styles.statusOver]}>
                    {formatRenewal(s)}
                  </Text>
                  <TouchableOpacity onPress={() => navigation.navigate("NewSubscription", { id: s.id })} hitSlop={8} accessibilityLabel={`Edit ${s.name}`}>
                    <Ionicons name="pencil-outline" size={18} color={colors.faint} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmRemove(s.id, s.name)} hitSlop={8} accessibilityLabel={`Delete ${s.name}`}>
                    <Ionicons name="trash-outline" size={18} color={colors.faint} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.paid} onPress={() => handleMarkPaid(s.id)} accessibilityLabel={`Mark ${s.name} paid`}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#2F6B30" />
                  <Text style={styles.paidText}>Mark paid</Text>
                </TouchableOpacity>
              </Card>
            </FadeInView>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  newSub: { flexDirection: "row", gap: 6, backgroundColor: colors.ink, borderRadius: 99, paddingVertical: 12, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  newSubText: { color: "#fff", fontWeight: "700", fontFamily: fonts.bodyBold },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  status: { fontSize: 12, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.muted },
  statusOver: { color: colors.danger },
  paid: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.successSoft, borderRadius: 99, paddingVertical: 10, marginTop: 12 },
  paidText: { color: "#2F6B30", fontWeight: "800", fontFamily: fonts.bodyXB, fontSize: 13 },
});
