import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Text } from "@/components/Text";
import { useI18n } from "@/hooks/useI18n";
import type { AddressBookContact } from "@/lib/addressBook";
import { getAddressBookContacts } from "@/lib/addressBook";
import { spacing } from "@/lib/theme";
import { truncateMiddle } from "@/lib/truncateMiddle";

const ContactsScreen = () => {
  const router = useRouter();
  const { t } = useI18n();
  const [contacts, setContacts] = useState<AddressBookContact[]>([]);

  useFocusEffect(
    useCallback(() => {
      const loadContacts = async () => {
        const nextContacts = await getAddressBookContacts();
        setContacts(nextContacts);
      };

      void loadContacts();
    }, []),
  );

  const openNewContact = () => {
    router.push("/contacts/new");
  };

  const openContact = (contact: AddressBookContact) => {
    router.push({
      pathname: "/contacts/detail",
      params: { contactId: contact.id },
    });
  };

  return (
    <Screen
      header={
        <ScreenHeader
          onRightActionPress={openNewContact}
          rightActionIcon="add"
          rightActionLabel={t("addressBook.addContact")}
          showBack={false}
          title={t("addressBook.title")}
        />
      }
      scroll
    >
      {contacts.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text variant="title">{t("addressBook.emptyTitle")}</Text>
          <Text muted variant="body">
            {t("addressBook.emptyBody")}
          </Text>
          <Button
            label={t("addressBook.addContact")}
            onPress={openNewContact}
          />
        </Card>
      ) : (
        <View style={styles.list}>
          {contacts.map((contact) => {
            return (
              <Pressable
                accessibilityRole="button"
                key={contact.id}
                onPress={() => {
                  openContact(contact);
                }}
              >
                <Card style={styles.contactCard}>
                  <Text variant="label">{contact.name}</Text>
                  <Text muted variant="caption">
                    {truncateMiddle(contact.address, 14, 12)}
                  </Text>
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
};

export default ContactsScreen;

const styles = StyleSheet.create({
  emptyCard: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  contactCard: {
    gap: spacing.xs,
  },
});
