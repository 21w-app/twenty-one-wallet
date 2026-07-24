import {
  decodeInvoice,
  type SendLightningPaymentResponse,
} from "@arkade-os/boltz-swap";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AddressInputWithScan } from "@/components/AddressInputWithScan";
import { Button } from "@/components/Button";
import { SendPaymentSuccess } from "@/components/SendPaymentSuccess";
import { Text } from "@/components/Text";
import { useActivity } from "@/hooks/useActivity";
import { useI18n } from "@/hooks/useI18n";
import { useResetPaymentFlowOnNavigation } from "@/hooks/useResetPaymentFlowOnNavigation";
import { useSwaps } from "@/hooks/useSwaps";
import { useWallet } from "@/hooks/useWallet";
import { detectInvoiceType } from "@/lib/detectInvoiceType";
import { findSubmarineSwapByPreimage } from "@/lib/findBoltzSwapByActivityId";
import { formatSats } from "@/lib/formatSats";
import { getLightningWithdrawAmounts } from "@/lib/getLightningActivityAmounts";
import {
  clearPendingTransaction,
  markPendingTransactionStarted,
} from "@/lib/pendingTransaction";
import { spacing } from "@/lib/theme";

type WithdrawStep = "input" | "review" | "success" | "failure";

type ReviewDetails = {
  destination: string;
  amountSats: number | null;
  description: string | null;
};

export const LightningWithdrawPanel = () => {
  const router = useRouter();
  const { t } = useI18n();
  const { getWallet, sync } = useWallet();
  const { swaps, ensureSwapManagerStarted } = useSwaps();
  const { refresh, recordFailedPayment, recordSentTx } = useActivity();
  const [step, setStep] = useState<WithdrawStep>("input");
  const [invoiceText, setInvoiceText] = useState("");
  const [review, setReview] = useState<ReviewDetails | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [withdrawnAmountSats, setWithdrawnAmountSats] = useState<number | null>(
    null,
  );
  const [withdrawActivityId, setWithdrawActivityId] = useState<string | null>(
    null,
  );

  const handleReset = useCallback(() => {
    setStep("input");
    setInvoiceText("");
    setReview(null);
    setError(null);
    setResultMessage(null);
    setWithdrawnAmountSats(null);
    setWithdrawActivityId(null);
  }, []);

  useResetPaymentFlowOnNavigation({
    step,
    isPaying,
    onReset: handleReset,
  });

  const handleContinue = () => {
    const trimmed = invoiceText.trim();
    const invoiceType = detectInvoiceType(trimmed);

    if (invoiceType !== "lightning") {
      setError(t("lightning.invalidInvoice"));
      return;
    }

    try {
      const decoded = decodeInvoice(trimmed);
      setReview({
        destination: trimmed,
        amountSats: decoded.amountSats,
        description: decoded.description,
      });
      setError(null);
      setStep("review");
    } catch {
      setError(t("lightning.invalidInvoice"));
    }
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

    if (swaps == null) {
      setError(t("lightning.servicesUnavailable"));
      return;
    }

    const amountSats = review.amountSats;

    if (amountSats == null) {
      setError(t("lightning.invoiceAmountMissing"));
      return;
    }

    setIsPaying(true);
    setError(null);

    const timestamp = Date.now();

    try {
      await ensureSwapManagerStarted();
      markPendingTransactionStarted();

      let response: SendLightningPaymentResponse;

      try {
        response = await swaps.sendLightningPayment({
          invoice: review.destination,
        });
      } finally {
        clearPendingTransaction();
      }

      let withdrawnAmount = response.amount;
      let activityId: string | null = null;

      try {
        await recordSentTx(response.txid);
      } catch {
        // Non-fatal bookkeeping: withdrawal already succeeded.
      }

      try {
        await sync();
        await refresh();

        const history = await swaps.getSwapHistory();
        const swap = findSubmarineSwapByPreimage(history, response.preimage);

        if (swap != null) {
          withdrawnAmount = getLightningWithdrawAmounts(swap).netAmountSats;
          activityId = `lightning-withdraw-${swap.id}`;
        }
      } catch {
        // Non-fatal: payment already succeeded.
      }

      setWithdrawnAmountSats(withdrawnAmount);
      setWithdrawActivityId(activityId);
      setStep("success");
    } catch {
      recordFailedPayment({
        direction: "sent",
        amountSats,
        timestamp,
        protocol: "lightning",
      });
      setResultMessage(t("lightning.withdrawalFailedBody"));
      setStep("failure");
    } finally {
      setIsPaying(false);
    }
  };

  const handleViewTransaction = () => {
    if (withdrawActivityId == null) {
      return;
    }

    router.push({
      pathname: "/activity/lightning",
      params: { id: withdrawActivityId },
    });
  };

  if (step === "success" && withdrawnAmountSats != null) {
    return (
      <SendPaymentSuccess
        amountLabel={t("lightning.amountWithdrawn")}
        amountSats={withdrawnAmountSats}
        onDone={handleReset}
        onViewTransaction={
          withdrawActivityId == null ? undefined : handleViewTransaction
        }
      />
    );
  }

  if (step === "failure") {
    return (
      <View style={styles.resultBlock}>
        {resultMessage != null ? (
          <Text variant="body">{resultMessage}</Text>
        ) : null}
        <Button label={t("common.done")} onPress={handleReset} />
      </View>
    );
  }

  if (step === "review" && review != null) {
    const amountLabel =
      review.amountSats == null ? "—" : `${formatSats(review.amountSats)} sats`;

    return (
      <View>
        <View style={styles.section}>
          <Text muted variant="caption">
            {t("send.amountLabel")}
          </Text>
          <Text variant="body">{amountLabel}</Text>
          {review.description != null && review.description.length > 0 ? (
            <>
              <Text muted style={styles.fieldLabel} variant="caption">
                {t("lightning.descriptionLabel")}
              </Text>
              <Text variant="body">{review.description}</Text>
            </>
          ) : null}
          <Text muted style={styles.fieldLabel} variant="caption">
            {t("lightning.invoiceLabel")}
          </Text>
          <Text selectable variant="body">
            {review.destination}
          </Text>
        </View>
        {error != null ? (
          <Text style={styles.error} variant="caption">
            {error}
          </Text>
        ) : null}
        <Button
          disabled={isPaying}
          label={isPaying ? t("send.sending") : t("lightning.confirmWithdraw")}
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
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.description} variant="body">
        {t("lightning.withdrawBody")}
      </Text>

      <AddressInputWithScan
        onChangeText={setInvoiceText}
        placeholder={t("lightning.pasteInvoice")}
        value={invoiceText}
      />

      {error != null ? (
        <Text style={styles.error} variant="caption">
          {error}
        </Text>
      ) : null}

      <Button
        label={t("common.continue")}
        onPress={handleContinue}
        style={styles.action}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  description: {
    marginBottom: spacing.md,
  },
  section: {
    marginTop: spacing.sm,
  },
  fieldLabel: {
    marginTop: spacing.md,
  },
  action: {
    marginTop: spacing.md,
  },
  error: {
    marginTop: spacing.sm,
  },
  resultBlock: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
});
