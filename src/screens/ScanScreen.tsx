import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "../theme";
import { FadeInView } from "../components/motion";
import { parseQRIS } from "../data/qris";

const FRAME = 240;

export function ScanScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const scanned = useRef(false);
  const focused = useIsFocused();

  function handleScan({ data }: { data: string }) {
    if (scanned.current || !focused) return;
    scanned.current = true;
    setTorch(false);
    const parsed = parseQRIS(data);
    if (!parsed.valid) {
      Alert.alert("Not a payment code", parsed.reason, [
        {
          text: "Scan again",
          onPress: () => {
            scanned.current = false;
          },
        },
        { text: "Cancel", style: "cancel", onPress: () => navigation.goBack() },
      ]);
      return;
    }
    navigation.navigate("PayConfirm", {
      merchant: parsed.merchantName,
      city: parsed.city,
      amount: parsed.amount,
      dynamic: parsed.dynamic,
      currency: parsed.currency,
    });
  }

  if (!permission) {
    return (
      <View style={[styles.dark, styles.center]}>
        <Ionicons name="qr-code-outline" size={48} color="#8A8178" />
        <Text style={styles.darkText}>Preparing camera…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.dark, { flex: 1 }]}>
        <View style={{ flex: 1, padding: 22, justifyContent: "center" }}>
          <FadeInView>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} accessibilityLabel="Go back" hitSlop={8}>
              <Ionicons name="chevron-back-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </FadeInView>
          <FadeInView delay={60}>
            <Ionicons name="videocam-off-outline" size={48} color="#8A8178" />
            <Text style={styles.deniedTitle}>Camera is off</Text>
            <Text style={styles.darkText}>
              Ember needs camera access to scan QR payment codes. Nothing is recorded.
            </Text>
          </FadeInView>
          <FadeInView delay={140}>
            <TouchableOpacity style={styles.allow} onPress={requestPermission} accessibilityLabel="Allow camera">
              <Text style={styles.allowText}>Allow camera</Text>
            </TouchableOpacity>
          </FadeInView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.dark}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleScan}
      />
      <SafeAreaView style={{ flex: 1 }} pointerEvents="box-none">
        <View style={styles.topBar} pointerEvents="box-none">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} accessibilityLabel="Go back" hitSlop={8}>
            <Ionicons name="chevron-back-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTorch((t) => !t)}
            style={[styles.back, torch && styles.torchOn]}
            accessibilityLabel="Toggle torch"
            hitSlop={8}
          >
            <Ionicons name={torch ? "flashlight" : "flashlight-outline"} size={22} color={torch ? "#1C1917" : "#fff"} />
          </TouchableOpacity>
        </View>
        <View style={styles.frameWrap} pointerEvents="none">
          <View style={styles.frame}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>
          <Text style={styles.hint}>Point at a QRIS code</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  dark: { flex: 1, backgroundColor: "#000" },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  darkText: { color: "#B8AEA4", fontSize: 15, fontFamily: fonts.body, textAlign: "center", lineHeight: 22, marginTop: 12 },
  deniedTitle: { color: "#fff", fontSize: 26, fontWeight: "800", fontFamily: fonts.displayXB, marginTop: 16 },
  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  torchOn: { backgroundColor: "#fff" },
  allow: {
    backgroundColor: colors.accent,
    borderRadius: 18,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  allowText: { color: "#fff", fontSize: 17, fontWeight: "800", fontFamily: fonts.bodyXB },
  topBar: { flexDirection: "row", justifyContent: "space-between", padding: 16 },
  frameWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 80 },
  frame: { width: FRAME, height: FRAME, position: "relative" },
  corner: { position: "absolute", width: 44, height: 44, borderColor: "#fff" },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 18 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 18 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 18 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 18 },
  hint: { color: "#fff", fontSize: 14, fontFamily: fonts.bodyBold, fontWeight: "700", marginTop: 20 },
});
