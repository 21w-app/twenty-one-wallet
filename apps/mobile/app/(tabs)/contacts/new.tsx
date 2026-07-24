import { useRouter } from "expo-router";

import { AddressBookContactForm } from "@/components/AddressBookContactForm";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useI18n } from "@/hooks/useI18n";

const NewContactScreen = () => {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <Screen
      header={
        <ScreenHeader
          onBackPress={() => {
            router.back();
          }}
          onRightActionPress={() => {
            router.push("/contacts/import");
          }}
          rightActionIcon="import"
          rightActionLabel={t("addressBook.importContacts")}
          title={t("addressBook.newContact")}
        />
      }
      scroll
    >
      <AddressBookContactForm
        onSaved={(contact) => {
          router.replace({
            pathname: "/contacts/detail",
            params: { contactId: contact.id },
          });
        }}
      />
    </Screen>
  );
};

export default NewContactScreen;
