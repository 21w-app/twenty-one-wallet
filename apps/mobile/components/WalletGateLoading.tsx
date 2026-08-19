import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";

export const WalletGateLoading = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
});
