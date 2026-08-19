import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AddressInputWithScan } from "@/components/AddressInputWithScan";
import { Button } from "@/components/Button";
import { SatsInput } from "@/components/SatsInput";
import { SendPaymentSuccess } from "@/components/SendPaymentSuccess";
import { Text } from "@/components/Text";
import { useActivity } from "@/hooks/useActivity";
import { useI18n } from "@/hooks/useI18n";
import { useResetPaymentFlowOnNavigation } from "@/hooks/useResetPaymentFlowOnNavigation";
import { useWallet } from "@/hooks/useWallet";
import { describeInsufficientBalanceError } from "@/lib/describeInsufficientBalanceError";
import { formatLightningFundErrorForDisplay } from "@/lib/formatLightningFundError";
import { formatSats } from "@/lib/formatSats";
import { getArkServerFees } from "@/lib/getArkServerFees";
import { ImmatureOffboardVtxosError } from "@/lib/getOffboardSettleParams";
import { getWalletBalance } from "@/lib/getWalletBalance";
import { grossUpOffboardAmountSats } from "@/lib/grossUpOffboardAmountSats";
import { isValidBtcAddress } from "@/lib/isValidBtcAddress";
import { isExpoGo } from "@/lib/isExpoGo";
import {
  logLightningFundDebug,
  logLightningFundError,
} from "@/lib/logLightningFundDebug";
import { offboardToBtcAddress } from "@/lib/offboardToBtcAddress";
import { parseBtcPaymentUri } from "@/lib/parseBtcPaymentUri";
import { parseSatsInput } from "@/lib/parseSatsInput";
import {
  clearPendingTransaction,
  markPendingTransactionStarted,
} from "@/lib/pendingTransaction";
import { spacing } from "@/lib/theme";

type WithdrawStep = "input" | "review" | "success" | "failure";

// Temporary: Fix iteration marker for owner testing. Remove after stable.
const WITHDRAW_FIX_VERSION = "v5 (immature VTXO wait-state message)";
const SHOW_WITHDRAW_DIAGNOSTICS = __DEV__ || isExpoGo();

type ReviewDetails = {
  btcAddress: string;
  amountSats: number;
};

