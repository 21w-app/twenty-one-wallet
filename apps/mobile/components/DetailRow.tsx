import { StyleSheet, View } from "react-native";

import { CopyIconAction } from "@/components/CopyIconAction";
import { Text } from "@/components/Text";
import { spacing } from "@/lib/theme";

type DetailRowProps = {
  label: string;
  value: string;
  muted?: boolean;
  actionsValue?: string;
};

export const DetailRow = ({
  label,
  value,
  muted = false,
  actionsValue,
}: DetailRowProps) => {
  return (
    <View style={styles.row}>
      <Text muted variant="caption">
        {label}
      </Text>
      <View style={styles.valueRow}>
        <Text muted={muted} variant="body">
          {value}
        </Text>
        {actionsValue != null ? <CopyIconAction value={actionsValue} /> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  valueRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
});
