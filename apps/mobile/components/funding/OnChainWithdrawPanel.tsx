import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AddressInputWithScan } from "@/components/AddressInputWithScan";
import { Button } from "@/components/Button";
import { SatsInput } from "@/components/SatsInput";
import { SendPaymentSuccess } from "@/components/SendPaymentSuccess";
import { Text } from "@/components/Text";
import { useActivity } from "@/hooks/useActivity";
import { useI18n } from "@/hooks/useI18n";
import { useResetPaymentFlowOnNavigation } from "@/hooks/useResetPaymentFlowOnNavigation";
import { useSwaps } from "@/hooks/useSwaps";
import { useWallet } from "@/hooks/useWallet";
import { describeInsufficientBalanceError } from "@/lib/describeInsufficientBalanceError";
import { findBoltzSwapByActivityId } from "@/lib/findBoltzSwapByActivityId";
import { formatLightningFundErrorForDisplay } from "@/lib/formatLightningFundError";
import { formatSats } from "@/lib/formatSats";
import { recordFundedChainSwap } from "@/lib/fundedChainSwaps";
import { getChainActivityAmounts } from "@/lib/getChainActivityAmounts";
import { getWalletBalance } from "@/lib/getWalletBalance";
import { isValidBtcAddress } from "@/lib/isValidBtcAddress";
import {
  logLightningFundDebug,
  logLightningFundError,
} from "@/lib/logLightningFundDebug";
import { parseBtcPaymentUri } from "@/lib/parseBtcPaymentUri";
import { parseSatsInput } from "@/lib/parseSatsInput";
import {
  clearPendingTransaction,
  markPendingTransactionStarted,
} from "@/lib/pendingTransaction";
import { spacing } from "@/lib/theme";

type WithdrawStep = "input" | "review" | "success" | "failure";

type ReviewDetails = {
  btcAddress: string;
  amountSats: number;
  amountToPay: number;
  swapId: string;
  arkAddress: string;
};

