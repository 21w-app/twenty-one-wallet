import { type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { Text } from "@/components/Text";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/lib/theme";

type SelectFieldProps = {
  label: string;
  value: string;
  valuePrefix?: ReactNode;
  onPress: () => void;
  accessibilityHint?: string;
  expanded?: boolean;
};

const SelectFieldChevron = () => {
  const { colors } = useTheme();

  return (
    <Svg fill="none" height={20} viewBox="0 0 24 24" width={20}>
      <Path
        d="m6 9 6 6 6-6"
        stroke={colors.textMuted}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.2}
      />
    </Svg>
  );
};

export const SelectField = ({
  label,
  value,
  valuePrefix,
  onPress,
  accessibilityHint,
  expanded = false,
}: SelectFieldProps) => {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={`${label}, ${value}`}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      onPress={onPress}
      style={({ pressed }) => {
        return [
          styles.trigger,
          { backgroundColor: colors.surfaceElevated },
          pressed ? styles.triggerPressed : null,
        ];
      }}
    >
      <Text muted style={styles.label} variant="body">
        {label}
      </Text>
      <View style={styles.valueRow}>
        {valuePrefix != null ? (
          <View style={styles.valuePrefix}>{valuePrefix}</View>
        ) : null}
        <Text numberOfLines={1} style={styles.value} variant="body">
          {value}
        </Text>
        <SelectFieldChevron />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  trigger: {
    alignItems: "center",
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  triggerPressed: {
    opacity: 0.85,
  },
  label: {
    flexShrink: 0,
    marginRight: spacing.md,
  },
  valueRow: {
    alignItems: "center",
    flexDirection: "row",
    flexShrink: 1,
    gap: spacing.xs,
    justifyContent: "flex-end",
  },
  valuePrefix: {
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    flexShrink: 1,
    textAlign: "right",
  },
});
