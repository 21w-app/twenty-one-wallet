import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { Button } from "@/components/Button";
import { FormErrorText } from "@/components/FormErrorText";
import { PaymentSuccessIcon } from "@/components/PaymentSuccessIcon";
import { Text } from "@/components/Text";
import { useFiatEquivalent } from "@/hooks/useFiatEquivalent";
import { useI18n } from "@/hooks/useI18n";
import { useTheme } from "@/hooks/useTheme";
import { saveAddressBookContact } from "@/lib/addressBook";
import { formatSats } from "@/lib/formatSats";
import { spacing } from "@/lib/theme";

type SendPaymentSuccessProps = {
  amountLabel?: string;
  amountSats: number;
  contactName?: string;
  destinationAddress?: string;
  onDone: () => void;
  onViewTransaction?: () => void;
};

export const SendPaymentSuccess = ({
  amountLabel,
  amountSats,
  contactName,
  destinationAddress,
  onDone,
  onViewTransaction,
}: SendPaymentSuccessProps) => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const fiatLabel = useFiatEquivalent(amountSats);
  const resolvedAmountLabel = amountLabel ?? t("send.amountSent");
  const [newContactName, setNewContactName] = useState("");
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const handleSaveContact = async () => {
    if (destinationAddress == null) {
      return;
    }

    if (newContactName.trim().length === 0) {
      setContactError(t("addressBook.nameRequired"));
      return;
    }

    setIsSavingContact(true);
    setContactError(null);

    try {
      await saveAddressBookContact({
        address: destinationAddress,
        name: newContactName,
      });
      setContactSaved(true);
      setShowContactForm(false);
    } catch {
      setContactError(t("addressBook.saveError"));
    } finally {
      setIsSavingContact(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <PaymentSuccessIcon />
        <Text muted style={styles.amountLabel} variant="caption">
          {resolvedAmountLabel}
        </Text>
        <Text style={styles.amount} variant="titleLarge">
          {t("home.balanceSats", { amount: formatSats(amountSats) })}
        </Text>
        {fiatLabel != null ? (
          <Text muted variant="body">
            {t("home.fiatApprox", { fiat: fiatLabel })}
          </Text>
        ) : null}
        {contactName != null ? (
          <Text muted variant="body">
            {t("addressBook.matchedContact", { name: contactName })}
          </Text>
        ) : null}
      </View>

      <View style={styles.actions}>
        {destinationAddress != null && contactName == null && !contactSaved ? (
          <View style={styles.contactSave}>
            {showContactForm ? (
              <>
                <TextInput
                  autoCapitalize="words"
                  autoCorrect
                  onChangeText={setNewContactName}
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
                  value={newContactName}
                />
                {contactError != null ? (
                  <FormErrorText message={contactError} />
                ) : null}
                <Button
                  disabled={isSavingContact}
                  label={
                    isSavingContact
                      ? t("common.saving")
                      : t("addressBook.saveContact")
                  }
                  onPress={() => {
                    void handleSaveContact();
                  }}
                />
              </>
            ) : (
              <Button
                label={t("addressBook.saveThisAddress")}
                onPress={() => {
                  setShowContactForm(true);
                }}
                variant="secondary"
              />
            )}
          </View>
        ) : null}
        {contactSaved ? (
          <Text muted style={styles.savedContact} variant="caption">
            {t("addressBook.contactSaved")}
          </Text>
        ) : null}
        <Button label={t("common.done")} onPress={onDone} />
        {onViewTransaction != null ? (
          <Button
            label={t("send.viewDetail")}
            onPress={onViewTransaction}
            style={styles.secondaryAction}
            variant="secondary"
          />
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center",
    paddingTop: spacing.lg,
  },
  amount: {
    marginTop: spacing.xs,
  },
  amountLabel: {
    marginTop: spacing.md,
  },
  actions: {
    gap: 0,
    paddingBottom: spacing.md,
  },
  contactSave: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  nameInput: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  savedContact: {
    marginBottom: spacing.md,
    textAlign: "center",
  },
  secondaryAction: {
    marginTop: spacing.md,
  },
});
