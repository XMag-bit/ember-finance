import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";

type IonName = React.ComponentProps<typeof Ionicons>["name"];

export function AppIcon({
  name,
  size = 22,
  color = colors.ink2,
  tileSize = 44,
  background = "#F6F1EA",
}: {
  name: IonName;
  size?: number;
  color?: string;
  tileSize?: number;
  background?: string;
}) {
  return (
    <View
      style={[
        styles.tile,
        { width: tileSize, height: tileSize, borderRadius: tileSize * 0.32, backgroundColor: background },
      ]}
    >
      <Ionicons name={name} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
});
