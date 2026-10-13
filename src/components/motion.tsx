import React, { useEffect, useRef, useState } from "react";
import { Animated, AccessibilityInfo, Easing, TouchableOpacity, View, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { colors } from "../theme";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduced).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
    return () => sub.remove();
  }, []);
  return reduced;
}

// useIsFocused throws outside a NavigationContainer (e.g. onboarding) -
// fall back to "always focused" so entrances still play on mount.
function useSafeIsFocused(): boolean {
  try {
    return useIsFocused();
  } catch {
    return true;
  }
}

// Bumps every time the screen gains focus (starts at 1 on mount).
// Feed it into animation effect deps to replay entrances on every visit,
// not just the first mount.
export function useFocusCount(): number {
  const focused = useSafeIsFocused();
  const [count, setCount] = useState(1);
  const was = useRef(focused);
  useEffect(() => {
    if (focused && !was.current) setCount((c) => c + 1);
    was.current = focused;
  }, [focused]);
  return count;
}

export function FadeInView({
  children,
  delay = 0,
  distance = 12,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(distance)).current;
  const reduced = useReducedMotion();
  const focusCount = useFocusCount();

  useEffect(() => {
    if (reduced) {
      opacity.setValue(1);
      translate.setValue(0);
      return;
    }
    opacity.setValue(0);
    translate.setValue(distance);
    const anim = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 460, delay, useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(delay),
        Animated.spring(translate, {
          toValue: 0,
          stiffness: 130,
          damping: 21,
          mass: 1,
          useNativeDriver: true,
        }),
      ]),
    ]);
    anim.start();
    return () => anim.stop();
  }, [focusCount, reduced, delay, distance]);

  if (reduced) return <Animated.View style={style}>{children}</Animated.View>;
  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY: translate }] }]}>
      {children}
    </Animated.View>
  );
}

const SHEET_TRAVEL = 340;

export function SlideUpSheet({
  visible,
  onClose,
  children,
  closeLabel = "Close",
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  closeLabel?: string;
}) {
  const [render, setRender] = useState(visible);
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(SHEET_TRAVEL)).current;
  const reduced = useReducedMotion();

  useEffect(() => {
    if (visible) {
      setRender(true);
      return;
    }
    if (!render) return;
    if (reduced) {
      setRender(false);
      return;
    }
    const anim = Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translate, {
        toValue: SHEET_TRAVEL,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    anim.start(() => setRender(false));
    return () => anim.stop();
  }, [visible, reduced]);

  useEffect(() => {
    if (!render || !visible) return;
    if (reduced) {
      opacity.setValue(1);
      translate.setValue(0);
      return;
    }
    opacity.setValue(0);
    translate.setValue(SHEET_TRAVEL);
    const anim = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(translate, {
        toValue: 0,
        stiffness: 150,
        damping: 24,
        mass: 1,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [render, visible, reduced]);

  if (!render) return null;
  return (
    <View style={sheetStyles.overlay}>
      <Animated.View style={[sheetStyles.backdrop, { opacity }]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} accessibilityLabel={closeLabel} />
      </Animated.View>
      <Animated.View style={[sheetStyles.sheet, { transform: [{ translateY: translate }] }]}>
        <View style={sheetStyles.grabber} />
        {children}
      </Animated.View>
    </View>
  );
}

const sheetStyles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(28,25,23,0.45)" },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 34,
    borderWidth: 1,
    borderColor: colors.border,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: "center",
    marginBottom: 14,
  },
});
