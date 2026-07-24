import type {
  BoltzReverseSwap,
  BoltzSubmarineSwap,
} from "@arkade-os/boltz-swap";
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
import {
  getLightningFundAmounts,
  getLightningWithdrawAmounts,
} from "@/lib/getLightningActivityAmounts";
import { mapBoltzSwapToActivity } from "@/lib/mapBoltzSwapToActivity";
import { parseLightningActivityId } from "@/lib/parseLightningActivityId";
import { spacing } from "@/lib/theme";
import { truncateMiddle } from "@/lib/truncateMiddle";

type LightningDetailState = {
  detail: ActivityItem;
  swap: BoltzReverseSwap | BoltzSubmarineSwap;
  settlementTxid: string | null;
};

const LightningActivityDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const { status } = useWallet();
  const { swaps } = useSwaps();
  const [state, setState] = useState<LightningDetailState | null>(null);
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

      if (
        swap == null ||
        (swap.type !== "reverse" && swap.type !== "submarine")
      ) {
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
        detail: mapBoltzSwapToActivity(swap),
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

  const parsed =
    activityId == null ? null : parseLightningActivityId(activityId);
  const flowLabel =
    parsed?.flow === "fund"
      ? t("activityDetail.lightningFundTitle")
      : t("activityDetail.lightningWithdrawTitle");

  const amounts =
    state?.swap.type === "reverse"
      ? getLightningFundAmounts(state.swap)
      : state?.swap.type === "submarine"
        ? getLightningWithdrawAmounts(state.swap)
        : null;

  const feeLabel =
    parsed?.flow === "fund"
      ? t("activityDetail.serviceFee")
      : t("activityDetail.swapFee");

  return (
    <Screen header={<ScreenHeader title={flowLabel} />} scroll>
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
            label={
              parsed?.flow === "fund"
                ? t("activityDetail.invoicePaid")
                : t("activityDetail.invoiceAmount")
            }
            value={t("activityDetail.amountSats", {
              amount: formatSats(amounts.invoiceAmountSats),
            })}
          />
          <DetailRow
            label={t("activityDetail.walletAmount")}
            value={t("activityDetail.amountSats", {
              amount: formatSats(amounts.netAmountSats),
            })}
          />

          {amounts.feeSats != null && amounts.feeSats > 0 ? (
            <DetailRow
              label={feeLabel}
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

          {state.swap.preimage != null && state.swap.preimage.length > 0 ? (
            <DetailRow
              actionsValue={state.swap.preimage}
              label={t("activityDetail.preimage")}
              value={truncateMiddle(state.swap.preimage)}
            />
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
};

export default LightningActivityDetailScreen;

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
