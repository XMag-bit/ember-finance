import React, { useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing, fonts } from "../theme";
import { Card } from "../components/ui";
import { FadeInView } from "../components/motion";
import { ScreenHeader } from "../components/ScreenHeader";
import { TransactionRow } from "../components/TransactionRow";
import { useTxs } from "../store/TxContext";

const FILTERS = ["All", "Income", "Expenses", "Groceries", "Transport"];

export function TransactionsScreen({ navigation }: any) {
  const { txs, removeTx } = useTxs();
  const [q, setQ] = useState("");
  const [f, setF] = useState("All");
  const methodFilters = React.useMemo(() => {
    const seen: string[] = [];
    for (const t of txs) {
      if (t.paymentMethod && !seen.includes(t.paymentMethod)) seen.push(t.paymentMethod);
    }
    return seen;
  }, [txs]);
  const list = txs.filter((t) => {
    if (f === "Income" && t.amount < 0) return false;
    if (f === "Expenses" && t.amount > 0) return false;
    if (!["All", "Income", "Expenses"].includes(f) && t.category !== f && t.paymentMethod !== f) return false;
    if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  function confirmDelete(id: string, title: string) {
    Alert.alert("Delete transaction?", `"${title}" will be removed.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => removeTx(id) },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 110 }}>
        <FadeInView>
          <ScreenHeader title="Transactions" sub={`${list.length} of ${txs.length} records`} />
        </FadeInView>
        <FadeInView delay={50}>
        <View style={styles.search}>
          <Ionicons name="search-outline" size={20} color={colors.muted} />
          <TextInput placeholder="Search coffee, rent, salary…" value={q} onChangeText={setQ} style={{ flex: 1, fontSize: 15 , fontFamily: fonts.body}} placeholderTextColor={colors.faint} />
        </View>
        </FadeInView>
        <FadeInView delay={100}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {FILTERS.map((x) => (
              <TouchableOpacity key={x} onPress={() => setF(x)} style={[styles.pill, f === x && styles.pillActive]}>
                <Text style={[styles.pillText, f === x && styles.pillTextActive]}>{x}</Text>
              </TouchableOpacity>
            ))}
            {methodFilters.map((x) => (
              <TouchableOpacity key={`m:${x}`} onPress={() => setF(x)} style={[styles.pill, f === x && styles.pillActive]}>
                <Text style={[styles.pillText, f === x && styles.pillTextActive]}>{x}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        </FadeInView>
        <Card style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
          {list.map((t, ti) => (
            <FadeInView key={t.id} delay={(ti % 10) * 40} distance={8}>
              <TransactionRow
                tx={t}
                onPress={() => navigation.navigate("AddModal", { id: t.id })}
                onLongPress={() => confirmDelete(t.id, t.title)}
              />
            </FadeInView>
          ))}
          {list.length === 0 && <Text style={{ padding: 20, color: colors.muted, textAlign: "center", fontFamily: fonts.body }}>No matches. Try another search.</Text>}
        </Card>
        {txs.length > 0 ? (
          <Text style={styles.hint}>Tip: long-press a row to delete it.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 12 },
  pill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 99, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  pillActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  pillText: { fontWeight: "600", fontFamily: fonts.bodyMedium, color: colors.ink2, fontSize: 13 },
  pillTextActive: { color: "#fff" },
  hint: { color: colors.faint, fontSize: 12.5, fontFamily: fonts.body, textAlign: "center", marginTop: 12 },
});
