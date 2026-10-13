import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fonts } from "../theme";
import { Card } from "../components/ui";
import { FadeInView } from "../components/motion";
import { ScreenHeader } from "../components/ScreenHeader";
import { AmountInput } from "../components/AmountInput";
import { CategorySheet } from "../components/CategorySheet";
import { AppIcon } from "../components/AppIcon";
import { categories, CATEGORY_ICONS, CURRENCY_SYMBOLS } from "../data/mock";
import { useTxs } from "../store/TxContext";
import { useBudgets } from "../store/BudgetsContext";
import { useProfile } from "../store/UserContext";

export function NewBudgetScreen({ navigation, route }: any) {
  const { customCats } = useTxs();
  const { budgets, addBudget, updateBudget, removeBudget } = useBudgets();
  const { profile } = useProfile();
  const cur = profile.currency;
  const symbol = CURRENCY_SYMBOLS[cur as keyof typeof CURRENCY_SYMBOLS] ?? "$";
  const editingId: string | undefined = route?.params?.id;
  const existing = budgets.find((b) => b.id === editingId);

  const [label, setLabel] = useState(existing?.label ?? "");
  const [limit, setLimit] = useState<number>(existing?.limit ?? NaN);
  const [cats, setCats] = useState<string[]>(existing?.cats ?? []);
  const [catOpen, setCatOpen] = useState(false);

  const choices = [...categories.filter((c) => c !== "Income"), ...customCats];

  // Resync when the same instance is reused with a different id param.
  useEffect(() => {
    const b = budgets.find((x) => x.id === editingId);
    setLabel(b?.label ?? "");
    setLimit(b?.limit ?? NaN);
    setCats(b?.cats ?? []);
  }, [editingId]);

  function handleCreate() {
    const value = limit;
    if (label.trim().length < 2) {
      Alert.alert("Name your budget", "Give it at least 2 characters, e.g. Groceries.");
      return;
    }
    if (isNaN(value) || value <= 0) {
      Alert.alert("Set a limit", "Limit must be a number greater than zero.");
      return;
    }
    if (cats.length === 0) {
      Alert.alert("Pick categories", "Choose at least one category this budget tracks.");
      return;
    }
    if (existing) {
      updateBudget(existing.id, { label: label.trim(), limit: value, cats });
    } else {
      addBudget(label.trim(), value, cats);
    }
    navigation.goBack();
  }

  function confirmDelete() {
    if (!existing) return;
    Alert.alert("Delete budget?", `"${existing.label}" will be removed. Your transactions stay.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          removeBudget(existing.id);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <FadeInView>
          <ScreenHeader title={existing ? "Edit budget" : "New budget"} sub="Set a monthly spending limit" onBack={() => navigation.goBack()} />
        </FadeInView>
        <FadeInView delay={60}>
          <Card style={{ marginBottom: 14 }}>
            <Text style={styles.label}>Budget name</Text>
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="e.g. Groceries"
              style={styles.input}
              placeholderTextColor={colors.faint}
              accessibilityLabel="Budget name"
            />
            <Text style={styles.label}>Monthly limit ({symbol})</Text>
            <AmountInput
              value={limit}
              onChangeValue={setLimit}
              currency={cur}
              placeholder="e.g. 500"
              style={styles.input}
              placeholderTextColor={colors.faint}
              accessibilityLabel="Monthly limit"
            />
            <Text style={styles.label}>Tracks categories</Text>
            <TouchableOpacity onPress={() => setCatOpen(true)} style={styles.catButton} accessibilityLabel="Pick categories">
              <AppIcon name={CATEGORY_ICONS[cats[0]] ?? "receipt-outline"} tileSize={42} size={20} />
              <View style={{ flex: 1 }}>
                <Text style={styles.catText}>
                  {cats.length > 0 ? cats.join(" · ") : "Pick categories"}
                </Text>
                <Text style={styles.catSub}>{cats.length > 0 ? `${cats.length} selected - tap to change` : "Tap to choose"}</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color={colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.create} onPress={handleCreate} accessibilityLabel={existing ? "Save changes" : "Create budget"}>
              <Text style={styles.createText}>{existing ? "Save changes" : "Create budget"}</Text>
            </TouchableOpacity>
            {existing ? (
              <TouchableOpacity style={styles.delete} onPress={confirmDelete} accessibilityLabel="Delete budget">
                <Text style={styles.deleteText}>Delete budget</Text>
              </TouchableOpacity>
            ) : null}
          </Card>
        </FadeInView>
      </ScrollView>
      <CategorySheet
        visible={catOpen}
        onClose={() => setCatOpen(false)}
        title="Tracks categories"
        options={choices}
        selected={cats}
        multi
        onToggle={(name) => setCats((prev) => (prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, fontSize: 16, fontFamily: fonts.body },
  catButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
  },
  catText: { fontSize: 15, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink },
  catSub: { fontSize: 13, fontFamily: fonts.body, color: colors.muted, marginTop: 2 },
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
