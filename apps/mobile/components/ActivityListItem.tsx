import { Pressable, StyleSheet, View } from "react-native";

import { ActivityProtocolIcon } from "@/components/ActivityProtocolIcon";
import { Text } from "@/components/Text";
import { useI18n } from "@/hooks/useI18n";
import { useTheme } from "@/hooks/useTheme";
import type { ActivityItem } from "@/lib/activityTypes";
import { formatActivityTimestamp } from "@/lib/formatActivityTimestamp";
import { formatSats } from "@/lib/formatSats";
import { getActivityDirectionLabel } from "@/lib/getActivityDirectionLabel";
import { getActivityListStatusSuffix } from "@/lib/getActivityListStatusSuffix";
import { spacing } from "@/lib/theme";

type ActivityListItemProps = {
  item: ActivityItem;
  showDivider?: boolean;
  onPress?: () => void;
};

export const ActivityListItem = ({ item, onPress }: ActivityListItemProps) => {
  const { colors } = useTheme();
  const { t } = useI18n();
  const amountPrefix = item.direction === "received" ? "+" : "-";
  const protocolLabel =
    item.protocol === "ark"
      ? t("activity.protocolArk")
      : item.protocol === "onchain"
        ? t("activity.protocolOnchain")
        : t("activity.protocolLightning");
  const statusSuffix = getActivityListStatusSuffix(item, t);

  const content = (
    <>
      <ActivityProtocolIcon protocol={item.protocol} />

      <View style={styles.content}>
        <Text variant="label">{getActivityDirectionLabel(item, t)}</Text>
        <Text muted variant="caption">
          {protocolLabel}
          {statusSuffix}
        </Text>
      </View>

      <View style={styles.meta}>
        <Text style={{ color: colors.text }} variant="label">
          {t("activity.amountSats", {
            sign: amountPrefix,
            amount: formatSats(item.amountSats),
          })}
        </Text>
        <Text muted variant="caption">
          {formatActivityTimestamp(item.timestamp, t)}
        </Text>
      </View>
    </>
  );

  if (onPress == null) {
    return (
      <View
        style={[
          styles.row,
          {
            backgroundColor: colors.surfaceElevated,
          },
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => {
        return [
          styles.row,
          {
            backgroundColor: colors.surfaceElevated,
            opacity: pressed ? 0.85 : 1,
          },
        ];
      }}
    >
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  content: {
    flex: 1,
    gap: 2,
    justifyContent: "center",
  },
  meta: {
    alignItems: "flex-end",
    gap: 2,
    justifyContent: "center",
    minWidth: 104,
  },
});
