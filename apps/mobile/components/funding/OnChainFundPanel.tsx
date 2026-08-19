import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "@/components/Button";
import { CopyShareActions } from "@/components/CopyShareActions";
import { InvoiceQrCode } from "@/components/InvoiceQrCode";
import { OngoingFundCard } from "@/components/funding/OngoingFundCard";
import { Text } from "@/components/Text";
import { useActivity } from "@/hooks/useActivity";
import { useI18n } from "@/hooks/useI18n";
import { useWallet } from "@/hooks/useWallet";
import type { ActivityItem } from "@/lib/activityTypes";
import { formatLightningFundErrorForDisplay } from "@/lib/formatLightningFundError";
import { formatSats } from "@/lib/formatSats";
import { getBoardingAddress } from "@/lib/getBoardingAddress";
import {
  getBoardingAmountLimits,
  type BoardingAmountLimits,
} from "@/lib/getBoardingAmountLimits";
import {
  clearConfirmedBoardingFundState,
  getBoardingFundState,
  type BoardingFundState,
} from "@/lib/getBoardingFundState";
import {
  logLightningFundDebug,
  logLightningFundError,
} from "@/lib/logLightningFundDebug";
import { settleConfirmedBoardingIfNeeded } from "@/lib/settleConfirmedBoardingIfNeeded";
import { spacing } from "@/lib/theme";

const hasPendingFundActivity = (items: ActivityItem[]): boolean => {
  return items.some((item) => {
    return item.ramp === "fund" && item.status === "pending";
  });
};

