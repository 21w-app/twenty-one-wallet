import type { BoltzChainSwap } from "@arkade-os/boltz-swap";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { DetailRow } from "@/components/DetailRow";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Text } from "@/components/Text";
import { WalletGateLoading } from "@/components/WalletGateLoading";
import { useI18n } from "@/hooks/useI18n";
import { useSwaps } from "@/hooks/useSwaps";
import { useWallet } from "@/hooks/useWallet";
import type { ActivityItem } from "@/lib/activityTypes";
import { findBoltzSwapByActivityId } from "@/lib/findBoltzSwapByActivityId";
import { formatActivityStatusLabel } from "@/lib/formatActivityStatusLabel";
import { formatActivityTimestamp } from "@/lib/formatActivityTimestamp";
import { formatSats } from "@/lib/formatSats";
import { getActivityDirectionLabel } from "@/lib/getActivityDirectionLabel";
import { getChainActivityAmounts } from "@/lib/getChainActivityAmounts";
import { mapChainSwapToActivity } from "@/lib/mapChainSwapToActivity";
import { parseOnchainActivityId } from "@/lib/parseOnchainActivityId";
import { spacing } from "@/lib/theme";
import { truncateMiddle } from "@/lib/truncateMiddle";

type OnchainDetailState = {
  detail: ActivityItem;
  swap: BoltzChainSwap;
  settlementTxid: string | null;
};

const OnchainActivityDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const { status } = useWallet();
  const { swaps } = useSwaps();
  const [state, setState] = useState<OnchainDetailState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activityId = typeof id === "string" ? id : null;

  const loadDetail = useCallback(async () => {
    if (activityId == null) {
      setError(t("activityDetail.notFound"));
      setIsLoading(false);
      return;
    }

    if (swaps == null) {
      setError(t("lightning.servicesNotAvailable"));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const history = await swaps.getSwapHistory();
      const swap = findBoltzSwapByActivityId(history, activityId);

      if (swap == null || swap.type !== "chain") {
        setState(null);
        setError(t("activityDetail.notFound"));
        return;
      }

      let settlementTxid: string | null = null;

      try {
        const statusResponse = await swaps.getSwapStatus(swap.id);
        settlementTxid = statusResponse.transaction?.id ?? null;
      } catch {
        settlementTxid = null;
      }

      setState({
        detail: mapChainSwapToActivity(swap),
        swap,
        settlementTxid,
      });
    } catch {
      setState(null);
      setError(t("activityDetail.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [activityId, swaps, t]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  if (status === "loading" || status === "idle") {
    return <WalletGateLoading />;
  }

  const parsed = activityId == null ? null : parseOnchainActivityId(activityId);
  const flowLabel =
    parsed?.flow === "fund"
      ? t("activityDetail.onchainFundTitle")
      : t("activityDetail.onchainWithdrawTitle");

  const amounts =
    state?.swap != null ? getChainActivityAmounts(state.swap) : null;
  const walletAmountSats =
    parsed?.flow === "withdraw"
      ? amounts?.lockAmountSats
      : amounts?.netAmountSats;

  return (
    <Screen scroll>
      <ScreenHeader title={flowLabel} />

      {isLoading ? (
        <Text variant="body">{t("activityDetail.loading")}</Text>
      ) : null}

      {error != null ? <Text variant="body">{error}</Text> : null}

      {state != null && amounts != null ? (
        <View style={styles.section}>
          <Text variant="title">
            {state.detail.direction === "received" ? "+" : "-"}
            {t("activityDetail.amountSats", {
              amount: formatSats(amounts.netAmountSats),
            })}
          </Text>

          <DetailRow
            label={t("activityDetail.direction")}
            value={getActivityDirectionLabel(state.detail, t)}
          />
          <DetailRow
            label={t("activityDetail.status")}
            value={formatActivityStatusLabel(state.detail.status, t)}
          />
          <DetailRow
            label={t("activityDetail.date")}
            value={formatActivityTimestamp(state.detail.timestamp, t)}
          />
          <DetailRow
            actionsValue={state.swap.id}
            label={t("activityDetail.swapId")}
            value={truncateMiddle(state.swap.id)}
          />
          <DetailRow
            label={t("activityDetail.lockAmount")}
            value={t("activityDetail.amountSats", {
              amount: formatSats(amounts.lockAmountSats),
            })}
          />
          <DetailRow
            label={t("activityDetail.walletAmount")}
            value={t("activityDetail.amountSats", {
              amount: formatSats(walletAmountSats ?? 0),
            })}
          />

          {amounts.feeSats != null && amounts.feeSats > 0 ? (
            <DetailRow
              label={t("activityDetail.swapFee")}
              value={t("activityDetail.amountSats", {
                amount: formatSats(amounts.feeSats),
              })}
            />
          ) : null}

          <DetailRow
            label={t("activityDetail.boltzStatus")}
            value={state.swap.status}
          />

          {state.settlementTxid != null ? (
            <DetailRow
              actionsValue={state.settlementTxid}
              label={t("activityDetail.settlementTxid")}
              value={truncateMiddle(state.settlementTxid)}
            />
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
};

export default OnchainActivityDetailScreen;

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
