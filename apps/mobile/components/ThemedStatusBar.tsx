import { StatusBar } from "expo-status-bar";

import { useTheme } from "@/hooks/useTheme";

export const ThemedStatusBar = () => {
  const { colors } = useTheme();

  return <StatusBar style={colors.statusBarStyle} />;
};
