import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { Share, StyleSheet, View } from "react-native";

import { Button } from "@/components/Button";
import { useI18n } from "@/hooks/useI18n";
import { spacing } from "@/lib/theme";

type CopyShareActionsProps = {
  value: string;
  disabled?: boolean;
};

export const CopyShareActions = ({
  value,
  disabled = false,
}: CopyShareActionsProps) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleShare = async () => {
    await Share.share({ message: value });
  };

  return (
    <View style={styles.row}>
      <Button
        disabled={disabled}
        label={copied ? t("common.copied") : t("common.copy")}
        onPress={() => {
          void handleCopy();
        }}
        style={styles.button}
        variant="secondary"
      />
      <Button
        disabled={disabled}
        label={t("common.share")}
        onPress={() => {
          void handleShare();
        }}
        style={styles.button}
        variant="secondary"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  button: {
    flex: 1,
  },
});
