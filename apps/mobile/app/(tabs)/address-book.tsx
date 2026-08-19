import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Text } from "@/components/Text";
import { useI18n } from "@/hooks/useI18n";
import type { AddressBookContact } from "@/lib/addressBook";
import { getAddressBookContacts } from "@/lib/addressBook";
import { spacing } from "@/lib/theme";
import { truncateMiddle } from "@/lib/truncateMiddle";

const AddressBookScreen = () => {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
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

  const handleSelectContact = (contact: AddressBookContact) => {
    router.replace({
      pathname: "/send",
      params: {
        contactAddress: contact.address,
      },
    });
  };

  return (
    <Screen
      header={
        <ScreenHeader
          onBackPress={() => {
            if (returnTo === "send") {
              router.replace("/send");
              return;
            }

            router.back();
          }}
          title={t("addressBook.title")}
        />
      }
      scroll
    >
      {contacts.length === 0 ? (
        <Text muted variant="body">
          {t("addressBook.empty")}
        </Text>
      ) : (
        <View style={styles.list}>
          {contacts.map((contact) => {
            return (
              <Pressable
                accessibilityRole="button"
                key={contact.id}
                onPress={() => {
                  handleSelectContact(contact);
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

export default AddressBookScreen;

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  contactCard: {
    gap: spacing.xs,
  },
});
