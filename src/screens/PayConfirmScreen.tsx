import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fonts } from "../theme";
import { Card } from "../components/ui";
import { FadeInView } from "../components/motion";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppIcon } from "../components/AppIcon";
import { AmountInput } from "../components/AmountInput";
import { categories, CATEGORY_ICONS, money } from "../data/mock";
import { useTxs } from "../store/TxContext";
import { useProfile } from "../store/UserContext";

export const PAY_METHODS = [
  "Cash",
  "GoPay",
  "OVO",
  "DANA",
  "ShopeePay",
  "LinkAja",
  "BCA mobile",
  "BRI (BRImo)",
  "Mandiri (Livin')",
  "BNI",
  "Other bank",
];

/** Best-effort URL schemes per method. Missing entry = open manually. */
const APP_SCHEMES: Record<string, string> = {
  GoPay: "gopay://",
  OVO: "ovo://",
  DANA: "dana://",
  ShopeePay: "shopeepay://",
  LinkAja: "linkaja://",
  "BCA mobile": "bcamobile://",
  "BRI (BRImo)": "brimo://",
  "Mandiri (Livin')": "livin://",
  BNI: "bni://",
};

export function PayConfirmScreen({ navigation, route }: any) {
  const { addTx, customCats } = useTxs();
  const { profile, updateProfile } = useProfile();
  const cur = profile.currency;
  const params = route?.params ?? {};
  const merchant: string = params.merchant ?? "Unknown merchant";
  const city: string = params.city ?? "";
  const dynamic: boolean = params.dynamic === true;
  const scanned = typeof params.amount === "number" ? params.amount : NaN;

  const [amount, setAmount] = useState<number>(scanned);
  const [cat, setCat] = useState<string>("Food");
  const [method, setMethod] = useState<string>(profile.lastPayMethod || "Cash");
  const [customName, setCustomName] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const methods = [...PAY_METHODS, ...profile.customPayMethods.filter((m) => !PAY_METHODS.includes(m))];
  const choices = [...categories.filter((c) => c !== "Income"), ...customCats];
  const nonIdr = cur !== "IDR";

  function handleAddCustom() {
    const name = customName.trim();
    if (name.length < 2) {
      Alert.alert("Name it", "Give the method at least 2 characters.");
      return;
    }
    if (!profile.customPayMethods.includes(name) && !PAY_METHODS.includes(name)) {
      updateProfile({ ...profile, customPayMethods: [...profile.customPayMethods, name] });
    }
    setMethod(name);
    setCustomName("");
    setShowCustom(false);
  }

  async function handleOpenApp() {
    const scheme = APP_SCHEMES[method];
    if (!scheme) {
      Alert.alert("Open manually", `Please open ${method} yourself to complete the payment.`);
      return;
    }
    try {
      const ok = await Linking.canOpenURL(scheme);
      if (!ok) throw new Error("unavailable");
      await Linking.openURL(scheme);
    } catch {
      Alert.alert("Open manually", `Could not open ${method} automatically - please open it yourself to pay.`);
    }
  }

  function handleSave() {
    const value = amount;
    if (isNaN(value) || value <= 0) {
      Alert.alert("Enter an amount", "Amount must be a number greater than zero.");
      return;
    }
    addTx({
      title: merchant,
      amount: -Math.abs(value),
      category: cat,
      ts: Date.now(),
      paymentMethod: method,
    });
    updateProfile({ ...profile, lastPayMethod: method });
    navigation.goBack();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <FadeInView>
          <ScreenHeader title="Confirm payment" sub="Check the details, then pay" onBack={() => navigation.goBack()} />
        </FadeInView>

        <FadeInView delay={60}>
          <Card style={{ marginBottom: 14 }}>
            <View style={styles.merchantRow}>
              <AppIcon name="storefront-outline" tileSize={50} size={24} />
              <View style={{ flex: 1 }}>
                <Text style={styles.merchant} numberOfLines={2}>{merchant}</Text>
                {city ? <Text style={styles.city}>{city}</Text> : null}
              </View>
            </View>
            <Text style={styles.label}>Amount (Rp.)</Text>
            {dynamic && !isNaN(scanned) ? (
              <Text style={styles.fixedAmount}>{money(scanned, "IDR")}</Text>
            ) : (
              <AmountInput
                value={amount}
                onChangeValue={setAmount}
                currency="IDR"
                placeholder="e.g. 54.000"
                style={styles.input}
                placeholderTextColor={colors.faint}
                accessibilityLabel="Amount"
              />
            )}
            {nonIdr ? (
              <Text style={styles.note}>QRIS amounts are in rupiah - saved as scanned.</Text>
            ) : null}
          </Card>
        </FadeInView>

        <FadeInView delay={120}>
          <Card style={{ marginBottom: 14 }}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.chipRow}>
              {choices.map((c) => {
                const active = cat === c;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCat(c)}
                    style={[styles.chip, active && styles.chipActive]}
                    accessibilityLabel={`Category ${c}`}
                    accessibilityState={{ selected: active }}
                  >
                    <Ionicons
                      name={(CATEGORY_ICONS[c] ?? "receipt-outline") as React.ComponentProps<typeof Ionicons>["name"]}
                      size={15}
                      color={active ? "#fff" : colors.ink2}
                    />
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Payment method</Text>
            <View style={styles.chipRow}>
              {methods.map((m) => {
                const active = method === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMethod(m)}
                    style={[styles.chip, active && styles.chipActive]}
                    accessibilityLabel={`Pay with ${m}`}
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{m}</Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                onPress={() => setShowCustom((v) => !v)}
                style={styles.chip}
                accessibilityLabel="Add custom method"
              >
                <Ionicons name="add-outline" size={15} color={colors.ink2} />
                <Text style={styles.chipText}>Custom</Text>
              </TouchableOpacity>
            </View>
            {showCustom ? (
              <View style={styles.customRow}>
                <TextInput
                  value={customName}
                  onChangeText={setCustomName}
                  placeholder="e.g. Jenius"
                  style={[styles.input, { flex: 1, marginTop: 0 }]}
                  placeholderTextColor={colors.faint}
                  accessibilityLabel="Custom method name"
                />
                <TouchableOpacity onPress={handleAddCustom} style={styles.customAdd} accessibilityLabel="Add method">
                  <Text style={styles.customAddText}>Add</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {APP_SCHEMES[method] ? (
              <TouchableOpacity style={styles.openApp} onPress={handleOpenApp} accessibilityLabel={`Open ${method}`}>
                <Ionicons name="open-outline" size={18} color={colors.accent} />
                <Text style={styles.openAppText}>Open {method} app</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={styles.pay} onPress={handleSave} accessibilityLabel="Save expense">
              <Text style={styles.payText}>I've paid - save expense</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancel} onPress={() => navigation.goBack()} accessibilityLabel="Cancel payment">
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Card>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  merchantRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 },
  merchant: { fontSize: 18, fontWeight: "800", fontFamily: fonts.bodyXB, color: colors.ink },
  city: { fontSize: 13, fontFamily: fonts.body, color: colors.muted, marginTop: 2 },
  label: { fontSize: 14, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, fontSize: 16, fontFamily: fonts.body },
  fixedAmount: { fontSize: 30, fontWeight: "800", fontFamily: fonts.bodyXB, color: colors.ink, marginTop: 2 },
  note: { fontSize: 12.5, fontFamily: fonts.body, color: colors.muted, marginTop: 8, lineHeight: 18 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 99, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontWeight: "600", fontFamily: fonts.bodyMedium, color: colors.ink2, fontSize: 13 },
  chipTextActive: { color: "#fff" },
  customRow: { flexDirection: "row", gap: 8, marginTop: 10, alignItems: "center" },
  customAdd: { backgroundColor: colors.ink, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 14 },
  customAddText: { color: "#fff", fontWeight: "800", fontFamily: fonts.bodyXB, fontSize: 14 },
  openApp: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 13, marginTop: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  openAppText: { color: colors.accent, fontSize: 15, fontWeight: "700", fontFamily: fonts.bodyBold },
  pay: { backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 14 },
  payText: { color: "#fff", fontSize: 16, fontWeight: "800", fontFamily: fonts.bodyXB },
  cancel: { borderRadius: 14, paddingVertical: 13, alignItems: "center", marginTop: 10 },
  cancelText: { fontSize: 15, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.muted },
});
