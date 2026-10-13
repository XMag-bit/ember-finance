import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "../theme";
import { AppIcon } from "./AppIcon";
import { SlideUpSheet } from "./motion";
import { CATEGORY_ICONS } from "../data/mock";

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  /** Currently selected categories. */
  selected: string[];
  /** Toggle one category. In single mode the parent closes the sheet. */
  onToggle: (name: string) => void;
  /** When true the sheet stays open for multi-pick and shows Done. */
  multi?: boolean;
};

/**
 * Warm-Earth themed category list: icon tile + name rows with checkmarks,
 * dividers, and a custom-name row at the bottom. Used everywhere a category
 * is picked (Add, PayConfirm, NewBudget).
 */
export function CategorySheet({ visible, onClose, title, options, selected, onToggle, multi = false }: Props) {
  const [custom, setCustom] = useState("");

  function addCustom() {
    const name = custom.trim();
    if (name.length < 2) {
      Alert.alert("Name it", "Give the category at least 2 characters.");
      return;
    }
    setCustom("");
    onToggle(name);
  }

  return (
    <SlideUpSheet visible={visible} onClose={onClose} closeLabel="Close categories">
      <Text style={styles.title}>{title}</Text>
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {options.map((c, i) => {
          const active = selected.includes(c);
          return (
            <TouchableOpacity
              key={c}
              onPress={() => onToggle(c)}
              style={[styles.row, i < options.length - 1 && styles.divider]}
              accessibilityLabel={`Category ${c}`}
              accessibilityState={{ selected: active }}
            >
              <AppIcon name={CATEGORY_ICONS[c] ?? "receipt-outline"} tileSize={42} size={20} />
              <Text style={styles.name}>{c}</Text>
              {active ? (
                <View style={styles.check}>
                  <Ionicons name="checkmark-outline" size={16} color="#fff" />
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
        <View style={styles.customRow}>
          <TextInput
            value={custom}
            onChangeText={setCustom}
            placeholder="Custom, e.g. Pets"
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={addCustom}
            style={[styles.customInput, { flex: 1, marginTop: 0 }]}
            placeholderTextColor={colors.faint}
            accessibilityLabel="Custom category name"
          />
          <TouchableOpacity onPress={addCustom} style={styles.customAdd} accessibilityLabel="Add category">
            <Text style={styles.customAddText}>Add</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {multi ? (
        <TouchableOpacity style={styles.done} onPress={onClose} accessibilityLabel="Done picking categories">
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      ) : null}
    </SlideUpSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "800", fontFamily: fonts.bodyXB, color: colors.ink, marginBottom: 8 },
  list: { maxHeight: 340 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#F1ECE5" },
  name: { flex: 1, fontSize: 15, fontWeight: "600", fontFamily: fonts.bodyMedium, color: colors.ink },
  check: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.success, alignItems: "center", justifyContent: "center" },
  customRow: { flexDirection: "row", gap: 8, marginTop: 12, alignItems: "center" },
  customInput: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, fontSize: 15, fontFamily: fonts.body },
  customAdd: { backgroundColor: colors.ink, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14 },
  customAddText: { color: "#fff", fontWeight: "800", fontFamily: fonts.bodyXB, fontSize: 14 },
  done: { backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 14 },
  doneText: { color: "#fff", fontSize: 16, fontWeight: "800", fontFamily: fonts.bodyXB },
});
