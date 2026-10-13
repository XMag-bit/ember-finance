import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from "react-native";
import { colors, layout, radius, type as t, fonts } from "../theme";
import { useReducedMotion } from "./motion";

export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg, // 22 - golden run
    padding: layout.card, // 22 - screen gutter : card = 1:1, card : list = φ:1
  },
});

export function SectionTitle({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
      <Text style={{ fontSize: t.subtitle, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.ink, letterSpacing: -0.2 }}>{title}</Text>
      {action ? (
        onPress ? (
          <TouchableOpacity onPress={onPress} hitSlop={8} accessibilityLabel={`${title} - ${action}`}>
            <Text style={{ fontSize: t.caption, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.accent }}>{action}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={{ fontSize: t.caption, fontWeight: "700", fontFamily: fonts.bodyBold, color: colors.accent }}>{action}</Text>
        )
      ) : null}
    </View>
  );
}

export function ProgressBar({ value, track = "#EDE6DB", fill = colors.accent }: { value: number; track?: string; fill?: string }) {
  const v = Math.min(1, Math.max(0, value));
  const anim = useRef(new Animated.Value(v)).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) {
      anim.setValue(v);
      return;
    }
    const a = Animated.timing(anim, {
      toValue: v,
      duration: 550,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    a.start();
    return () => a.stop();
  }, [v, reduced]);
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  return (
    <View style={{ height: layout.track, borderRadius: 8, backgroundColor: track, overflow: "hidden" }}>
      <Animated.View style={{ height: layout.track, width, backgroundColor: fill, borderRadius: 8 }} />
    </View>
  );
}
