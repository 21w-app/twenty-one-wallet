import { Redirect, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Text } from "@/components/Text";
import { WalletGateLoading } from "@/components/WalletGateLoading";
import { useDeleteWallet } from "@/hooks/useDeleteWallet";
import { useI18n } from "@/hooks/useI18n";
import { useTheme } from "@/hooks/useTheme";
import { useWalletGate } from "@/hooks/useWalletGate";
import { getAddressBookContacts } from "@/lib/addressBook";
import { exportAddressBookContacts } from "@/lib/exportAddressBookContacts";
import { spacing } from "@/lib/theme";

const DeleteWalletScreen = () => {
  const router = useRouter();
  const { t } = useI18n();
  const { colors } = useTheme();
  const { isLoading, walletPresent } = useWalletGate();
  const { deleteWallet, error, isDeleting } = useDeleteWallet();
  const [hasContacts, setHasContacts] = useState(false);
  const [isExportingContacts, setIsExportingContacts] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    const loadContacts = async () => {
      const savedContacts = await getAddressBookContacts();
      setHasContacts(savedContacts.length > 0);
    };

    void loadContacts();
  }, []);

  const handleExportContacts = async () => {
    setExportError(null);
    setIsExportingContacts(true);

    try {
      await exportAddressBookContacts(t("addressBook.exportDialogTitle"));
    } catch {
      setExportError(t("addressBook.exportError"));
    } finally {
      setIsExportingContacts(false);
    }
  };

  if (isLoading) {
    return <WalletGateLoading />;
  }

  if (!walletPresent) {
    return <Redirect href="/welcome" />;
  }

  return (
    <Screen
      header={<ScreenHeader title={t("settings.deleteWalletConfirmTitle")} />}
      scroll
    >
      <Text style={styles.description} variant="body">
        {t("settings.deleteWalletConfirmBody")}
      </Text>

      {hasContacts ? (
        <Text muted style={styles.contactsHint} variant="body">
          {t("settings.deleteWalletExportContactsHint")}
        </Text>
      ) : null}

      <View style={styles.actions}>
        {hasContacts ? (
          <Button
            disabled={isDeleting || isExportingContacts}
            label={
              isExportingContacts
                ? t("common.preparing")
                : t("addressBook.exportContacts")
            }
            onPress={() => {
              void handleExportContacts();
            }}
            style={{ backgroundColor: colors.surfaceElevated }}
            variant="secondary"
          />
        ) : null}
        <Button
          disabled={isDeleting || isExportingContacts}
          label={
            isDeleting
              ? t("common.deleting")
              : t("settings.deleteWalletConfirmAction")
          }
          onPress={() => {
            void deleteWallet();
          }}
          style={[styles.dangerButton, { borderColor: colors.error }]}
          variant="secondary"
        />
        <Button
          disabled={isDeleting || isExportingContacts}
          label={t("common.cancel")}
          onPress={() => {
            router.back();
          }}
          variant="secondary"
        />
      </View>

      {exportError != null ? (
        <Text style={{ color: colors.error }} variant="caption">
          {exportError}
        </Text>
      ) : null}

      {error != null ? (
        <Text style={{ color: colors.error }} variant="caption">
          {error}
        </Text>
      ) : null}
    </Screen>
  );
};

export default DeleteWalletScreen;

const styles = StyleSheet.create({
  description: {
    marginBottom: spacing.lg,
  },
  contactsHint: {
    marginBottom: spacing.lg,
  },
  actions: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  dangerButton: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
