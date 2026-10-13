import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fonts } from "../theme";
import { Card } from "../components/ui";
import { FadeInView, SlideUpSheet } from "../components/motion";
import { ScreenHeader } from "../components/ScreenHeader";
import { AppIcon } from "../components/AppIcon";
import { AmountInput } from "../components/AmountInput";
import { CategorySheet } from "../components/CategorySheet";
import { categories, CATEGORY_ICONS, money } from "../data/mock";
import { useTxs } from "../store/TxContext";
import { useProfile } from "../store/UserContext";

export const E_MONEY_GROUPS = [
  {
    title: "International",
    methods: ["PayPal", "Apple Pay", "Google Pay", "Samsung Pay", "Alipay", "WeChat Pay", "GrabPay"],
  },
  {
    title: "Indonesia",
    methods: [
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
    ],
  },
];

/** Best-effort URL schemes per provider. Missing entry = open manually. */
const APP_SCHEMES: Record<string, string> = {
  PayPal: "paypal://",
  Alipay: "alipay://",
  "WeChat Pay": "weixin://",
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
  const [catOpen, setCatOpen] = useState(false);
  const [method, setMethod] = useState<string>(profile.lastPayMethod || "Cash");
  const [customName, setCustomName] = useState("");
  const [emOpen, setEmOpen] = useState(false);

  const isCash = method === "Cash";
  const customs = profile.customPayMethods.filter(
    (m) => m !== "Cash" && !E_MONEY_GROUPS.some((g) => g.methods.includes(m))
  );

  function pickProvider(name: string) {
    setMethod(name);
    setEmOpen(false);
  }
  const nonIdr = cur !== "IDR";

  function handleAddCustom() {
    const name = customName.trim();
    if (name.length < 2) {
      Alert.alert("Name it", "Give the provider at least 2 characters.");
      return;
    }
    if (name !== "Cash" && !profile.customPayMethods.includes(name)) {
      updateProfile({ ...profile, customPayMethods: [...profile.customPayMethods, name] });
    }
    pickProvider(name);
    setCustomName("");
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
            <TouchableOpacity onPress={() => setCatOpen(true)} style={styles.catButton} accessibilityLabel="Pick category">
              <AppIcon name={CATEGORY_ICONS[cat] ?? "receipt-outline"} tileSize={42} size={20} />
              <View style={{ flex: 1 }}>
                <Text style={styles.catText}>{cat || "Pick a category"}</Text>
                <Text style={styles.catSub}>Tap to change</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={18} color={colors.muted} />
            </TouchableOpacity>

            <Text style={styles.label}>Payment method</Text>
            <View style={styles.kindRow}>
              <TouchableOpacity
                onPress={() => setMethod("Cash")}
                style={[styles.kind, isCash && styles.kindActive]}
                accessibilityLabel="Pay with cash"
                accessibilityState={{ selected: isCash }}
              >
                <Ionicons name="cash-outline" size={18} color={isCash ? "#fff" : colors.ink2} />
                <Text style={[styles.kindText, isCash && styles.kindTextActive]}>Cash</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEmOpen(true)}
                style={[styles.kind, !isCash && styles.kindActive]}
                accessibilityLabel="Pay with e-money"
                accessibilityState={{ selected: !isCash }}
              >
                <Ionicons name="wallet-outline" size={18} color={!isCash ? "#fff" : colors.ink2} />
                <Text style={[styles.kindText, !isCash && styles.kindTextActive]}>E-money</Text>
              </TouchableOpacity>
            </View>
            {!isCash ? (
              <TouchableOpacity onPress={() => setEmOpen(true)} style={styles.providerRow} accessibilityLabel="Change e-money provider">
                <Ionicons name="card-outline" size={20} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.providerName}>{method}</Text>
                  <Text style={styles.providerSub}>Tap to change provider</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={18} color={colors.muted} />
              </TouchableOpacity>
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

      <SlideUpSheet visible={emOpen} onClose={() => setEmOpen(false)} closeLabel="Close providers">
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={{ fontSize: 18, fontWeight: "800", fontFamily: fonts.bodyXB, color: colors.ink }}>
            Pay with e-money
          </Text>
        </View>
        {E_MONEY_GROUPS.map((g) => (
          <View key={g.title}>
            <Text style={styles.groupTitle}>{g.title}</Text>
            <View style={styles.chipRow}>
              {g.methods.map((m) => {
                const active = method === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => pickProvider(m)}
                    style={[styles.chip, active && styles.chipActive]}
                    accessibilityLabel={`Pay with ${m}`}
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{m}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        {customs.length > 0 ? (
          <>
            <Text style={styles.groupTitle}>Custom</Text>
            <View style={styles.chipRow}>
              {customs.map((m) => {
                const active = method === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => pickProvider(m)}
                    style={[styles.chip, active && styles.chipActive]}
                    accessibilityLabel={`Pay with ${m}`}
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{m}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : null}
        <View style={styles.customRow}>
          <TextInput
            value={customName}
            onChangeText={setCustomName}
            placeholder="e.g. Jenius"
            style={[styles.input, { flex: 1, marginTop: 0 }]}
            placeholderTextColor={colors.faint}
            accessibilityLabel="Custom provider name"
          />
          <TouchableOpacity onPress={handleAddCustom} style={styles.customAdd} accessibilityLabel="Add provider">
            <Text style={styles.customAddText}>Add</Text>
          </TouchableOpacity>
        </View>
      </SlideUpSheet>
      <CategorySheet
        visible={catOpen}
        onClose={() => setCatOpen(false)}
        title="Category"
        options={[...categories.filter((c) => c !== "Income"), ...customCats]}
        selected={[cat]}
        onToggle={(name) => {
          setCat(name);
          setCatOpen(false);
        }}
      />
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
  catText: { fontSize: 16, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink },
  catSub: { fontSize: 13, fontFamily: fonts.body, color: colors.muted, marginTop: 2 },
  note: { fontSize: 12.5, fontFamily: fonts.body, color: colors.muted, marginTop: 8, lineHeight: 18 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  groupTitle: { fontSize: 13, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.muted, marginTop: 14, marginBottom: 8, letterSpacing: 0.5 },
  kindRow: { flexDirection: "row", gap: 8 },
  kind: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 18, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  kindActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  kindText: { fontWeight: "800", fontFamily: fonts.bodyXB, color: colors.ink2, fontSize: 15 },
  kindTextActive: { color: "#fff" },
  providerRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, marginTop: 10 },
  providerName: { fontSize: 16, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink },
  providerSub: { fontSize: 13, fontFamily: fonts.body, color: colors.muted, marginTop: 2 },
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
