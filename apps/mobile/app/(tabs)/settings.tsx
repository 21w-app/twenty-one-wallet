import Constants from "expo-constants";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";

import { ThemedSwitch } from "@/components/ThemedSwitch";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LanguageSelector } from "@/components/LanguageSelector";
import { LogoHeader } from "@/components/LogoHeader";
import { Screen } from "@/components/Screen";
import { Text } from "@/components/Text";
import { useI18n } from "@/hooks/useI18n";
import { useTheme } from "@/hooks/useTheme";
import { useWallet } from "@/hooks/useWallet";
import {
  isAuthOnOpenEnabled,
  isBiometricsOnOpenEnabled,
  setAuthOnOpenEnabled,
  setBiometricsOnOpenEnabled,
} from "@/lib/authOnOpenPreference";
import {
  getAddressBookContacts,
  type AddressBookContact,
} from "@/lib/addressBook";
import { describeSystemAuthFailure } from "@/lib/describeSystemAuthFailure";
import { exportAddressBookContacts } from "@/lib/exportAddressBookContacts";
import { getLastUpdateTimeLabel } from "@/lib/getLastUpdateTimeLabel";
import { getPushPermissionStatus } from "@/lib/getPushPermissionStatus";
import { getWalletNetworkInfo } from "@/lib/getWalletNetworkInfo";
import { hasWallet } from "@/lib/hasWallet";
import { isBiometricsAvailable } from "@/lib/isBiometricsAvailable";
import { isExpoGo } from "@/lib/isExpoGo";
import { isSystemAuthAvailable } from "@/lib/isSystemAuthAvailable";
import { promptBiometricsSetup } from "@/lib/promptBiometricsSetup";
import {
  disableWalletPushNotifications,
  enableWalletPushNotifications,
} from "@/lib/pushRegistration";
import {
  isPushNotificationsEnabled,
  setPushNotificationsEnabled,
} from "@/lib/pushNotificationsPreference";
import { requireSystemAuth } from "@/lib/requireSystemAuth";
import { spacing } from "@/lib/theme";
import {
  APP_HEADER_HEIGHT,
  APP_HEADER_MARGIN_BOTTOM,
  APP_HEADER_MARGIN_TOP,
} from "@/lib/screenHeaderLayout";

