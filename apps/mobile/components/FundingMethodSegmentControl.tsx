import { Pressable, StyleSheet, View } from "react-native";

import { Text } from "@/components/Text";
import { useTheme } from "@/hooks/useTheme";
import { spacing } from "@/lib/theme";

export type FundingMethod = "lightning" | "bitcoin";

type FundingMethodSegmentControlProps = {
  value: FundingMethod;
  onChange: (value: FundingMethod) => void;
  labels: Record<FundingMethod, string>;
};

export const FundingMethodSegmentControl = ({
  value,
  onChange,
  labels,
}: FundingMethodSegmentControlProps) => {
  const { colors } = useTheme();
  const methods: FundingMethod[] = ["lightning", "bitcoin"];

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surfaceElevated }]}
    >
      {methods.map((method) => {
        const isActive = method === value;

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            key={method}
            onPress={() => {
              onChange(method);
            }}
            style={[
              styles.segment,
              isActive ? { backgroundColor: colors.background } : undefined,
            ]}
          >
            <Text
              style={isActive ? { color: colors.text } : undefined}
              variant="caption"
            >
              {labels[method]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.md,
    padding: spacing.xs,
  },
  segment: {
    alignItems: "center",
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
});
