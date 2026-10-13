import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, fonts } from "../theme";
import { Card } from "../components/ui";
import { FadeInView } from "../components/motion";
import { ScreenHeader } from "../components/ScreenHeader";
import { AmountInput } from "../components/AmountInput";
import { useGoals } from "../store/GoalsContext";
import { useProfile } from "../store/UserContext";

export function NewGoalScreen({ navigation, route }: any) {
  const { goals, addGoal, updateGoal, removeGoal } = useGoals();
  const { profile } = useProfile();
  const cur = profile.currency;
  const editingId: string | undefined = route?.params?.id;
  const existing = goals.find((g) => g.id === editingId);

  const [title, setTitle] = useState(existing?.title ?? "");
  const [target, setTarget] = useState<number>(existing?.target ?? NaN);
  const [saved, setSaved] = useState<number>(existing?.saved ?? 0);

  // Resync when the same instance is reused with a different id param.
  useEffect(() => {
    const g = goals.find((x) => x.id === editingId);
    setTitle(g?.title ?? "");
    setTarget(g?.target ?? NaN);
    setSaved(g?.saved ?? 0);
  }, [editingId]);

  function handleCreate() {
    const value = target;
    if (title.trim().length < 2) {
      Alert.alert("Name your goal", "Give it at least 2 characters, e.g. Emergency Fund.");
      return;
    }
    if (isNaN(value) || value <= 0) {
      Alert.alert("Set a target", "Target must be a number greater than zero.");
      return;
    }
    if (existing) {
      const savedValue = saved;
      if (isNaN(savedValue) || savedValue < 0) {
        Alert.alert("Check saved amount", "Saved must be zero or more.");
        return;
      }
      updateGoal(existing.id, { title: title.trim(), target: value, saved: savedValue });
    } else {
      addGoal(title.trim(), value);
    }
    navigation.goBack();
  }

  function confirmDelete() {
    if (!existing) return;
    Alert.alert("Delete goal?", `"${existing.title}" will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          removeGoal(existing.id);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <FadeInView>
          <ScreenHeader title={existing ? "Edit goal" : "New goal"} sub="Save for something that matters" onBack={() => navigation.goBack()} />
        </FadeInView>
        <FadeInView delay={60}>
          <Card style={{ marginBottom: 14 }}>
            <Text style={styles.label}>Goal name</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Emergency Fund"
              style={styles.input}
              placeholderTextColor={colors.faint}
              accessibilityLabel="Goal name"
            />
            <Text style={styles.label}>Target amount</Text>
            <AmountInput
              value={target}
              onChangeValue={setTarget}
              currency={cur}
              placeholder="e.g. 5000"
              style={styles.input}
              placeholderTextColor={colors.faint}
              accessibilityLabel="Target amount"
            />
            {existing ? (
              <>
                <Text style={styles.label}>Saved so far</Text>
                <AmountInput
                  value={saved}
                  onChangeValue={setSaved}
                  currency={cur}
                  placeholder="e.g. 1200"
                  style={styles.input}
                  placeholderTextColor={colors.faint}
                  accessibilityLabel="Saved so far"
                />
              </>
            ) : null}
            <TouchableOpacity style={styles.create} onPress={handleCreate} accessibilityLabel={existing ? "Save changes" : "Create goal"}>
              <Text style={styles.createText}>{existing ? "Save changes" : "Create goal"}</Text>
            </TouchableOpacity>
            {existing ? (
              <TouchableOpacity style={styles.delete} onPress={confirmDelete} accessibilityLabel="Delete goal">
                <Text style={styles.deleteText}>Delete goal</Text>
              </TouchableOpacity>
            ) : null}
          </Card>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, fontSize: 16, fontFamily: fonts.body },
  create: { backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 14 },
  createText: { color: "#fff", fontSize: 16, fontWeight: "800", fontFamily: fonts.bodyXB },
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
