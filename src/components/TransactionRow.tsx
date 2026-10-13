import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors, fonts } from "../theme";
import { formatTxDate, signedMoney, type Tx } from "../data/mock";
import { AppIcon } from "./AppIcon";
import { useProfile } from "../store/UserContext";

export function TransactionRow({
  tx,
  onLongPress,
  onPress,
}: {
  tx: Tx;
  onLongPress?: () => void;
  onPress?: () => void;
}) {
  const expense = tx.amount < 0;
  const { profile } = useProfile();
  const sub = tx.paymentMethod ? `${tx.category} · ${tx.paymentMethod} · ` : `${tx.category} · `;
  const row = (
    <View style={styles.row}>
      <AppIcon name={tx.icon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>{tx.title}</Text>
        <Text style={styles.sub}>{sub}{formatTxDate(tx.ts)}</Text>
      </View>
      <Text style={[styles.amt, { color: expense ? colors.ink : colors.success }]}>
        {signedMoney(tx.amount, profile.currency)}
      </Text>
    </View>
  );
  if (!onLongPress && !onPress) return row;
  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} delayLongPress={450} activeOpacity={0.7}>
      {row}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1ECE5",
  },
  title: { fontSize: 15, fontWeight: "600", fontFamily: fonts.bodyMedium, color: colors.ink },
  sub: { fontSize: 12.5, fontFamily: fonts.body, color: colors.muted, marginTop: 2 },
  amt: { fontSize: 15, fontWeight: "700", fontFamily: fonts.bodyBold, fontVariant: ["tabular-nums"] as any },
});
