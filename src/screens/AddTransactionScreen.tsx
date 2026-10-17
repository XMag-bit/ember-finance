import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Keyboard, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fonts } from "../theme";
import { CATEGORY_ICONS, CURRENCY_SYMBOLS, categories, isWholeCurrency } from "../data/mock";
import { ScreenHeader } from "../components/ScreenHeader";
import { Calendar } from "../components/Calendar";
import { AmountInput } from "../components/AmountInput";
import { CategorySheet } from "../components/CategorySheet";
import { AppIcon } from "../components/AppIcon";
import { FadeInView, SlideUpSheet } from "../components/motion";
import { useProfile } from "../store/UserContext";
import { useTxs } from "../store/TxContext";

function atNoon(d: Date): Date {
  const c = new Date(d);
  c.setHours(12, 0, 0, 0);
  return c;
}

function isToday(d: Date): boolean {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function AddTransactionScreen({ navigation, route }: any) {
  const { profile } = useProfile();
  const { txs, customCats, addTx, updateTx, removeTx } = useTxs();
  const symbol = CURRENCY_SYMBOLS[profile.currency as keyof typeof CURRENCY_SYMBOLS] ?? "$";
  const editingId: string | undefined = route?.params?.id;
  const existing = txs.find((t) => t.id === editingId);
  const [kind, setKind] = useState<"Expense" | "Income">(existing && existing.amount > 0 ? "Income" : "Expense");
  const [amount, setAmount] = useState<number>(existing ? Math.abs(existing.amount) : NaN);
  const [cat, setCat] = useState<string>(existing?.category ?? "Groceries");
  const [note, setNote] = useState<string>(existing?.title ?? "");
  const [day, setDay] = useState(() => atNoon(existing ? new Date(existing.ts) : new Date()));
  const [calOpen, setCalOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [method, setMethod] = useState<string | null>(existing?.paymentMethod ?? null);

  // Scrolling is a fallback only: enabled while the keyboard is up, with a
  // very large system font, or whenever measured content outgrows the screen.
  const [kbOpen, setKbOpen] = useState(false);
  const [viewH, setViewH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const { fontScale } = useWindowDimensions();
  useEffect(() => {
    const showKey = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideKey = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showKey, () => setKbOpen(true));
    const hide = Keyboard.addListener(hideKey, () => setKbOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const whole = isWholeCurrency(profile.currency);
  // Currency-aware quick chips: IDRxK rounds for rupiah, whole-yen rounds for
  // JPY, small round amounts for the rest. Label matches the short form.
  const quickChips: { v: number; t: string }[] = profile.currency === "IDR"
    ? [
        { v: 10_000, t: "10K" },
        { v: 50_000, t: "50K" },
        { v: 100_000, t: "100K" },
        { v: 500_000, t: "500K" },
      ]
    : whole
      ? [
          { v: 100, t: "100" },
          { v: 500, t: "500" },
          { v: 1_000, t: "1K" },
          { v: 5_000, t: "5K" },
        ]
      : [
          { v: 10, t: "10" },
          { v: 25, t: "25" },
          { v: 50, t: "50" },
          { v: 100, t: "100" },
        ];

  const methodsInUse = React.useMemo(() => {
    const seen: string[] = [];
    for (const t of txs) {
      if (t.paymentMethod && !seen.includes(t.paymentMethod)) seen.push(t.paymentMethod);
    }
    return seen;
  }, [txs]);

  // Resync when the same instance is reused with a different id param.
  useEffect(() => {
    const tx = txs.find((t) => t.id === editingId);
    setKind(tx && tx.amount > 0 ? "Income" : "Expense");
    setAmount(tx ? Math.abs(tx.amount) : NaN);
    setCat(tx?.category ?? "Groceries");
    setNote(tx?.title ?? "");
    setDay(atNoon(tx ? new Date(tx.ts) : new Date()));
    setMethod(tx?.paymentMethod ?? null);
  }, [editingId]);

  function handleSave() {
    const value = amount;
    const category = cat.trim();
    if (isNaN(value) || value <= 0) {
      Alert.alert("Enter an amount", "Amount must be a number greater than zero, e.g. 42.50");
      return;
    }
    if (category.length === 0) {
      Alert.alert("Enter a category", "Type a category name, e.g. Pets or Gadgets.");
      return;
    }
    const d = new Date(day);
    const now = new Date();
    d.setHours(now.getHours(), now.getMinutes(), 0, 0);
    const signed = kind === "Expense" ? -Math.abs(value) : Math.abs(value);
    if (existing) {
      updateTx(existing.id, {
        title: note.trim() || category,
        amount: signed,
        category,
        ts: d.getTime(),
        paymentMethod: method ?? undefined,
      });
      navigation.goBack();
      return;
    }
    addTx({
      title: note.trim() || category,
      amount: signed,
      category,
      ts: d.getTime(),
      paymentMethod: method ?? undefined,
    });
    Alert.alert("Saved", `${kind} ${symbol}${value} · ${note.trim() || category}`, [
      { text: "Done", onPress: () => navigation.goBack() },
    ]);
  }

  function confirmDelete() {
    if (!existing) return;
    Alert.alert("Delete transaction?", `"${existing.title}" will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          removeTx(existing.id);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.md, flexGrow: 1 }}
          scrollEnabled={kbOpen || fontScale >= 1.3 || contentH > viewH + 2}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={kbOpen}
          onLayout={(e) => setViewH(e.nativeEvent.layout.height)}
        >
        <View style={{ flex: 1 }} onLayout={(e) => setContentH(e.nativeEvent.layout.height)}>
          <FadeInView>
            <ScreenHeader title={existing ? "Edit transaction" : "Add transaction"} sub="Saved straight to your records" onBack={() => navigation.goBack()} />
          </FadeInView>
          <FadeInView delay={50}>
          <View style={styles.toggle}>
          {(["Expense", "Income"] as const).map((k) => (
            <TouchableOpacity
              key={k}
              onPress={() => {
                setKind(k);
                setCat(k === "Income" ? "Income" : "Groceries");
              }}
              style={[styles.toggleBtn, kind === k && (k === "Expense" ? styles.tExp : styles.tInc)]}>
              <Text style={[styles.toggleText, kind === k && { color: "#fff" }]}>{k === "Expense" ? "− Expense" : "+ Income"}</Text>
            </TouchableOpacity>
          ))}
          </View>
          </FadeInView>
          <FadeInView delay={100}>
          <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>{kind === "Expense" ? "You're spending" : "You're adding"}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
            <Text style={styles.cur}>{symbol}</Text>
            <AmountInput value={amount} onChangeValue={setAmount} currency={profile.currency} style={styles.amountInput} placeholder={whole ? "0" : "0.00"} placeholderTextColor="#CFC6BB" />
          </View>
          <Text style={styles.hint}>Tap a quick amount:</Text>
          <View style={{ flexDirection: "row", gap: 8, justifyContent: "center", marginTop: 8 }}>
            {quickChips.map((c) => (
              <TouchableOpacity key={c.t} onPress={() => setAmount(c.v)} style={styles.quick}><Text style={styles.quickText}>{symbol}{c.t}</Text></TouchableOpacity>
            ))}
          </View>
        </View>
          </FadeInView>
          <FadeInView delay={150}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={styles.label}>Category</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Scan")}
                style={styles.scanBtn}
                accessibilityLabel="Scan QR code"
              >
                <Ionicons name="qr-code-outline" size={16} color={colors.accent} />
                <Text style={styles.scanText}>Scan QR</Text>
              </TouchableOpacity>
            </View>
          </FadeInView>
          <FadeInView delay={170}>
            <View style={styles.pairRow}>
            <TouchableOpacity onPress={() => setCatOpen(true)} style={styles.catButton} accessibilityLabel="Pick category">
              <AppIcon name={CATEGORY_ICONS[cat] ?? "receipt-outline"} tileSize={34} size={16} />
              <View style={{ flex: 1 }}>
                <Text style={styles.catText} numberOfLines={1}>{cat || "Pick a category"}</Text>
                <Text style={styles.catSub} numberOfLines={1}>Tap to change</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={16} color={colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCalOpen(true)} style={styles.dateButton} accessibilityLabel="Pick date">
              <Ionicons name="calendar-outline" size={18} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.dateText} numberOfLines={1}>
                  {day.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </Text>
                <Text style={styles.dateSub} numberOfLines={1}>{isToday(day) ? "Counting toward today" : "Toward that day"}</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={16} color={colors.muted} />
            </TouchableOpacity>
            </View>
          </FadeInView>
          <FadeInView delay={210}>
            <Text style={styles.label}>Note</Text>
          </FadeInView>
          <FadeInView delay={230}>
          <TextInput value={note} onChangeText={setNote} placeholder="e.g. Weekly groceries at Whole Foods" style={styles.input} placeholderTextColor={colors.faint} />
          </FadeInView>
          {existing && methodsInUse.length > 0 ? (
            <>
              <FadeInView delay={250}>
                <Text style={styles.label}>Payment method</Text>
              </FadeInView>
              <FadeInView delay={260}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {methodsInUse.map((m) => {
                    const active = method === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        onPress={() => setMethod(active ? null : m)}
                        style={[styles.methodChip, active && styles.methodChipActive]}
                        accessibilityLabel={`Method ${m}`}
                        accessibilityState={{ selected: active }}
                      >
                        <Text style={[styles.methodText, active && styles.methodTextActive]}>{m}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </FadeInView>
            </>
          ) : null}
          <View style={{ flex: 1, minHeight: 8 }} />
          <FadeInView delay={330}>
          <TouchableOpacity style={styles.cta} onPress={handleSave}>
            <Text style={styles.ctaText}>{existing ? "Save changes" : `Save ${kind}`}</Text>
          </TouchableOpacity>
          </FadeInView>
          {existing ? (
            <TouchableOpacity style={styles.delete} onPress={confirmDelete} accessibilityLabel="Delete transaction">
              <Text style={styles.deleteText}>Delete transaction</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <SlideUpSheet visible={calOpen} onClose={() => setCalOpen(false)} closeLabel="Close calendar">
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>Pick a date</Text>
          <TouchableOpacity
            onPress={() => {
              setDay(atNoon(new Date()));
              setCalOpen(false);
            }}
            style={styles.todayChip}
            accessibilityLabel="Back to today"
          >
            <Text style={styles.todayChipText}>Today</Text>
          </TouchableOpacity>
        </View>
        <Calendar
          value={day}
          onChange={(d) => {
            setDay(d);
            setCalOpen(false);
          }}
        />
      </SlideUpSheet>
      <CategorySheet
        visible={catOpen}
        onClose={() => setCatOpen(false)}
        title="Category"
        options={[...categories, ...customCats]}
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
  toggle: { flexDirection: "row", backgroundColor: "#EDE6DB", borderRadius: 99, padding: 4, marginBottom: 10 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 99, alignItems: "center" },
  tExp: { backgroundColor: colors.ink },
  tInc: { backgroundColor: colors.success },
  toggleText: { fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink2 },
  amountCard: { backgroundColor: colors.dark, borderRadius: 22, padding: 12, alignItems: "center", marginBottom: 10 },
  amountLabel: { color: "#B8AEA4", fontSize: 11, fontWeight: "700", fontFamily: fonts.bodyBold, letterSpacing: 1 },
  cur: { color: "#fff", fontSize: 24, fontWeight: "800", fontFamily: fonts.bodyXB },
  amountInput: { color: "#fff", fontSize: 34, fontWeight: "800", fontFamily: fonts.bodyXB, minWidth: 120, textAlign: "center" },
  hint: { color: "#8A8178", fontSize: 12, fontFamily: fonts.body, marginTop: 2 },
  quick: { backgroundColor: "rgba(255,255,255,0.12)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99 },
  quickText: { color: "#fff", fontWeight: "700", fontFamily: fonts.bodyBold },
  label: { fontSize: 14, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink, marginTop: 10, marginBottom: 6 },
  scanBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: colors.border, backgroundColor: "#fff", borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8, marginTop: 10, marginBottom: 6 },
  scanText: { color: colors.accent, fontSize: 13, fontWeight: "700", fontFamily: fonts.bodyBold },
  methodChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border },
  methodChipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  methodText: { fontWeight: "600", fontFamily: fonts.bodyMedium, color: colors.ink2, fontSize: 13 },
  methodTextActive: { color: "#fff" },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 12, fontSize: 15 , fontFamily: fonts.body},
  pairRow: { flexDirection: "row", gap: 8 },
  catButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 10,
    flex: 1,
  },
  catText: { fontSize: 14, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink },
  catSub: { fontSize: 11, fontFamily: fonts.body, color: colors.muted, marginTop: 2 },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 10,
    flex: 1,
  },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: "800", fontFamily: fonts.bodyXB, color: colors.ink },
  dateText: { fontSize: 13, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink },
  dateSub: { fontSize: 10, fontFamily: fonts.body, color: colors.muted, marginTop: 2 },
  todayChip: { backgroundColor: colors.accentSoft, borderRadius: 99, paddingHorizontal: 16, paddingVertical: 10 },
  todayChipText: { color: colors.accentInk, fontWeight: "700", fontFamily: fonts.bodyBold, fontSize: 13 },
  cta: { backgroundColor: colors.accent, borderRadius: 18, paddingVertical: 15, alignItems: "center", marginTop: 12 },
  ctaText: { color: "#fff", fontSize: 17, fontWeight: "800", fontFamily: fonts.bodyXB },
  delete: { alignItems: "center", paddingVertical: 10 },
  deleteText: { color: colors.danger, fontSize: 14, fontWeight: "700", fontFamily: fonts.bodyBold },
});
