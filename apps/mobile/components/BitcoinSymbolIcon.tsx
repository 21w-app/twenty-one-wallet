import { StyleSheet, Text } from "react-native";

type BitcoinSymbolIconProps = {
  color: string;
  size: number;
};

export const BitcoinSymbolIcon = ({ color, size }: BitcoinSymbolIconProps) => {
  return <Text style={[styles.label, { color, fontSize: size }]}>₿</Text>;
};

const styles = StyleSheet.create({
  label: {
    fontWeight: "700",
    includeFontPadding: false,
    lineHeight: undefined,
  },
});
