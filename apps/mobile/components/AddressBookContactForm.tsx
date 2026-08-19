import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { AddressInputWithScan } from "@/components/AddressInputWithScan";
import { Button } from "@/components/Button";
import { FormErrorText } from "@/components/FormErrorText";
import { useI18n } from "@/hooks/useI18n";
import { useTheme } from "@/hooks/useTheme";
import {
  saveAddressBookContact,
  type AddressBookContact,
} from "@/lib/addressBook";
import { detectInvoiceType } from "@/lib/detectInvoiceType";
import { spacing } from "@/lib/theme";

type AddressBookContactFormProps = {
  contact?: AddressBookContact;
  onSaved: (contact: AddressBookContact) => void;
};

export const AddressBookContactForm = ({
  contact,
  onSaved,
}: AddressBookContactFormProps) => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const [name, setName] = useState(contact?.name ?? "");
  const [address, setAddress] = useState(contact?.address ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedAddress = address.trim();

    if (trimmedName.length === 0) {
      setError(t("addressBook.nameRequired"));
      return;
    }

    if (detectInvoiceType(trimmedAddress) !== "ark") {
      setError(t("addressBook.invalidAddress"));
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const savedContact = await saveAddressBookContact({
        id: contact?.id,
        name: trimmedName,
        address: trimmedAddress,
      });
      onSaved(savedContact);
    } catch {
      setError(t("addressBook.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        autoCapitalize="words"
        autoCorrect
        onChangeText={setName}
        placeholder={t("addressBook.contactNamePlaceholder")}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.nameInput,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
        value={name}
      />
      <AddressInputWithScan
        onChangeText={setAddress}
        placeholder={t("addressBook.pasteAddress")}
        value={address}
      />
      {error != null ? <FormErrorText message={error} /> : null}
      <Button
        disabled={isSaving}
        label={isSaving ? t("common.saving") : t("addressBook.saveContact")}
        onPress={() => {
          void handleSave();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  nameInput: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 16,
    height: 52,
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
    paddingVertical: 0,
    textAlignVertical: "center",
  },
});