export const OnChainWithdrawPanel = () => {
  const router = useRouter();
  const { t } = useI18n();
  const { getWallet, sync } = useWallet();
  const { swaps, status: swapsStatus, ensureSwapManagerStarted } = useSwaps();
  const { refresh, recordFailedPayment, recordSentTx } = useActivity();
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
  const [minSats, setMinSats] = useState<number | null>(null);
  const [maxSats, setMaxSats] = useState<number | null>(null);

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

  useEffect(() => {
    const loadLimits = async () => {
      if (swaps == null) {
        return;
      }

      try {
        const limits = await swaps.getLimits("ARK", "BTC");
        setMinSats(limits.min);
        setMaxSats(limits.max);
        logLightningFundDebug("onchain-withdraw", "loaded chain limits", {
          min: limits.min,
          max: limits.max,
        });
      } catch (limitsError) {
        logLightningFundError(
          "onchain-withdraw",
          "getLimits ARK->BTC failed",
          limitsError,
        );
      }
    };

    void loadLimits();
  }, [swaps]);

  const handleBtcAddressChange = (value: string) => {
    const parsed = parseBtcPaymentUri(value);
    setBtcAddress(parsed.address);

    if (parsed.amountSats != null) {
      setAmount(String(parsed.amountSats));
    }
  };

  const handleContinue = async () => {
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

    if (minSats != null && amountSats < minSats) {
      setError(t("funding.onchainBelowMin", { min: formatSats(minSats) }));
      return;
    }

    if (maxSats != null && amountSats > maxSats) {
      setError(t("funding.onchainAboveMax", { max: formatSats(maxSats) }));
      return;
    }

    if (swaps == null) {
      setError(t("lightning.servicesNotReady"));
      return;
    }

    setError(null);
    setDebugError(null);
    setIsPaying(true);

    try {
      const response = await swaps.arkToBtc({
        btcAddress: trimmedAddress,
        receiverLockAmount: amountSats,
      });

      setReview({
        btcAddress: trimmedAddress,
        amountSats,
        amountToPay: response.amountToPay,
        swapId: response.pendingSwap.id,
        arkAddress: response.arkAddress,
      });
      setStep("review");
    } catch (quoteError) {
      logLightningFundError("onchain-withdraw", "arkToBtc failed", quoteError);
      setError(t("funding.onchainWithdrawPrepareError"));
      if (__DEV__) {
        setDebugError(formatLightningFundErrorForDisplay(quoteError));
      }
    } finally {
      setIsPaying(false);
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

    setIsPaying(true);
    setError(null);

    const timestamp = Date.now();

    try {
      const balance = await getWalletBalance(wallet);
      const insufficientBalanceError = describeInsufficientBalanceError(
        review.amountToPay,
        balance.available,
        t,
      );

      if (insufficientBalanceError != null) {
        setError(insufficientBalanceError);
        return;
      }

      await ensureSwapManagerStarted();
      markPendingTransactionStarted();

      let arkTxid: string | null = null;

      try {
        arkTxid = await wallet.send({
          address: review.arkAddress,
          amount: review.amountToPay,
        });
      } finally {
        clearPendingTransaction();
      }

      try {
        if (arkTxid == null) {
          throw new Error("send returned no txid");
        }

        await recordSentTx(arkTxid);
        await recordFundedChainSwap(review.swapId);
      } catch {
        // Non-fatal bookkeeping: withdrawal already submitted.
      }

      let withdrawnAmount = review.amountSats;
      let activityId: string | null = `onchain-withdraw-${review.swapId}`;

      try {
        await sync();
        await refresh();

        const history = await swaps.getSwapHistory();
        const swap = findBoltzSwapByActivityId(
          history,
          `onchain-withdraw-${review.swapId}`,
        );

        if (swap != null && swap.type === "chain") {
          withdrawnAmount = getChainActivityAmounts(swap).netAmountSats;
          activityId = `onchain-withdraw-${swap.id}`;
        }
      } catch {
        // Non-fatal: Ark send already succeeded.
      }

      setWithdrawnAmountSats(withdrawnAmount);
      setWithdrawActivityId(activityId);
      setStep("success");
    } catch (payError) {
      logLightningFundError("onchain-withdraw", "withdraw failed", payError);
      recordFailedPayment({
        direction: "sent",
        amountSats: review.amountSats,
        timestamp,
        protocol: "onchain",
      });
      setResultMessage(t("funding.onchainWithdrawFailedBody"));
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
      pathname: "/activity/onchain",
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
    return (
      <View>
        <View style={styles.section}>
          <Text muted variant="caption">
            {t("funding.onchainReceiveAmount")}
          </Text>
          <Text variant="body">{`${formatSats(review.amountSats)} sats`}</Text>
          <Text muted style={styles.fieldLabel} variant="caption">
            {t("funding.onchainPayFromWallet")}
          </Text>
          <Text variant="body">
            {t("activity.amountSats", {
              sign: "",
              amount: formatSats(review.amountToPay),
            })}
          </Text>
          <Text muted style={styles.fieldLabel} variant="caption">
            {t("funding.onchainDestinationAddress")}
          </Text>
          <Text selectable variant="body">
            {review.btcAddress}
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

      {minSats != null && maxSats != null ? (
        <Text muted style={styles.limits} variant="caption">
          {t("funding.onchainLimits", {
            min: formatSats(minSats),
            max: formatSats(maxSats),
          })}
        </Text>
      ) : null}

      <AddressInputWithScan
        onChangeText={handleBtcAddressChange}
        placeholder={t("funding.onchainBtcAddressPlaceholder")}
        value={btcAddress}
      />

      <View style={styles.amountInput}>
        <SatsInput
          onChangeText={setAmount}
          placeholder={t("funding.onchainAmountPlaceholder")}
          value={amount}
        />
      </View>

      {error != null ? (
        <Text style={styles.error} variant="caption">
          {error}
        </Text>
      ) : null}
      {__DEV__ && debugError != null ? (
        <Text selectable style={styles.debugError} variant="caption">
          {debugError}
        </Text>
      ) : null}

      <Button
        disabled={isPaying || swapsStatus !== "ready"}
        label={isPaying ? t("common.loading") : t("common.continue")}
        onPress={() => {
          void handleContinue();
        }}
        style={styles.action}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  description: {
    marginBottom: spacing.sm,
  },
  limits: {
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
  debugError: {
    marginTop: spacing.sm,
    fontFamily: "monospace",
  },
  resultBlock: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
});
