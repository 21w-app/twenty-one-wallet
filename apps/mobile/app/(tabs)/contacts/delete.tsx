import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Text } from "@/components/Text";
import { useI18n } from "@/hooks/useI18n";
import { useTheme } from "@/hooks/useTheme";
import type { AddressBookContact } from "@/lib/addressBook";
import {
  deleteAddressBookContact,
  getAddressBookContact,
} from "@/lib/addressBook";
import { spacing } from "@/lib/theme";

const DeleteContactScreen = () => {
  const router = useRouter();
  const { contactId } = useLocalSearchParams<{ contactId?: string }>();
  const { t } = useI18n();
  const { colors } = useTheme();
  const [contact, setContact] = useState<AddressBookContact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadContact = async () => {
      if (typeof contactId !== "string") {
        router.replace("/contacts");
        return;
      }

      const nextContact = await getAddressBookContact(contactId);

      if (nextContact == null) {
        router.replace("/contacts");
        return;
      }

      setContact(nextContact);
      setIsLoading(false);
    };

    void loadContact();
  }, [contactId, router]);

  const handleDelete = async () => {
    if (contact == null) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      await deleteAddressBookContact(contact.id);
      router.replace("/contacts");
    } catch {
      setError(t("addressBook.deleteContactError"));
      setIsDeleting(false);
    }
  };

  if (isLoading || contact == null) {
    return (
      <Screen
        header={
          <ScreenHeader title={t("addressBook.deleteContactConfirmTitle")} />
        }
      >
        <Text muted variant="body">
          {t("common.loading")}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <ScreenHeader title={t("addressBook.deleteContactConfirmTitle")} />
      }
      scroll
    >
      <Text style={styles.description} variant="body">
        {t("addressBook.deleteContactConfirmBody")}
      </Text>

      <Card style={styles.contactCard}>
        <View style={styles.field}>
          <Text muted variant="caption">
            {t("addressBook.nameLabel")}
          </Text>
          <Text variant="body">{contact.name}</Text>
        </View>
        <View style={styles.field}>
          <Text muted variant="caption">
            {t("addressBook.addressLabel")}
          </Text>
          <Text selectable variant="body">
            {contact.address}
          </Text>
        </View>
      </Card>

      <View style={styles.actions}>
        <Button
          disabled={isDeleting}
          label={
            isDeleting
              ? t("common.deleting")
              : t("addressBook.deleteContactConfirmAction")
          }
          onPress={() => {
            void handleDelete();
          }}
          style={[styles.dangerButton, { borderColor: colors.error }]}
          variant="secondary"
        />
        <Button
          disabled={isDeleting}
          label={t("common.cancel")}
          onPress={() => {
            router.back();
          }}
          variant="secondary"
        />
      </View>

      {error != null ? (
        <Text style={{ color: colors.error }} variant="caption">
          {error}
        </Text>
      ) : null}
    </Screen>
  );
};

export default DeleteContactScreen;

const styles = StyleSheet.create({
  description: {
    marginBottom: spacing.lg,
  },
  contactCard: {
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  field: {
    gap: spacing.xs,
  },
  actions: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  dangerButton: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
