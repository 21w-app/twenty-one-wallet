import { useState, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import { AddressInputWithScan } from "@/components/AddressInputWithScan";
import { Button } from "@/components/Button";
import { FormErrorText } from "@/components/FormErrorText";
import { SatsInput } from "@/components/SatsInput";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { SendPaymentSuccess } from "@/components/SendPaymentSuccess";
import { Text } from "@/components/Text";
import { WalletGateLoading } from "@/components/WalletGateLoading";
import { useActivity } from "@/hooks/useActivity";
import { useI18n } from "@/hooks/useI18n";
import { useResetPaymentFlowOnNavigation } from "@/hooks/useResetPaymentFlowOnNavigation";
import { useWallet } from "@/hooks/useWallet";
import {
  getAddressBookContacts,
  type AddressBookContact,
} from "@/lib/addressBook";
import { ARK_SEND_MIN_SATS } from "@/lib/arkConfig";
import { recordArkSentAmountOverride } from "@/lib/arkSentAmountOverrides";
import { describeInsufficientBalanceError } from "@/lib/describeInsufficientBalanceError";
import { detectInvoiceType, type InvoiceType } from "@/lib/detectInvoiceType";
import { formatSats } from "@/lib/formatSats";
import { getWalletBalance } from "@/lib/getWalletBalance";
import { parseSatsInput } from "@/lib/parseSatsInput";
import {
  clearPendingTransaction,
  markPendingTransactionStarted,
} from "@/lib/pendingTransaction";
import { spacing } from "@/lib/theme";

type SendStep = "input" | "review" | "success" | "failure";

type ReviewDetails = {
  type: InvoiceType;
  destination: string;
  amountSats: number | null;
  description: string | null;
  contactName: string | null;
};

const findContactByAddress = (
  contacts: AddressBookContact[],
  address: string,
): AddressBookContact | null => {
  const trimmedAddress = address.trim();

  if (trimmedAddress.length === 0) {
    return null;
  }

  const contact = contacts.find((item) => {
    return item.address === trimmedAddress;
  });

  return contact ?? null;
};

const SendScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ contactAddress?: string }>();
  const { t } = useI18n();
  const { getWallet, sync, status, balanceSats } = useWallet();
  const { refresh, recordFailedPayment, recordSentTx } = useActivity();
  const [step, setStep] = useState<SendStep>("input");
  const [invoiceText, setInvoiceText] = useState("");
  const [arkAmount, setArkAmount] = useState("");
  const [review, setReview] = useState<ReviewDetails | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [sentArkTxid, setSentArkTxid] = useState<string | null>(null);
  const [sentAmountSats, setSentAmountSats] = useState<number | null>(null);
  const [sentDestination, setSentDestination] = useState<string | null>(null);
  const [contacts, setContacts] = useState<AddressBookContact[]>([]);

  const handleReset = useCallback(() => {
    setStep("input");
    setInvoiceText("");
    setArkAmount("");
    setReview(null);
    setError(null);
    setResultMessage(null);
    setSentArkTxid(null);
    setSentAmountSats(null);
    setSentDestination(null);
  }, []);

  useResetPaymentFlowOnNavigation({
    step,
    isPaying,
    onReset: handleReset,
  });

  useFocusEffect(
    useCallback(() => {
      const loadContacts = async () => {
        const nextContacts = await getAddressBookContacts();
        setContacts(nextContacts);
      };

      void loadContacts();
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      if (typeof params.contactAddress !== "string") {
        return;
      }

      setInvoiceText(params.contactAddress);
      setError(null);
    }, [params.contactAddress]),
  );

  if (status === "loading" || status === "idle") {
    return <WalletGateLoading />;
  }

  const buildReview = (
    value: string,
    arkAmountSats: number | null,
  ): ReviewDetails | null => {
    const trimmed = value.trim();
    const type = detectInvoiceType(trimmed);
    const contact = findContactByAddress(contacts, trimmed);

    if (type !== "ark") {
      return null;
    }

    if (arkAmountSats == null) {
      return null;
    }

    return {
      type,
      destination: trimmed,
      amountSats: arkAmountSats,
      description: null,
      contactName: contact?.name ?? null,
    };
  };

  const handleContinue = () => {
    const invoiceType = detectInvoiceType(invoiceText);
    const arkAmountSats = parseSatsInput(arkAmount);

    if (invoiceType !== "ark") {
      setError(t("send.invalidAddress"));
      return;
    }

    if (arkAmountSats == null) {
      setError(t("send.invalidAmount"));
      return;
    }

    if (arkAmountSats < ARK_SEND_MIN_SATS) {
      setError(t("send.minAmount", { amount: formatSats(ARK_SEND_MIN_SATS) }));
      return;
    }

    const insufficientBalanceError = describeInsufficientBalanceError(
      arkAmountSats,
      balanceSats,
      t,
    );

    if (insufficientBalanceError != null) {
      setError(insufficientBalanceError);
      return;
    }

    const details = buildReview(invoiceText, arkAmountSats);

    if (details == null) {
      setError(t("send.invalidAddress"));
      return;
    }

    setError(null);
    setReview(details);
    setStep("review");
  };

  const handlePay = async () => {
    if (review == null) {
      return;
    }

    const wallet = getWallet();

    if (wallet == null) {
      setError(t("send.walletNotReady"));
      return;
    }

    const amountSats = review.amountSats;

    if (amountSats == null) {
      setError(t("send.amountMissing"));
      return;
    }

    if (amountSats < ARK_SEND_MIN_SATS) {
      setError(t("send.minAmount", { amount: formatSats(ARK_SEND_MIN_SATS) }));
      return;
    }

    setIsPaying(true);
    setError(null);

    const timestamp = Date.now();

    try {
      const balance = await getWalletBalance(wallet);
      const insufficientBalanceError = describeInsufficientBalanceError(
        amountSats,
        balance.available,
        t,
      );

      if (insufficientBalanceError != null) {
        setError(insufficientBalanceError);
        setIsPaying(false);
        return;
      }

      markPendingTransactionStarted();

      let arkTxid: string | null = null;

      try {
        arkTxid = await wallet.send({
          address: review.destination,
          amount: amountSats,
        });
      } finally {
        clearPendingTransaction();
      }

      try {
        if (arkTxid == null) {
          throw new Error("send returned no txid");
        }

        try {
          await recordSentTx(arkTxid);
        } catch {
          // Non-fatal bookkeeping: payment already succeeded.
        }

        try {
          await recordArkSentAmountOverride({
            arkTxid,
            amountSats,
          });
        } catch {
          // Non-fatal bookkeeping: payment already succeeded on-chain.
        }

        await sync();
        await refresh();
        setSentArkTxid(arkTxid);
        setSentAmountSats(amountSats);
        setSentDestination(review.destination);
        setStep("success");
      } catch {
        recordFailedPayment({
          direction: "sent",
          amountSats,
          timestamp,
          protocol: "ark",
        });
        setResultMessage(t("send.paymentFailedBody"));
        setStep("failure");
      } finally {
        setIsPaying(false);
      }
    } catch {
      recordFailedPayment({
        direction: "sent",
        amountSats,
        timestamp,
        protocol: "ark",
      });
      setResultMessage(t("send.paymentFailedBody"));
      setStep("failure");
      setIsPaying(false);
    }
  };

  const goHome = () => {
    handleReset();
    router.replace("/");
  };

  const handleViewTransaction = () => {
    if (sentArkTxid == null) {
      return;
    }

    router.push({
      pathname: "/activity/ark",
      params: { id: sentArkTxid },
    });
  };

  if (step === "success" && sentAmountSats != null && sentArkTxid != null) {
    return (
      <Screen scroll>
        <ScreenHeader onBackPress={goHome} title={t("send.paymentSent")} />
        <SendPaymentSuccess
          amountSats={sentAmountSats}
          contactName={
            findContactByAddress(contacts, sentDestination ?? "")?.name
          }
          destinationAddress={sentDestination ?? undefined}
          onDone={goHome}
          onViewTransaction={handleViewTransaction}
        />
      </Screen>
    );
  }

  if (step === "failure") {
    return (
      <Screen scroll>
        <ScreenHeader title={t("send.paymentFailed")} />
        <View style={styles.resultBlock}>
          {resultMessage != null ? (
            <Text variant="body">{resultMessage}</Text>
          ) : null}
          <Button
            label={t("common.done")}
            onPress={handleReset}
            style={styles.action}
          />
        </View>
      </Screen>
    );
  }

  if (step === "review" && review != null) {
    const amountLabel =
      review.amountSats == null ? "—" : `${formatSats(review.amountSats)} sats`;

    return (
      <Screen header={<ScreenHeader title={t("send.reviewTitle")} />} scroll>
        <View style={styles.section}>
          <Text muted variant="caption">
            {t("send.amountLabel")}
          </Text>
          <Text variant="body">{amountLabel}</Text>
          <Text muted style={styles.fieldLabel} variant="caption">
            {t("addressBook.contact")}
          </Text>
          <Text variant="body">
            {review.contactName ?? t("addressBook.noSavedContact")}
          </Text>
          <Text muted style={styles.fieldLabel} variant="caption">
            {t("send.destinationLabel")}
          </Text>
          <Text selectable variant="body">
            {review.destination}
          </Text>
        </View>
        {error != null ? <FormErrorText message={error} /> : null}
        <Button
          disabled={isPaying}
          label={isPaying ? t("send.sending") : t("send.confirmPay")}
          onPress={() => {
            void handlePay();
          }}
          style={styles.action}
        />
        <Button
          disabled={isPaying}
          label={t("common.back")}
          onPress={() => {
            setStep("input");
          }}
          style={styles.action}
          variant="secondary"
        />
      </Screen>
    );
  }

  return (
    <Screen header={<ScreenHeader title={t("send.title")} />} scroll>
      <Text style={styles.description} variant="body">
        {t("send.scanOrPaste")}
      </Text>

      {contacts.length > 0 ? (
        <Button
          label={t("addressBook.selectContact")}
          onPress={() => {
            router.push({
              pathname: "/address-book",
              params: { returnTo: "send" },
            });
          }}
          style={styles.scanAction}
          variant="secondary"
        />
      ) : null}

      <View style={styles.inputs}>
        <AddressInputWithScan
          onChangeText={(value) => {
            setInvoiceText(value);
            setError(null);
          }}
          placeholder={t("send.pasteAddress")}
          value={invoiceText}
        />
        {findContactByAddress(contacts, invoiceText) != null ? (
          <Text muted variant="caption">
            {t("addressBook.matchedContact", {
              name: findContactByAddress(contacts, invoiceText)?.name ?? "",
            })}
          </Text>
        ) : null}
        <SatsInput
          onChangeText={setArkAmount}
          placeholder={t("send.amountPlaceholder")}
          value={arkAmount}
        />
      </View>

      {error != null ? <FormErrorText message={error} /> : null}

      <Button
        label={t("common.continue")}
        onPress={handleContinue}
        style={styles.action}
      />
    </Screen>
  );
};

export default SendScreen;

const styles = StyleSheet.create({
  description: {
    marginBottom: spacing.lg,
  },
  inputs: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  scanAction: {
    marginTop: spacing.sm,
  },
  section: {
    marginTop: spacing.lg,
  },
  fieldLabel: {
    marginTop: spacing.md,
  },
  action: {
    marginTop: spacing.md,
  },
  resultBlock: {
    flex: 1,
    gap: spacing.md,
    justifyContent: "center",
    paddingTop: spacing.lg,
  },
});
