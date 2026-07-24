import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { Button } from "@/components/Button";
import { CopyShareActions } from "@/components/CopyShareActions";
import { InvoiceQrCode } from "@/components/InvoiceQrCode";
import { SatsInput } from "@/components/SatsInput";
import { Text } from "@/components/Text";
import { useActivity } from "@/hooks/useActivity";
import { useI18n } from "@/hooks/useI18n";
import { useSwaps } from "@/hooks/useSwaps";
import { formatLightningFundErrorForDisplay } from "@/lib/formatLightningFundError";
import { formatBtcPaymentUri } from "@/lib/formatBtcPaymentUri";
import { formatSats } from "@/lib/formatSats";
import {
  logLightningFundDebug,
  logLightningFundError,
} from "@/lib/logLightningFundDebug";
import { parseSatsInput } from "@/lib/parseSatsInput";
import { colors, radii, spacing } from "@/lib/theme";
import type { TranslateFn } from "@/lib/createTranslator";

type DepositState = {
  btcAddress: string;
  amountToPay: number;
  receiveAmountSats: number;
};

type FundStep = "input" | "review" | "deposit";

export const OnChainFundPanel = () => {
  const { t } = useI18n();
  const { swaps, status: swapsStatus, ensureSwapManagerStarted } = useSwaps();
  const { refresh } = useActivity();
  const [step, setStep] = useState<FundStep>("input");
  const [amount, setAmount] = useState("");
  const [deposit, setDeposit] = useState<DepositState | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [minSats, setMinSats] = useState<number | null>(null);
  const [maxSats, setMaxSats] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    const loadLimits = async () => {
      if (swaps == null) {
        return;
      }

      try {
        const limits = await swaps.getLimits("BTC", "ARK");
        setMinSats(limits.min);
        setMaxSats(limits.max);
        logLightningFundDebug("onchain-fund", "loaded chain limits", {
          min: limits.min,
          max: limits.max,
        });
      } catch (limitsError) {
        logLightningFundError(
          "onchain-fund",
          "getLimits BTC->ARK failed",
          limitsError,
        );
      }
    };

    void loadLimits();
  }, [swaps]);

  const resetQuote = () => {
    setDeposit(null);
    setAcknowledged(false);
    setStep("input");
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (deposit != null || step !== "input") {
      resetQuote();
    }
  };

  const handleGenerate = async () => {
    const amountSats = parseSatsInput(amount);

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

    setIsGenerating(true);
    setError(null);
    setDebugError(null);

    try {
      await ensureSwapManagerStarted();

      const response = await swaps.btcToArk({
        receiverLockAmount: amountSats,
      });

      setDeposit({
        btcAddress: response.btcAddress,
        amountToPay: response.amountToPay,
        receiveAmountSats: amountSats,
      });
      setAcknowledged(false);
      setStep("review");

      try {
        await refresh();
      } catch (refreshError) {
        logLightningFundError(
          "onchain-fund",
          "deposit created but activity refresh failed",
          refreshError,
        );
      }
    } catch (depositError) {
      logLightningFundError("onchain-fund", "btcToArk failed", depositError);
      setError(t("funding.onchainCreateDepositError"));
      if (__DEV__) {
        setDebugError(formatLightningFundErrorForDisplay(depositError));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const paymentRequest =
    deposit == null
      ? null
      : formatBtcPaymentUri({
          address: deposit.btcAddress,
          amountSats: deposit.amountToPay,
        });

  const swapFeeSats =
    deposit == null
      ? null
      : Math.max(deposit.amountToPay - deposit.receiveAmountSats, 0);

  return (
    <View>
      <Text style={styles.description} variant="body">
        {t("funding.onchainFundBody")}
      </Text>

      {minSats != null && maxSats != null ? (
        <Text muted style={styles.limits} variant="caption">
          {t("funding.onchainLimits", {
            min: formatSats(minSats),
            max: formatSats(maxSats),
          })}
        </Text>
      ) : null}

      <View style={styles.section}>
        <SatsInput
          onChangeText={handleAmountChange}
          placeholder={t("funding.onchainAmountPlaceholder")}
          value={amount}
        />
        {step === "input" ? (
          <Button
            disabled={isGenerating || swapsStatus !== "ready"}
            label={
              isGenerating
                ? t("funding.onchainGenerating")
                : t("funding.onchainGenerateDeposit")
            }
            onPress={() => {
              void handleGenerate();
            }}
            style={styles.generateButton}
          />
        ) : null}
        {swapsStatus === "error" ? (
          <Text style={styles.error} variant="caption">
            {t("lightning.servicesUnavailable")}
          </Text>
        ) : null}
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
      </View>

      {deposit != null && step === "review" ? (
        <View style={styles.quoteSection}>
          <OnChainDepositSummary
            amountToPay={deposit.amountToPay}
            swapFeeSats={swapFeeSats ?? 0}
            t={t}
          />

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acknowledged }}
            onPress={() => {
              setAcknowledged((current) => {
                return !current;
              });
            }}
            style={styles.checkboxRow}
          >
            <View
              style={[styles.checkbox, acknowledged && styles.checkboxChecked]}
            >
              {acknowledged ? (
                <Text style={styles.checkmark} variant="label">
                  ✓
                </Text>
              ) : null}
            </View>
            <Text style={styles.checkboxLabel} variant="body">
              {t("funding.onchainConfirmExactAmount", {
                amount: formatSats(deposit.amountToPay),
              })}
            </Text>
          </Pressable>

          <Button
            disabled={!acknowledged}
            label={t("funding.onchainShowDeposit")}
            onPress={() => {
              setStep("deposit");
            }}
          />
        </View>
      ) : null}

      {deposit != null && paymentRequest != null && step === "deposit" ? (
        <View style={styles.quoteSection}>
          <OnChainDepositSummary
            amountToPay={deposit.amountToPay}
            swapFeeSats={swapFeeSats ?? 0}
            t={t}
          />

          <Text variant="label">{t("funding.onchainDepositAddress")}</Text>
          <Text selectable style={styles.value} variant="body">
            {deposit.btcAddress}
          </Text>
          <View>
            <InvoiceQrCode value={paymentRequest} />
            <CopyShareActions value={paymentRequest} />
          </View>
        </View>
      ) : null}
    </View>
  );
};

const OnChainDepositSummary = ({
  amountToPay,
  swapFeeSats,
  t,
}: {
  amountToPay: number;
  swapFeeSats: number;
  t: TranslateFn;
}) => {
  return (
    <View style={styles.summaryPanel}>
      <Text style={styles.summaryTitle} variant="label">
        {t("funding.onchainSendAmount", {
          amount: formatSats(amountToPay),
        })}
      </Text>
      <Text muted style={styles.summaryNote} variant="caption">
        {t("funding.onchainSwapFeeNote", {
          extra: formatSats(swapFeeSats),
        })}
      </Text>
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
  section: {
    marginBottom: spacing.lg,
  },
  quoteSection: {
    gap: spacing.md,
    marginBottom: spacing.lg,
    marginTop: spacing.xl,
  },
  value: {
    marginTop: spacing.sm,
  },
  generateButton: {
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  summaryPanel: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.accent,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  summaryTitle: {
    color: colors.accent,
  },
  summaryNote: {
    color: colors.text,
  },
  checkboxRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
  },
  checkbox: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkmark: {
    color: colors.background,
  },
  checkboxLabel: {
    flex: 1,
  },
  error: {
    marginTop: spacing.sm,
  },
  debugError: {
    marginTop: spacing.sm,
    fontFamily: "monospace",
  },
});
