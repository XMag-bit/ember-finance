import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fonts } from "../theme";
import { ScreenHeader } from "../components/ScreenHeader";
import { Card } from "../components/ui";
import { FadeInView } from "../components/motion";
import { CURRENCIES } from "../data/mock";
import { useProfile, initialOf, type Profile } from "../store/UserContext";
import { useTxs } from "../store/TxContext";
import { useGoals } from "../store/GoalsContext";
import { useBudgets } from "../store/BudgetsContext";
import { useSubs } from "../store/SubsContext";
import { clearAllData } from "../store/storage";
import { REMINDER_TIMES, cancelSubReminders, hasPermission, rescheduleAll } from "../data/notifications";

export function ProfileScreen({ navigation }: any) {
  const { profile, updateProfile, resetProfile } = useProfile();
  const { resetTxs } = useTxs();
  const { resetGoals } = useGoals();
  const { resetBudgets } = useBudgets();
  const { subs, setSubNotifIds, resetSubs } = useSubs();
  const [name, setName] = useState(profile.name);
  const [currency, setCurrency] = useState(profile.currency);
  const [remindersEnabled, setRemindersEnabled] = useState(profile.remindersEnabled);
  const [reminderTime, setReminderTime] = useState(profile.reminderTime);
  const [nameError, setNameError] = useState<string | undefined>(undefined);

  const dirty =
    name.trim() !== profile.name ||
    currency !== profile.currency ||
    remindersEnabled !== profile.remindersEnabled ||
    reminderTime !== profile.reminderTime;

  function validate(): boolean {
    if (name.trim().length < 2) {
      setNameError("Enter at least 2 characters.");
      return false;
    }
    setNameError(undefined);
    return true;
  }

  function handleSave() {
    if (!validate()) return;
    const next: Profile = {
      ...profile,
      name: name.trim(),
      currency,
      remindersEnabled,
      reminderTime,
    };
    updateProfile(next);
    applyReminderSettings(next);
    Alert.alert("Profile saved", `Looking good, ${next.name}.`, [
      { text: "Done", onPress: () => navigation.goBack() },
    ]);
  }

  async function applyReminderSettings(next: Profile) {
    if (!next.remindersEnabled) {
      for (const s of subs) {
        await cancelSubReminders(s);
        setSubNotifIds(s.id, []);
      }
      return;
    }
    if (!(await hasPermission())) return;
    const map = await rescheduleAll(subs, { time: next.reminderTime, currency: next.currency });
    for (const [id, ids] of Object.entries(map)) setSubNotifIds(id, ids);
  }

  function handleCancel() {
    if (!dirty) {
      navigation.goBack();
      return;
    }
    Alert.alert("Discard changes?", "Your edits will be lost.", [
      { text: "Keep editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => navigation.goBack() },
    ]);
  }

  function handleReset() {
    Alert.alert("Reset all data?", "This erases your profile, transactions, budgets, goals and subscriptions on this phone. It cannot be undone.", [
      { text: "Keep my data", style: "cancel" },
      {
        text: "Reset everything",
        style: "destructive",
        onPress: () => {
          clearAllData().then(() => {
            resetTxs();
            resetGoals();
            resetBudgets();
            resetSubs();
            resetProfile();
          });
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <FadeInView>
          <ScreenHeader title="Profile" sub="Edit your personal details" onBack={() => navigation.goBack()} />
        </FadeInView>

        {/* Avatar preview - updates live as you type your name */}
        <FadeInView delay={60}>
        <Card style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialOf(name)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.avatarName}>{name.trim() || "Your name"}</Text>
            <Text style={styles.avatarSub}>{currency}</Text>
          </View>
          <Ionicons name="pencil-outline" size={18} color={colors.muted} />
        </Card>
        </FadeInView>

        <FadeInView delay={120}>
        <Text style={styles.label}>Full name</Text>
        </FadeInView>
        <FadeInView delay={140}>
        <TextInput
          value={name}
          onChangeText={(t) => {
            setName(t);
            if (nameError) setNameError(undefined);
          }}
          placeholder="e.g. Maya Santos"
          autoCapitalize="words"
          returnKeyType="next"
          style={[styles.input, nameError ? styles.inputError : null]}
          placeholderTextColor={colors.faint}
          accessibilityLabel="Full name"
        />
        </FadeInView>
        {nameError ? <Text style={styles.error}>{nameError}</Text> : null}

        <FadeInView delay={200}>
        <Text style={styles.label}>Currency</Text>
        </FadeInView>
        <FadeInView delay={220}>
        <View style={styles.currencyRow}>
          {CURRENCIES.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setCurrency(c)}
              style={[styles.currency, currency === c && styles.currencyActive]}
              accessibilityLabel={`Currency ${c}`}
              accessibilityState={{ selected: currency === c }}
            >
              <Text
                style={[styles.currencyText, currency === c && styles.currencyTextActive]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        </FadeInView>

        <FadeInView delay={250}>
        <Text style={styles.label}>Subscription reminders</Text>
        </FadeInView>
        <FadeInView delay={260}>
        <View style={styles.remRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.remTitle}>Renewal alerts</Text>
            <Text style={styles.remSub}>3 days, 1 day and on the due date</Text>
          </View>
          <Switch
            value={remindersEnabled}
            onValueChange={setRemindersEnabled}
            trackColor={{ false: colors.border, true: colors.accent }}
            accessibilityLabel="Subscription reminders"
          />
        </View>
        </FadeInView>
        {remindersEnabled ? (
          <FadeInView delay={270}>
          <View style={styles.timeRow}>
            {REMINDER_TIMES.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setReminderTime(t)}
                style={[styles.time, reminderTime === t && styles.timeActive]}
                accessibilityLabel={`Remind at ${t}`}
                accessibilityState={{ selected: reminderTime === t }}
              >
                <Text style={[styles.timeText, reminderTime === t && styles.timeTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          </FadeInView>
        ) : null}

        <FadeInView delay={280}>
        <TouchableOpacity
          style={[styles.save, !dirty && styles.saveDisabled]}
          onPress={handleSave}
          activeOpacity={0.85}
          accessibilityLabel="Save profile"
        >
          <Ionicons name="checkmark-outline" size={20} color="#fff" />
          <Text style={styles.saveText}>Save changes</Text>
        </TouchableOpacity>
        </FadeInView>

        <FadeInView delay={320}>
        <TouchableOpacity
          style={styles.cancel}
          onPress={handleCancel}
          accessibilityLabel="Cancel editing"
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        </FadeInView>

        {!dirty ? (
          <Text style={styles.hintCenter}>No unsaved changes.</Text>
        ) : (
          <Text style={styles.hintCenter}>You have unsaved changes.</Text>
        )}

        <FadeInView delay={360}>
        <TouchableOpacity
          style={styles.reset}
          onPress={handleReset}
          accessibilityLabel="Reset all data"
        >
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
          <Text style={styles.resetText}>Reset all data</Text>
        </TouchableOpacity>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatarCard: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "800", fontFamily: fonts.bodyXB },
  avatarName: { fontSize: 17, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink },
  avatarSub: { fontSize: 13, fontFamily: fonts.body, color: colors.muted, marginTop: 2 },
  label: { fontSize: 14, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink, marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16, fontFamily: fonts.body,
    color: colors.ink,
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13, marginTop: 6, fontWeight: "600", fontFamily: fonts.bodyMedium },
  hint: { color: colors.muted, fontSize: 13, fontFamily: fonts.body, marginTop: 6 },
  hintCenter: { color: colors.muted, fontSize: 13, fontFamily: fonts.body, marginTop: 12, textAlign: "center" },
  currencyRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  currency: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 99,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 64,
    alignItems: "center",
  },
  currencyActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  currencyText: { fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink2, fontSize: 14 },
  currencyTextActive: { color: "#fff" },
  remRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
  remTitle: { fontSize: 15, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink },
  remSub: { fontSize: 13, fontFamily: fonts.body, color: colors.muted, marginTop: 2 },
  timeRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  time: { flex: 1, paddingVertical: 12, borderRadius: 99, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  timeActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  timeText: { fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink2, fontSize: 13 },
  timeTextActive: { color: "#fff" },
  save: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 18,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  saveDisabled: { opacity: 0.55 },
  saveText: { color: "#fff", fontSize: 17, fontWeight: "800", fontFamily: fonts.bodyXB },
  cancel: {
    borderRadius: 18,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelText: { fontSize: 16, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink },
  reset: {
    flexDirection: "row",
    gap: 8,
    borderRadius: 18,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: "#F0D3BF",
  },
  resetText: { fontSize: 16, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.danger },
});