export const OnChainFundPanel = () => {
  const { t } = useI18n();
  const { getWallet, status, sync } = useWallet();
  const { items, refresh } = useActivity();
  const [boardingAddress, setBoardingAddress] = useState<string | null>(null);
  const [fundState, setFundState] = useState<BoardingFundState | null>(null);
  const [limits, setLimits] = useState<BoardingAmountLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null);
  const [onboardSuccess, setOnboardSuccess] = useState(false);
  const settleInFlightRef = useRef(false);
  const sawPendingFundRef = useRef(false);

  const hideSettledFundWidget = useCallback(() => {
    setOnboardSuccess(true);
    setFundState((current) => {
      if (current == null) {
        return current;
      }

      return clearConfirmedBoardingFundState(current);
    });
  }, []);

  const loadPanelState = useCallback(async () => {
    const wallet = getWallet();

    if (wallet == null) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [address, nextFundState, nextLimits] = await Promise.all([
        getBoardingAddress(wallet),
        getBoardingFundState(wallet),
        getBoardingAmountLimits(wallet),
      ]);

      setBoardingAddress(address);
      setFundState(nextFundState);
      if (nextFundState.unconfirmedSats > 0) {
        setOnboardSuccess(false);
      }
      setLimits(nextLimits);
      logLightningFundDebug("onchain-fund", "loaded boarding state", {
        confirmed: nextFundState.confirmedSats,
        confirmedUtxoCount: nextFundState.confirmedUtxoCount,
        total: nextFundState.totalBoardingSats,
        unconfirmed: nextFundState.unconfirmedSats,
        min: nextLimits.minSats,
        max: nextLimits.maxSats,
      });

      return nextFundState;
    } catch (loadError) {
      logLightningFundError(
        "onchain-fund",
        "load boarding state failed",
        loadError,
      );
      setError(t("funding.onchainLoadError"));
      setDebugError(formatLightningFundErrorForDisplay(loadError));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getWallet, t]);

  const settleConfirmedDeposit = useCallback(async () => {
    const wallet = getWallet();

    if (wallet == null) {
      setError(t("send.walletNotReady"));
      return;
    }

    if (settleInFlightRef.current) {
      return;
    }

    settleInFlightRef.current = true;
    setIsOnboarding(true);
    setError(null);
    setDebugError(null);

    try {
      const result = await settleConfirmedBoardingIfNeeded(wallet);

      if (result.onboarded) {
        hideSettledFundWidget();
        logLightningFundDebug("onchain-fund", "boarding utxos onboarded", {
          txid: result.txid,
        });
      }

      try {
        await sync();
        await refresh();
      } catch (refreshError) {
        logLightningFundError(
          "onchain-fund",
          "onboard succeeded but refresh failed",
          refreshError,
        );
      }

      await loadPanelState();
    } catch (onboardError) {
      logLightningFundError("onchain-fund", "onboard failed", onboardError);
      setError(t("funding.onchainOnboardError"));
      setDebugError(formatLightningFundErrorForDisplay(onboardError));
    } finally {
      settleInFlightRef.current = false;
      setIsOnboarding(false);
    }
  }, [getWallet, hideSettledFundWidget, loadPanelState, refresh, sync, t]);

  useEffect(() => {
    if (status !== "ready") {
      return;
    }

    const autoSettleIfNeeded = async () => {
      const nextFundState = await loadPanelState();

      if (nextFundState?.canOnboard === true) {
        await settleConfirmedDeposit();
      }
    };

    void autoSettleIfNeeded();
  }, [loadPanelState, settleConfirmedDeposit, status]);

  useEffect(() => {
    if (hasPendingFundActivity(items)) {
      sawPendingFundRef.current = true;
      return;
    }

    if (!sawPendingFundRef.current) {
      return;
    }

    if (isOnboarding || fundState?.canOnboard !== true) {
      return;
    }

    sawPendingFundRef.current = false;
    hideSettledFundWidget();
    void loadPanelState();
  }, [
    fundState?.canOnboard,
    hideSettledFundWidget,
    isOnboarding,
    items,
    loadPanelState,
  ]);

  const handleRefresh = async () => {
    try {
      await sync();
      await refresh();
    } catch (refreshError) {
      logLightningFundError(
        "onchain-fund",
        "refresh before onboard failed",
        refreshError,
      );
    }

    const nextFundState = await loadPanelState();

    if (nextFundState?.canOnboard === true) {
      await settleConfirmedDeposit();
    }
  };

  const limitsLabel =
    limits?.minSats != null && limits.maxSats != null
      ? t("funding.onchainLimits", {
          min: formatSats(limits.minSats),
          max: formatSats(limits.maxSats),
        })
      : limits?.minSats != null
        ? t("funding.onchainMinOnly", { min: formatSats(limits.minSats) })
        : null;

  const showOngoingFund =
    fundState != null &&
    !onboardSuccess &&
    (fundState.unconfirmedSats > 0 || fundState.canOnboard);

  return (
    <View>
      {showOngoingFund && fundState != null ? (
        <OngoingFundCard
          fundState={fundState}
          isLoading={isLoading}
          isOnboarding={isOnboarding}
          onOnboard={() => {
            void settleConfirmedDeposit();
          }}
        />
      ) : null}

      <Text style={styles.description} variant="body">
        {t("funding.onchainFundBody")}
      </Text>
      <Text muted style={styles.steps} variant="caption">
        {t("funding.onchainFundSteps")}
      </Text>

      {limitsLabel != null ? (
        <Text muted style={styles.limits} variant="caption">
          {limitsLabel}
        </Text>
      ) : null}

      {boardingAddress != null ? (
        <View style={styles.section}>
          <Text variant="label">{t("funding.onchainDepositAddress")}</Text>
          <Text selectable style={styles.value} variant="body">
            {boardingAddress}
          </Text>
          <InvoiceQrCode value={boardingAddress} />
          <CopyShareActions value={boardingAddress} />
        </View>
      ) : null}

      <Button
        disabled={isLoading || isOnboarding}
        label={t("common.refresh")}
        onPress={() => {
          void handleRefresh();
        }}
        style={styles.action}
        variant="secondary"
      />

      {onboardSuccess ? (
        <Text style={styles.success} variant="caption">
          {t("funding.onchainOnboardSuccess")}
        </Text>
      ) : null}

      {error != null ? (
        <Text style={styles.error} variant="caption">
          {error}
        </Text>
      ) : null}
      {debugError != null ? (
        <Text selectable style={styles.debugError} variant="caption">
          {debugError}
        </Text>
      ) : null}
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
  limits: {
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  value: {
    marginTop: spacing.sm,
  },
  action: {
    marginTop: spacing.md,
  },
  success: {
    marginTop: spacing.sm,
  },
  error: {
    marginTop: spacing.sm,
  },
  debugError: {
    marginTop: spacing.sm,
    fontFamily: "monospace",
  },
});
