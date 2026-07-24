import { StyleSheet } from "react-native";

import { darkColors as colors } from "@/lib/themePalettes";
import { spacing } from "@/lib/theme";

export const formErrorTextStyles = StyleSheet.create({
  text: {
    color: colors.error,
    textShadowColor: colors.errorShade,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  block: {
    marginTop: spacing.sm,
  },
});
