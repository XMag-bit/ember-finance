import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radius, fonts } from "../theme";
import { Card } from "../components/ui";
import { FadeInView } from "../components/motion";
import { useProfile, initialOf } from "../store/UserContext";

const FEATURES = [
  { icon: "receipt-outline", title: "Track every peso", sub: "Income and expenses in seconds" },
  { icon: "pie-chart-outline", title: "Stay in budget", sub: "Live spend vs limits" },
  { icon: "trophy-outline", title: "Hit your goals", sub: "Save with clear targets" },
] as const;

export function OnboardingScreen() {
  const { completeOnboarding } = useProfile();
  const [step, setStep] = useState<"welcome" | "name">("welcome");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  function handleStart() {
    if (name.trim().length < 2) {
      setError("Enter at least 2 characters.");
      return;
    }
    completeOnboarding(name);
  }

  if (step === "welcome") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: spacing.lg }}
          showsVerticalScrollIndicator={false}
        >
          <FadeInView>
            <View style={styles.logo}>
              <Ionicons name="flame-outline" size={36} color="#fff" />
            </View>
          </FadeInView>
          <FadeInView delay={70}>
            <Text style={styles.brand}>EMBER FINANCE</Text>
            <Text style={styles.title}>Money, minus the stress.</Text>
            <Text style={styles.sub}>A calm, offline-first tracker for spending, budgets, and goals.</Text>
          </FadeInView>

          <FadeInView delay={150}>
          <Card style={styles.featureCard}>
            {FEATURES.map((f, i) => (
              <View key={f.title} style={[styles.feature, i < FEATURES.length - 1 && styles.featureDivider]}>
                <View style={styles.featureIcon}>
                  <Ionicons name={f.icon as React.ComponentProps<typeof Ionicons>["name"]} size={22} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{f.title}</Text>
                  <Text style={styles.featureSub}>{f.sub}</Text>
                </View>
              </View>
            ))}
          </Card>
          </FadeInView>

          <FadeInView delay={230}>
          <TouchableOpacity
            style={styles.cta}
            onPress={() => setStep("name")}
            activeOpacity={0.85}
            accessibilityLabel="Get started"
          >
            <Text style={styles.ctaText}>Get started</Text>
            <View style={styles.ctaArrow}>
              <Ionicons name="arrow-forward-outline" size={18} color={colors.accent} />
            </View>
          </TouchableOpacity>
          </FadeInView>
          <FadeInView delay={300}>
            <View style={styles.dots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
            </View>
            <Text style={styles.fine}>Free forever · Works offline · No account needed</Text>
          </FadeInView>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: spacing.lg }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <FadeInView>
          <TouchableOpacity onPress={() => setStep("welcome")} style={styles.back} accessibilityLabel="Back to welcome" hitSlop={8}>
            <Ionicons name="chevron-back-outline" size={22} color={colors.ink} />
          </TouchableOpacity>
        </FadeInView>
        <FadeInView delay={60}>
          <View style={[styles.logo, styles.logoSm]}>
            <Ionicons name="flame-outline" size={30} color="#fff" />
          </View>
          <Text style={styles.title}>What should we call you?</Text>
          <Text style={styles.sub}>This is how the app greets you on Home.</Text>
        </FadeInView>

        <FadeInView delay={140}>
        <Card style={styles.nameCard}>
          <View style={styles.preview}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initialOf(name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewName} numberOfLines={1}>{name.trim() || "Your name"}</Text>
              <Text style={styles.previewSub}>Your personal space</Text>
            </View>
          </View>
          <Text style={styles.label}>Your name</Text>
          <TextInput
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (error) setError(undefined);
            }}
            placeholder="e.g. Maya Santos"
            autoCapitalize="words"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleStart}
            style={[styles.input, error ? styles.inputError : null]}
            placeholderTextColor={colors.faint}
            accessibilityLabel="Your name"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity
            style={[styles.cta, name.trim().length < 2 && styles.ctaDisabled]}
            onPress={handleStart}
            activeOpacity={0.85}
            accessibilityLabel="Start using Ember"
          >
            <Text style={styles.ctaText}>Start using Ember</Text>
            <View style={styles.ctaArrow}>
              <Ionicons name="arrow-forward-outline" size={18} color={colors.accent} />
            </View>
          </TouchableOpacity>
        </Card>
        </FadeInView>
        <FadeInView delay={220}>
          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
          </View>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  logoSm: { width: 60, height: 60, borderRadius: 19, marginTop: spacing.md },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  brand: { fontSize: 12, fontWeight: "800", fontFamily: fonts.bodyXB, letterSpacing: 2.5, color: colors.accent },
  title: { fontSize: 32, fontWeight: "800", color: colors.ink, marginTop: 10, letterSpacing: -0.5, lineHeight: 38, fontFamily: fonts.displayXB },
  sub: { fontSize: 15, fontFamily: fonts.body, color: colors.muted, marginTop: 8, lineHeight: 23 },
  featureCard: { marginTop: spacing.lg, paddingVertical: 8 },
  feature: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, paddingHorizontal: 8 },
  featureDivider: { borderBottomWidth: 1, borderBottomColor: "#F1ECE5" },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: { fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink, fontSize: 15 },
  featureSub: { color: colors.muted, fontSize: 13, fontFamily: fonts.body, marginTop: 3 },
  nameCard: { marginTop: spacing.lg },
  preview: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: spacing.md },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "800", fontFamily: fonts.bodyXB },
  previewName: { fontSize: 17, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink },
  previewSub: { fontSize: 13, fontFamily: fonts.body, color: colors.muted, marginTop: 2 },
  label: { fontSize: 14, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink, marginBottom: 8 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    minHeight: 58,
    fontSize: 17,
    fontFamily: fonts.body,
    color: colors.ink,
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13, marginTop: 8, fontWeight: "600", fontFamily: fonts.bodyMedium },
  cta: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
    paddingLeft: 24,
    paddingRight: 12,
  },
  ctaText: { color: "#fff", fontSize: 17, fontWeight: "800", fontFamily: fonts.bodyXB, flex: 1, textAlign: "center" },
  ctaArrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  fine: { color: colors.faint, fontSize: 12.5, fontFamily: fonts.body, textAlign: "center", marginTop: spacing.md },
  dots: { flexDirection: "row", gap: 6, justifyContent: "center", marginTop: spacing.md },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.borderStrong },
  dotActive: { width: 20, backgroundColor: colors.accent },
  ctaDisabled: { opacity: 0.55 },
});