const formatWithdrawalEligibleAt = (date: Date, locale: string): string => {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const OnChainWithdrawPanel = () => {
  const router = useRouter();
  const { locale, t } = useI18n();
  const { getWallet, sync, status } = useWallet();
  const { refresh, recordFailedPayment, recordSentTx } = useActivity();
  const withdrawFixLabel = SHOW_WITHDRAW_DIAGNOSTICS
    ? ` — ${WITHDRAW_FIX_VERSION}`
    : "";
  const [step, setStep] = useState<WithdrawStep>("input");
  const [btcAddress, setBtcAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [review, setReview] = useState<ReviewDetails | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [withdrawnAmountSats, setWithdrawnAmountSats] = useState<number | null>(
    null,
  );
  const [withdrawActivityId, setWithdrawActivityId] = useState<string | null>(
    null,
  );

  const handleReset = useCallback(() => {
    setStep("input");
    setBtcAddress("");
    setAmount("");
    setReview(null);
    setError(null);
    setDebugError(null);
    setResultMessage(null);
    setWithdrawnAmountSats(null);
    setWithdrawActivityId(null);
  }, []);

  useResetPaymentFlowOnNavigation({
    step,
    isPaying,
    onReset: handleReset,
  });

  const handleBtcAddressChange = (value: string) => {
    const parsed = parseBtcPaymentUri(value);
    setBtcAddress(parsed.address);

    if (parsed.amountSats != null) {
      setAmount(String(parsed.amountSats));
    }
  };

  const handleContinue = () => {
    const trimmedAddress = btcAddress.trim();
    const amountSats = parseSatsInput(amount);

    if (!isValidBtcAddress(trimmedAddress)) {
      setError(t("funding.onchainInvalidBtcAddress"));
      return;
    }

    if (amountSats == null) {
      setError(t("send.invalidAmount"));
      return;
    }

    setError(null);
    setDebugError(null);
    setReview({
      btcAddress: trimmedAddress,
      amountSats,
    });
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

    setIsPaying(true);
    setError(null);
    setDebugError(null);

    const timestamp = Date.now();
    let preBalance: number | null = null;

    try {
      await sync();

      const [balance, fees] = await Promise.all([
        getWalletBalance(wallet),
        getArkServerFees(wallet),
      ]);
      preBalance = balance.available;

      const spendAmountSats = grossUpOffboardAmountSats(
        review.btcAddress,
        fees,
        review.amountSats,
      );
      const insufficientBalanceError = describeInsufficientBalanceError(
        spendAmountSats,
        balance.available,
        t,
      );

      if (insufficientBalanceError != null) {
        setError(insufficientBalanceError);
        return;
      }

      markPendingTransactionStarted();

      let activityId: string;

      try {
        activityId = await offboardToBtcAddress(
          wallet,
          review.btcAddress,
          review.amountSats,
        );
      } finally {
        clearPendingTransaction();
      }

      logLightningFundDebug("onchain-withdraw", "offboard submitted", {
        activityId,
      });

      try {
        await recordSentTx(activityId, {
          amountSats: review.amountSats,
          offboard: true,
        });
      } catch {
        // Non-fatal bookkeeping: offboard already submitted.
      }

      try {
        await sync();
        await refresh();
      } catch {
        // Non-fatal: offboard already submitted.
      }

      setWithdrawnAmountSats(review.amountSats);
      setWithdrawActivityId(activityId);
      setStep("success");
    } catch (offboardError) {
      logLightningFundError(
        "onchain-withdraw",
        "native offboard failed",
        offboardError,
        {
          preBalance,
          reviewAmount: review?.amountSats,
          fixVersion: WITHDRAW_FIX_VERSION,
        },
      );
      const enhancedDebug = `${WITHDRAW_FIX_VERSION}\n${formatLightningFundErrorForDisplay(offboardError)}\npreBalance: ${preBalance}\nrequested: ${review?.amountSats}`;

      if (offboardError instanceof ImmatureOffboardVtxosError) {
        const eligibleAt =
          offboardError.nextEligibleAt == null
            ? t("funding.onchainWithdrawImmatureVtxosUnknownTime")
            : formatWithdrawalEligibleAt(offboardError.nextEligibleAt, locale);

        setResultMessage(
          t("funding.onchainWithdrawImmatureVtxosBody", {
            time: eligibleAt,
          }),
        );
        setDebugError(SHOW_WITHDRAW_DIAGNOSTICS ? enhancedDebug : null);
        setStep("failure");
        return;
      }

      recordFailedPayment({
        direction: "sent",
        amountSats: review.amountSats,
        timestamp,
        protocol: "ark",
        ramp: "withdraw",
      });
      setResultMessage(t("funding.onchainWithdrawFailedBody"));
      setDebugError(SHOW_WITHDRAW_DIAGNOSTICS ? enhancedDebug : null);
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
      pathname: "/activity/ark",
      params: { id: withdrawActivityId },
    });
  };

  if (step === "success" && withdrawnAmountSats != null) {
    return (
      <SendPaymentSuccess
        amountLabel={t("funding.onchainWithdrawSubmittedAmount")}
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
        {debugError != null ? (
          <View style={styles.debugBlock}>
            <Text variant="label">
              {t("funding.onchainWithdrawDebugTitle")}
              {withdrawFixLabel}
            </Text>
            <Text muted variant="caption">
              {t("funding.onchainWithdrawDebugHint")}
            </Text>
            <Text selectable style={styles.debugError} variant="caption">
              {debugError}
            </Text>
          </View>
        ) : null}
        <Button label={t("common.done")} onPress={handleReset} />
      </View>
    );
  }

  if (step === "review" && review != null) {
    return (
      <View>
        <View style={styles.section}>
          <Text muted variant="caption">
            {t("funding.onchainWithdrawAmount")}
            {withdrawFixLabel}
          </Text>
          <Text variant="body">{`${formatSats(review.amountSats)} sats`}</Text>
          <Text muted style={styles.fieldLabel} variant="caption">
            {t("funding.onchainDestinationAddress")}
          </Text>
          <Text selectable variant="body">
            {review.btcAddress}
          </Text>
          <Text muted style={styles.fieldLabel} variant="caption">
            {t("funding.onchainOffboardSettlementHint")}
          </Text>
        </View>
        {error != null ? (
          <Text style={styles.error} variant="caption">
            {error}
          </Text>
        ) : null}
        <Button
          disabled={isPaying}
          label={
            isPaying ? t("send.sending") : t("funding.onchainConfirmWithdraw")
          }
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
        {t("funding.onchainWithdrawBody")}
      </Text>
      <Text muted style={styles.steps} variant="caption">
        {t("funding.onchainWithdrawSettlementHint")}
      </Text>

      <AddressInputWithScan
        onChangeText={handleBtcAddressChange}
        placeholder={t("funding.onchainBtcAddressPlaceholder")}
        value={btcAddress}
      />

      <View style={styles.amountInput}>
        <SatsInput
          onChangeText={setAmount}
          placeholder={t("funding.onchainAmountPlaceholderLoading")}
          value={amount}
        />
      </View>

      {error != null ? (
        <Text style={styles.error} variant="caption">
          {error}
        </Text>
      ) : null}

      <Button
        disabled={isPaying || status !== "ready"}
        label={isPaying ? t("common.loading") : t("common.continue")}
        onPress={handleContinue}
        style={styles.action}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  description: {
    marginBottom: spacing.sm,
  },
  steps: {
    marginBottom: spacing.md,
  },
  amountInput: {
    marginTop: spacing.md,
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
  debugBlock: {
    gap: spacing.xs,
  },
  debugError: {
    marginTop: spacing.sm,
    fontFamily: "monospace",
  },
  resultBlock: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
});
