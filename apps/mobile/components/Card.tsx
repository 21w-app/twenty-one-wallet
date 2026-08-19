import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { radii, spacing } from "@/lib/theme";

type CardProps = {
  children: ReactNode;
  style?: ViewStyle;
};

export const Card = ({ children, style }: CardProps) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceElevated,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    gap: spacing.sm,
    padding: spacing.md,
  },
});
