import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AddressBookContactForm } from "@/components/AddressBookContactForm";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Text } from "@/components/Text";
import { useI18n } from "@/hooks/useI18n";
import { useTheme } from "@/hooks/useTheme";
import type { AddressBookContact } from "@/lib/addressBook";
import { getAddressBookContact } from "@/lib/addressBook";
import { spacing } from "@/lib/theme";

const ContactsDetailScreen = () => {
  const router = useRouter();
  const { contactId } = useLocalSearchParams<{ contactId?: string }>();
  const { t } = useI18n();
  const { colors } = useTheme();
  const [contact, setContact] = useState<AddressBookContact | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
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
    }, [contactId, router]),
  );

  const handleSendToContact = () => {
    if (contact == null) {
      return;
    }

    router.push({
      pathname: "/send",
      params: {
        contactAddress: contact.address,
      },
    });
  };

  const handleDeleteContact = () => {
    if (contact == null) {
      return;
    }

    router.push({
      pathname: "/contacts/delete",
      params: { contactId: contact.id },
    });
  };

  if (isLoading || contact == null) {
    return (
      <Screen>
        <ScreenHeader
          onBackPress={() => {
            router.back();
          }}
          title={t("addressBook.contactDetail")}
        />
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <ScreenHeader
          onBackPress={() => {
            router.back();
          }}
          onRightActionPress={() => {
            setIsEditing((value) => {
              return !value;
            });
          }}
          rightActionIcon="edit"
          rightActionLabel={t("addressBook.editContact")}
          title={isEditing ? t("addressBook.editContact") : contact.name}
        />
      }
      scroll
    >
      {isEditing ? (
        <AddressBookContactForm
          contact={contact}
          onSaved={(savedContact) => {
            setContact(savedContact);
            setIsEditing(false);
          }}
        />
      ) : (
        <Card style={styles.detailCard}>
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
      )}
      {!isEditing ? (
        <>
          <Button
            icon="send"
            label={t("send.title")}
            onPress={handleSendToContact}
            style={styles.sendButton}
            variant="send"
          />
          <Button
            label={t("addressBook.deleteContact")}
            onPress={handleDeleteContact}
            style={[
              styles.deleteButton,
              { backgroundColor: colors.surfaceElevated },
            ]}
            variant="secondary"
          />
        </>
      ) : null}
    </Screen>
  );
};

export default ContactsDetailScreen;

const styles = StyleSheet.create({
  detailCard: {
    gap: spacing.lg,
  },
  field: {
    gap: spacing.xs,
  },
  sendButton: {
    marginTop: spacing.md,
  },
  deleteButton: {
    borderColor: "#FF453A",
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.md,
  },
});
