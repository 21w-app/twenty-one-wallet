import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/Button";
import { CopyShareActions } from "@/components/CopyShareActions";
import { InvoiceQrCode } from "@/components/InvoiceQrCode";
import { SatsInput } from "@/components/SatsInput";
import { Text } from "@/components/Text";
import { useActivity } from "@/hooks/useActivity";
import { useI18n } from "@/hooks/useI18n";
import { useSwaps } from "@/hooks/useSwaps";
import { formatLightningFundErrorForDisplay } from "@/lib/formatLightningFundError";
import { getWalletNetworkInfo } from "@/lib/getWalletNetworkInfo";
import { getLightningFundInvoiceDescription } from "@/lib/getLightningFundInvoiceDescription";
import {
  logLightningFundDebug,
  logLightningFundError,
} from "@/lib/logLightningFundDebug";
import { parseSatsInput } from "@/lib/parseSatsInput";
import { spacing } from "@/lib/theme";

export const LightningFundPanel = () => {
  const { t } = useI18n();
  const { swaps, status: swapsStatus, ensureSwapManagerStarted } = useSwaps();
  const { refresh } = useActivity();
  const [amount, setAmount] = useState("");
  const [invoice, setInvoice] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null);

  const handleGenerate = async () => {
    const amountSats = parseSatsInput(amount);

    if (amountSats == null) {
      setError(t("send.invalidAmount"));
      return;
    }

    if (swaps == null) {
      setError(t("lightning.servicesNotReady"));
      return;
    }

    setIsGenerating(true);
    setError(null);
    setDebugError(null);

    const network = getWalletNetworkInfo();
    const invoiceDescription = getLightningFundInvoiceDescription();

    logLightningFundDebug("fund", "generate invoice requested", {
      amountSats,
      swapsStatus,
      network,
      invoiceDescription,
    });

    try {
      await ensureSwapManagerStarted();

      const response = await swaps.createLightningInvoice({
        amount: amountSats,
        description: invoiceDescription,
      });

      setInvoice(response.invoice);

      try {
        await refresh();
      } catch (refreshError) {
        logLightningFundError(
          "fund",
          "invoice created but activity refresh failed",
          refreshError,
        );
      }
    } catch (invoiceError) {
      logLightningFundError(
        "fund",
        "createLightningInvoice failed",
        invoiceError,
        {
          amountSats,
          swapsStatus,
          network,
        },
      );
      setError(t("lightning.createInvoiceError"));
      if (__DEV__) {
        setDebugError(formatLightningFundErrorForDisplay(invoiceError));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <View>
      <Text style={styles.description} variant="body">
        {t("lightning.fundBody")}
      </Text>

      <SatsInput
        onChangeText={setAmount}
        placeholder={t("send.amountPlaceholder")}
        value={amount}
      />
      <Button
        disabled={isGenerating || swapsStatus !== "ready"}
        label={
          isGenerating
            ? t("lightning.generating")
            : t("lightning.generateInvoice")
        }
        onPress={() => {
          void handleGenerate();
        }}
        style={styles.generateButton}
      />
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

      {invoice != null ? (
        <View style={styles.section}>
          <Text variant="label">{t("lightning.fundingInvoice")}</Text>
          <Text selectable style={styles.value} variant="body">
            {invoice}
          </Text>
          <InvoiceQrCode value={invoice} />
          <CopyShareActions value={invoice} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  description: {
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  value: {
    marginTop: spacing.sm,
  },
  generateButton: {
    marginBottom: spacing.xl,
    marginTop: spacing.md,
  },
  error: {
    marginTop: spacing.sm,
  },
  debugError: {
    marginTop: spacing.sm,
    fontFamily: "monospace",
  },
});
