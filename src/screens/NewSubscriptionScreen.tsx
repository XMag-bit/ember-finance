import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fonts } from "../theme";
import { Card } from "../components/ui";
import { FadeInView, SlideUpSheet } from "../components/motion";
import { ScreenHeader } from "../components/ScreenHeader";
import { Calendar } from "../components/Calendar";
import { AmountInput } from "../components/AmountInput";
import { CURRENCY_SYMBOLS } from "../data/mock";
import { CYCLES, type Cycle } from "../data/subscriptions";
import { cancelSubReminders, ensurePermission, hasPermission, scheduleSubReminders } from "../data/notifications";
import { useSubs } from "../store/SubsContext";
import { useProfile } from "../store/UserContext";

function atNoon(d: Date): Date {
  const c = new Date(d);
  c.setHours(12, 0, 0, 0);
  return c;
}

export function NewSubscriptionScreen({ navigation, route }: any) {
  const { subs, addSub, updateSub, removeSub, setSubNotifIds } = useSubs();
  const { profile } = useProfile();
  const cur = profile.currency;
  const symbol = CURRENCY_SYMBOLS[cur as keyof typeof CURRENCY_SYMBOLS] ?? "$";
  const editingId: string | undefined = route?.params?.id;
  const existing = subs.find((s) => s.id === editingId);

  const [name, setName] = useState(existing?.name ?? "");
  const [amount, setAmount] = useState<number>(existing?.amount ?? NaN);
  const [cycle, setCycle] = useState<Cycle>(existing?.cycle ?? "monthly");
  const [next, setNext] = useState(() => atNoon(existing ? new Date(existing.nextTs) : new Date()));
  const [calOpen, setCalOpen] = useState(false);
  const [permBlocked, setPermBlocked] = useState(false);

  // Resync when the same instance is reused with a different id param.
  useEffect(() => {
    const s = subs.find((x) => x.id === editingId);
    setName(s?.name ?? "");
    setAmount(s?.amount ?? NaN);
    setCycle(s?.cycle ?? "monthly");
    setNext(atNoon(s ? new Date(s.nextTs) : new Date()));
  }, [editingId]);

  // Show a hint when reminders are blocked at the OS level.
  useEffect(() => {
    hasPermission().then((ok) => setPermBlocked(!ok));
  }, []);

  async function scheduleFor(id: string, nextTs: number, name: string, amount: number, cycle: Cycle) {
    if (!profile.remindersEnabled) return;
    const granted = await ensurePermission();
    if (!granted) {
      setPermBlocked(true);
      return;
    }
    const ids = await scheduleSubReminders(
      { id, name, amount, cycle, nextTs, icon: "receipt-outline", notifIds: [] },
      { time: profile.reminderTime, currency: profile.currency }
    );
    setSubNotifIds(id, ids);
  }

  async function handleCreate() {
    const value = amount;
    if (name.trim().length < 2) {
      Alert.alert("Name it", "Give it at least 2 characters, e.g. Netflix.");
      return;
    }
    if (isNaN(value) || value <= 0) {
      Alert.alert("Set an amount", "Amount must be a number greater than zero.");
      return;
    }
    if (existing) {
      await cancelSubReminders(existing);
      updateSub(existing.id, { name: name.trim(), amount: value, cycle, nextTs: next.getTime() });
      await scheduleFor(existing.id, next.getTime(), name.trim(), value, cycle);
    } else {
      const created = addSub(name.trim(), value, cycle, next.getTime());
      await scheduleFor(created.id, created.nextTs, created.name, created.amount, created.cycle);
    }
    navigation.goBack();
  }

  function confirmDelete() {
    if (!existing) return;
    Alert.alert("Delete subscription?", `"${existing.name}" will be removed from tracking.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          cancelSubReminders(existing).then(() => {
            removeSub(existing.id);
            navigation.goBack();
          });
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <FadeInView>
          <ScreenHeader
            title={existing ? "Edit subscription" : "New subscription"}
            sub="Get reminded before each renewal"
            onBack={() => navigation.goBack()}
          />
        </FadeInView>
        <FadeInView delay={60}>
          <Card style={{ marginBottom: 14 }}>
            <Text style={styles.label}>Service name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Netflix"
              style={styles.input}
              placeholderTextColor={colors.faint}
              accessibilityLabel="Service name"
            />
            <Text style={styles.label}>Amount ({symbol})</Text>
            <AmountInput
              value={amount}
              onChangeValue={setAmount}
              currency={cur}
              placeholder="e.g. 15.99"
              style={styles.input}
              placeholderTextColor={colors.faint}
              accessibilityLabel="Amount"
            />
            <Text style={styles.label}>Billing cycle</Text>
            <View style={styles.cycleRow}>
              {CYCLES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCycle(c)}
                  style={[styles.cycle, cycle === c && styles.cycleActive]}
                  accessibilityLabel={`Cycle ${c}`}
                  accessibilityState={{ selected: cycle === c }}
                >
                  <Text style={[styles.cycleText, cycle === c && styles.cycleTextActive]}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Next renewal</Text>
            <TouchableOpacity onPress={() => setCalOpen(true)} style={styles.dateButton} accessibilityLabel="Pick renewal date">
              <Ionicons name="calendar-outline" size={20} color={colors.accent} />
              <Text style={styles.dateText}>
                {next.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </Text>
              <Ionicons name="chevron-forward-outline" size={18} color={colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.create} onPress={handleCreate} accessibilityLabel={existing ? "Save changes" : "Create subscription"}>
              <Text style={styles.createText}>{existing ? "Save changes" : "Create subscription"}</Text>
            </TouchableOpacity>
            {permBlocked ? (
              <View style={styles.permHint}>
                <Ionicons name="notifications-off-outline" size={18} color={colors.muted} />
                <Text style={styles.permText}>Phone reminders are off.</Text>
                <TouchableOpacity onPress={() => Linking.openSettings()} accessibilityLabel="Open notification settings">
                  <Text style={styles.permLink}>Open settings</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {existing ? (
              <TouchableOpacity style={styles.delete} onPress={confirmDelete} accessibilityLabel="Delete subscription">
                <Text style={styles.deleteText}>Delete subscription</Text>
              </TouchableOpacity>
            ) : null}
          </Card>
        </FadeInView>
      </ScrollView>

      <SlideUpSheet visible={calOpen} onClose={() => setCalOpen(false)} closeLabel="Close calendar">
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", fontFamily: fonts.bodyXB, color: colors.ink }}>
            Next renewal
          </Text>
        </View>
        <Calendar
          value={next}
          onChange={(d) => {
            setNext(d);
            setCalOpen(false);
          }}
          allowFuture
        />
      </SlideUpSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, fontSize: 16, fontFamily: fonts.body },
  cycleRow: { flexDirection: "row", gap: 8 },
  cycle: { flex: 1, paddingVertical: 12, borderRadius: 99, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  cycleActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  cycleText: { fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink2, fontSize: 13 },
  cycleTextActive: { color: "#fff" },
  dateButton: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14 },
  dateText: { flex: 1, fontSize: 16, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink },
  create: { backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 14 },
  createText: { color: "#fff", fontSize: 16, fontWeight: "800", fontFamily: fonts.bodyXB },
  permHint: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  permText: { flex: 1, fontSize: 13, fontFamily: fonts.body, color: colors.muted },
  permLink: { fontSize: 13, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.accent },
  delete: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: "#F0D3BF",
  },
  deleteText: { color: colors.danger, fontSize: 16, fontWeight: "800", fontFamily: fonts.bodyXB },
});