const SettingsScreen = () => {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { getWallet } = useWallet();
  const [authOnOpen, setAuthOnOpen] = useState(false);
  const [biometricsOnOpen, setBiometricsOnOpen] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [backupCompleted, setBackupCompleted] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabledState] =
    useState(false);
  const [pushPermissionBlocked, setPushPermissionBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<AddressBookContact[]>([]);
  const [isExportingContacts, setIsExportingContacts] = useState(false);

  const refreshBiometricsState = useCallback(async () => {
    const [biometricsEnabled, biometricsReady] = await Promise.all([
      isBiometricsOnOpenEnabled(),
      isBiometricsAvailable(),
    ]);

    setBiometricsAvailable(biometricsReady);
    setBiometricsOnOpen(biometricsEnabled && biometricsReady);

    if (biometricsEnabled && !biometricsReady) {
      await setBiometricsOnOpenEnabled(false);
    }
  }, []);

  useEffect(() => {
    const loadPreferences = async () => {
      const [authEnabled, walletConfigured] = await Promise.all([
        isAuthOnOpenEnabled(),
        hasWallet(),
      ]);
      setAuthOnOpen(authEnabled);
      await refreshBiometricsState();
      setBackupCompleted(walletConfigured);

      const pushPreference = await isPushNotificationsEnabled();

      if (!pushPreference) {
        setPushNotificationsEnabledState(false);
        setPushPermissionBlocked(false);
        return;
      }

      const pushStatus = await getPushPermissionStatus();

      if (pushStatus.granted) {
        setPushNotificationsEnabledState(true);
        setPushPermissionBlocked(false);
        return;
      }

      await setPushNotificationsEnabled(false);
      setPushNotificationsEnabledState(false);
      setPushPermissionBlocked(pushStatus.reason === "denied");
    };

    void loadPreferences();
  }, [refreshBiometricsState]);

  useFocusEffect(
    useCallback(() => {
      const loadContacts = async () => {
        const savedContacts = await getAddressBookContacts();
        setContacts(savedContacts);
      };

      void loadContacts();
      void refreshBiometricsState();
    }, [refreshBiometricsState]),
  );

  const handleExportContacts = async () => {
    setError(null);
    setIsExportingContacts(true);

    try {
      await exportAddressBookContacts(t("addressBook.exportDialogTitle"));
      const savedContacts = await getAddressBookContacts();
      setContacts(savedContacts);
    } catch {
      setError(t("addressBook.exportError"));
    } finally {
      setIsExportingContacts(false);
    }
  };

  const handleAuthToggle = async (enabled: boolean) => {
    setError(null);

    if (!enabled) {
      setAuthOnOpen(false);
      setBiometricsOnOpen(false);
      await setAuthOnOpenEnabled(false);
      await setBiometricsOnOpenEnabled(false);
      return;
    }

    const available = await isSystemAuthAvailable();

    if (!available) {
      setAuthOnOpen(false);
      await setAuthOnOpenEnabled(false);
      setError(t("auth.errors.setupPasscode"));
      return;
    }

    setAuthOnOpen(true);
    await setAuthOnOpenEnabled(true);
  };

  const handleBiometricsToggle = async (enabled: boolean) => {
    setError(null);

    if (!enabled) {
      setBiometricsOnOpen(false);
      await setBiometricsOnOpenEnabled(false);
      return;
    }

    const ready = await isBiometricsAvailable();

    if (!ready) {
      setBiometricsOnOpen(false);
      await setBiometricsOnOpenEnabled(false);
      promptBiometricsSetup(t);
      return;
    }

    const auth = await requireSystemAuth({
      biometricsRequired: true,
      disableDeviceFallback: true,
      promptMessage: t("settings.biometricsUnlock"),
      cancelLabel: t("common.cancel"),
    });

    if (!auth.success) {
      setBiometricsOnOpen(false);
      await setBiometricsOnOpenEnabled(false);

      if (auth.reason !== "cancelled") {
        setError(describeSystemAuthFailure(auth, t));
      }

      return;
    }

    setBiometricsOnOpen(true);
    await setBiometricsOnOpenEnabled(true);
  };

  const handlePushNotificationsToggle = async (enabled: boolean) => {
    setError(null);
    setPushPermissionBlocked(false);

    if (!enabled) {
      setPushNotificationsEnabledState(false);
      await disableWalletPushNotifications({ wallet: getWallet() });
      return;
    }

    setPushNotificationsEnabledState(true);

    const result = await enableWalletPushNotifications({
      wallet: getWallet(),
    });

    if (!result.ok) {
      setPushNotificationsEnabledState(false);
      setPushPermissionBlocked(result.reason === "denied");
      await setPushNotificationsEnabled(false);

      if (result.reason === "denied") {
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
  };

  const handleOpenDeviceSettings = async () => {
    await Linking.openSettings();
  };

  const appVersion = Constants.expoConfig?.version ?? "1.0.1";
  const lastUpdateLabel = getLastUpdateTimeLabel();
  const networkInfo = getWalletNetworkInfo();

  return (
    <Screen
      header={
        <View style={styles.header}>
          <LogoHeader />
        </View>
      }
      scroll
    >
      <Text style={styles.sectionHeading} variant="label">
        {t("settings.general")}
      </Text>
      <LanguageSelector />

      <Text style={styles.sectionHeading} variant="label">
        {t("settings.notifications")}
      </Text>
      <Pressable
        style={[
          styles.toggleRow,
          styles.standaloneControl,
          { backgroundColor: colors.surfaceElevated },
          isExpoGo() ? styles.toggleDisabled : null,
        ]}
      >
        <View style={styles.toggleCopy}>
          <Text variant="body">{t("settings.walletNotifications")}</Text>
          {isExpoGo() ? (
            <Text muted variant="caption">
              {t("settings.pushExpoGo")}
            </Text>
          ) : pushPermissionBlocked ? (
            <Text muted variant="caption">
              {t("settings.pushDenied")}
            </Text>
          ) : (
            <Text muted variant="caption">
              {t("settings.pushHelper")}
            </Text>
          )}
        </View>
        <View style={styles.switchWrap}>
          <ThemedSwitch
            disabled={isExpoGo()}
            onValueChange={(value) => {
              void handlePushNotificationsToggle(value);
            }}
            value={pushNotificationsEnabled}
          />
        </View>
      </Pressable>
      {pushPermissionBlocked && !isExpoGo() ? (
        <Button
          label={t("settings.openIosSettings")}
          onPress={() => {
            void handleOpenDeviceSettings();
          }}
          style={[
            styles.securityButton,
            { backgroundColor: colors.surfaceElevated },
          ]}
          variant="secondary"
        />
      ) : null}

      <Text style={styles.sectionHeading} variant="label">
        {t("settings.security")}
      </Text>
      <Pressable
        style={[
          styles.toggleRow,
          styles.standaloneControl,
          { backgroundColor: colors.surfaceElevated },
        ]}
      >
        <View style={styles.toggleCopy}>
          <Text variant="body">{t("settings.authOnOpen")}</Text>
          {isExpoGo() ? (
            <Text muted variant="caption">
              {t("settings.authOnOpenExpoGo")}
            </Text>
          ) : null}
        </View>
        <View style={styles.switchWrap}>
          <ThemedSwitch
            onValueChange={(value) => {
              void handleAuthToggle(value);
            }}
            value={authOnOpen}
          />
        </View>
      </Pressable>
      <Pressable
        style={[
          styles.toggleRow,
          styles.standaloneControl,
          { backgroundColor: colors.surfaceElevated },
          !authOnOpen || isExpoGo() ? styles.toggleDisabled : null,
        ]}
      >
        <View style={styles.toggleCopy}>
          <Text variant="body">{t("settings.biometricsUnlock")}</Text>
          {isExpoGo() ? (
            <Text muted variant="caption">
              {t("settings.biometricsExpoGo")}
            </Text>
          ) : !authOnOpen ? (
            <Text muted variant="caption">
              {t("settings.authOnOpenFirst")}
            </Text>
          ) : biometricsAvailable ? (
            <Text muted variant="caption">
              {t("settings.biometricsPreferredHint")}
            </Text>
          ) : null}
        </View>
        <View style={styles.switchWrap}>
          <ThemedSwitch
            disabled={!authOnOpen || isExpoGo()}
            onValueChange={(value) => {
              void handleBiometricsToggle(value);
            }}
            value={biometricsOnOpen}
          />
        </View>
      </Pressable>
      <Button
        label={t("settings.revealRecoveryPhrase")}
        onPress={() => {
          router.push("../recovery-phrase");
        }}
        style={[
          styles.securityButton,
          { backgroundColor: colors.surfaceElevated },
        ]}
        variant="secondary"
      />
      <Text style={styles.sectionHeading} variant="label">
        {t("settings.wallet")}
      </Text>
      <Card style={styles.section}>
        <View style={styles.infoField}>
          <Text muted variant="caption">
            {t("settings.backupCompleted")}
          </Text>
          <Text variant="body">
            {backupCompleted ? t("common.yes") : t("common.no")}
          </Text>
        </View>
        <View style={styles.infoField}>
          <Text muted variant="caption">
            {t("settings.appVersion")}
          </Text>
          <Text variant="body">{appVersion}</Text>
        </View>
        {lastUpdateLabel != null ? (
          <View style={styles.infoField}>
            <Text muted variant="caption">
              {t("settings.lastUpdate")}
            </Text>
            <Text variant="body">{lastUpdateLabel}</Text>
          </View>
        ) : null}
        <View style={styles.infoField}>
          <Text muted variant="caption">
            {t("settings.network")}
          </Text>
          <Text variant="body">{t("network.bitcoinMainnet")}</Text>
        </View>
        <View style={styles.infoField}>
          <Text muted variant="caption">
            {t("settings.arkServer")}
          </Text>
          <Text selectable variant="body">
            {networkInfo.arkServerUrl}
          </Text>
        </View>
        <View style={styles.infoField}>
          <Text muted variant="caption">
            {t("settings.onChainIndexer")}
          </Text>
          <Text selectable variant="body">
            {networkInfo.esploraUrl}
          </Text>
        </View>
      </Card>

      {contacts.length > 0 ? (
        <Button
          disabled={isExportingContacts}
          label={
            isExportingContacts
              ? t("common.preparing")
              : t("addressBook.exportContacts")
          }
          onPress={() => {
            void handleExportContacts();
          }}
          style={[
            styles.securityButton,
            { backgroundColor: colors.surfaceElevated },
          ]}
          variant="secondary"
        />
      ) : null}

      <Text style={styles.sectionHeading} variant="label">
        {t("settings.dangerZone")}
      </Text>
      <Button
        label={t("settings.deleteWallet")}
        onPress={() => {
          router.push("../delete-wallet");
        }}
        style={[
          styles.securityButton,
          styles.dangerButton,
          { backgroundColor: colors.surfaceElevated },
        ]}
        variant="secondary"
      />

      {error != null ? (
        <Text style={{ color: colors.error }} variant="caption">
          {error}
        </Text>
      ) : null}
    </Screen>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  header: {
    height: APP_HEADER_HEIGHT,
    justifyContent: "center",
    marginBottom: APP_HEADER_MARGIN_BOTTOM,
    marginTop: APP_HEADER_MARGIN_TOP,
  },
  sectionHeading: {
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  section: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  infoField: {
    gap: spacing.xs,
  },
  dangerButton: {
    borderColor: "#FF453A",
    borderWidth: StyleSheet.hairlineWidth,
  },
  securityButton: {
    marginBottom: spacing.md,
  },
  standaloneControl: {
    borderRadius: 14,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: 52,
  },
  toggleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  toggleCopy: {
    flex: 1,
    gap: spacing.xs,
    justifyContent: "center",
    marginRight: spacing.md,
  },
  toggleDisabled: {
    opacity: 0.55,
  },
  switchWrap: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
  },
});
