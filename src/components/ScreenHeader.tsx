import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "../theme";

// Shared page header - guarantees identical top rhythm on every screen.
// Home's profile header uses the same HEADER_TOP so titles never sit higher.
export const HEADER_TOP = 10;

export function ScreenHeader({ title, sub, onBack }: { title: string; sub: string; onBack?: () => void }) {
  return (
    <View style={styles.wrap}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.back} accessibilityLabel="Go back" hitSlop={8}>
          <Ionicons name="chevron-back-outline" size={22} color={colors.ink} />
        </TouchableOpacity>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: HEADER_TOP, marginBottom: 14 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  title: { fontSize: 28, fontWeight: "800", color: colors.ink, letterSpacing: -0.5, fontFamily: fonts.displayXB },
  sub: { color: colors.muted, marginTop: 2 },
});
