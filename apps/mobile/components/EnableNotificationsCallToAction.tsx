import { useState } from "react";
import { Linking, StyleSheet } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Text } from "@/components/Text";
import { useI18n } from "@/hooks/useI18n";
import { useWallet } from "@/hooks/useWallet";
import { enableWalletPushNotifications } from "@/lib/pushRegistration";
import { colors, spacing } from "@/lib/theme";
import { setPushNotificationsEnabled } from "@/lib/pushNotificationsPreference";

type EnableNotificationsCallToActionProps = {
  onEnabled: () => void;
};

export const EnableNotificationsCallToAction = ({
  onEnabled,
}: EnableNotificationsCallToActionProps) => {
  const { t } = useI18n();
  const { getWallet } = useWallet();
  const [isEnabling, setIsEnabling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const handleEnable = async () => {
    setError(null);
    setPermissionDenied(false);
    setIsEnabling(true);

    try {
      const result = await enableWalletPushNotifications({
        wallet: getWallet(),
      });

      if (!result.ok) {
        await setPushNotificationsEnabled(false);

        if (result.reason === "denied") {
          setPermissionDenied(true);
          setError(t("settings.pushDeniedError"));
        } else if (result.reason === "unavailable") {
          setError(t("settings.pushUnavailable"));
        } else {
          setError(t("settings.pushEnableError"));
        }

        return;
      }

      if (!result.backendSynced) {
        setError(t("settings.pushSyncPending"));
      }

      onEnabled();
    } finally {
      setIsEnabling(false);
    }
  };

  return (
    <Card style={styles.card}>
      <Text variant="title">{t("home.notificationsTitle")}</Text>
      <Text muted variant="body">
        {t("home.notificationsBody")}
      </Text>
      {error != null ? (
        <Text style={styles.error} variant="caption">
          {error}
        </Text>
      ) : null}
      <Button
        disabled={isEnabling}
        label={
          isEnabling
            ? t("home.notificationsEnabling")
            : t("home.notificationsCta")
        }
        onPress={() => {
          void handleEnable();
        }}
        style={styles.button}
      />
      {permissionDenied ? (
        <Button
          label={t("settings.openIosSettings")}
          onPress={() => {
            void Linking.openSettings();
          }}
          style={styles.settingsButton}
          variant="secondary"
        />
      ) : null}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
  },
  button: {
    marginTop: spacing.sm,
  },
  settingsButton: {
    marginTop: spacing.sm,
  },
  error: {
    color: colors.error,
    marginTop: spacing.sm,
  },
});
