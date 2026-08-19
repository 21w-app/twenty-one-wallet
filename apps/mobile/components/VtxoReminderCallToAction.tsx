import { Pressable, StyleSheet } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Text } from "@/components/Text";
import { useI18n } from "@/hooks/useI18n";
import { vtxoReminderSnoozeDays } from "@/lib/vtxoReminderPreference";
import { spacing } from "@/lib/theme";

type VtxoReminderCallToActionProps = {
  onDismissPermanently: () => void | Promise<void>;
  onSnooze: () => void | Promise<void>;
};

export const VtxoReminderCallToAction = ({
  onDismissPermanently,
  onSnooze,
}: VtxoReminderCallToActionProps) => {
  const { t } = useI18n();

  return (
    <Card style={styles.card}>
      <Text variant="title">{t("vtxoReminder.title")}</Text>
      <Text muted variant="body">
        {t("vtxoReminder.body")}
      </Text>
      <Button
        label={t("vtxoReminder.remindInDays", {
          days: vtxoReminderSnoozeDays,
        })}
        onPress={() => {
          void onSnooze();
        }}
        style={styles.snoozeButton}
      />
      <Pressable
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => {
          void onDismissPermanently();
        }}
        style={styles.dismissLink}
      >
        <Text muted variant="label">
          {t("vtxoReminder.dontShowAgain")}
        </Text>
      </Pressable>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.sm,
  },
  snoozeButton: {
    marginTop: spacing.sm,
  },
  dismissLink: {
    alignItems: "center",
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
  },
});
