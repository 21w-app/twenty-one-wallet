import { type ArkTransaction } from "@arkade-os/sdk";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { DetailRow } from "@/components/DetailRow";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Text } from "@/components/Text";
import { WalletGateLoading } from "@/components/WalletGateLoading";
import { useI18n } from "@/hooks/useI18n";
import { useWallet } from "@/hooks/useWallet";
import type { ActivityItem } from "@/lib/activityTypes";
import { readArkSentAmountOverridesMap } from "@/lib/arkSentAmountOverrides";
import { findArkTransactionByActivityId } from "@/lib/findArkTransactionByActivityId";
import { formatActivityStatusLabel } from "@/lib/formatActivityStatusLabel";
import { formatActivityTimestamp } from "@/lib/formatActivityTimestamp";
import { formatSats } from "@/lib/formatSats";
import { isArkReceivePendingButSpendable } from "@/lib/isArkReceivePendingButSpendable";
import { mapArkTransactionToActivity } from "@/lib/mapArkTransaction";
import { spacing } from "@/lib/theme";
import { truncateMiddle } from "@/lib/truncateMiddle";

const ArkActivityDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const { getWallet, status } = useWallet();
  const [detail, setDetail] = useState<ActivityItem | null>(null);
  const [transaction, setTransaction] = useState<ArkTransaction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const activityId = typeof id === "string" ? id : null;

  const loadDetail = useCallback(async () => {
    if (activityId == null) {
      setError(t("activityDetail.notFound"));
      setIsLoading(false);
      return;
    }

    const wallet = getWallet();

    if (wallet == null) {
      setError(t("send.walletNotReady"));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [history, vtxos, overrides] = await Promise.all([
        wallet.getTransactionHistory(),
        wallet.getVtxos({ withRecoverable: false }),
        readArkSentAmountOverridesMap(),
      ]);
      const match = findArkTransactionByActivityId(history, activityId);

      if (match == null) {
        setDetail(null);
        setTransaction(null);
        setError(t("activityDetail.notFound"));
        return;
      }

      setTransaction(match);
      setDetail(
        mapArkTransactionToActivity(match, {
          overrides,
          vtxos,
        }),
      );
    } catch {
      setDetail(null);
      setTransaction(null);
      setError(t("activityDetail.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [activityId, getWallet, t]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  if (status === "loading" || status === "idle") {
    return <WalletGateLoading />;
  }

  const directionLabel =
    detail?.direction === "received"
      ? t("activityDetail.received")
      : t("activityDetail.sent");

  const txTypeLabel =
    detail?.direction === "received"
      ? t("activityDetail.txTypeReceived")
      : t("activityDetail.txTypeSent");

  return (
    <Screen
      header={<ScreenHeader title={t("activityDetail.arkTitle")} />}
      scroll
    >
      {isLoading ? (
        <Text variant="body">{t("activityDetail.loading")}</Text>
      ) : null}

      {error != null ? <Text variant="body">{error}</Text> : null}

      {detail != null && transaction != null ? (
        <View style={styles.section}>
          <Text variant="title">
            {detail.direction === "received" ? "+" : "-"}
            {t("activityDetail.amountSats", {
              amount: formatSats(detail.amountSats),
            })}
          </Text>

          <DetailRow
            label={t("activityDetail.direction")}
            value={directionLabel}
          />
          {isArkReceivePendingButSpendable(transaction) ? (
            <View style={styles.statusRow}>
              <Text muted variant="caption">
                {t("activityDetail.status")}
              </Text>
              <Text variant="body">
                {t("activityDetail.pendingPreconfirmed")}
              </Text>
            </View>
          ) : (
            <DetailRow
              label={t("activityDetail.status")}
              value={formatActivityStatusLabel(detail.status, t)}
            />
          )}
          <DetailRow
            label={t("activityDetail.date")}
            value={formatActivityTimestamp(detail.timestamp, t)}
          />
          <DetailRow
            label={t("activityDetail.protocol")}
            value={t("activity.protocolArk")}
          />
          <DetailRow label={t("activityDetail.type")} value={txTypeLabel} />

          {transaction.key.boardingTxid.length > 0 ? (
            <DetailRow
              actionsValue={transaction.key.boardingTxid}
              label={t("activityDetail.boardingTxid")}
              value={truncateMiddle(transaction.key.boardingTxid)}
            />
          ) : null}

          {transaction.key.commitmentTxid.length > 0 ? (
            <DetailRow
              actionsValue={transaction.key.commitmentTxid}
              label={t("activityDetail.commitmentTxid")}
              value={truncateMiddle(transaction.key.commitmentTxid)}
            />
          ) : null}

          {transaction.key.arkTxid.length > 0 ? (
            <DetailRow
              actionsValue={transaction.key.arkTxid}
              label={t("activityDetail.arkTxid")}
              value={truncateMiddle(transaction.key.arkTxid)}
            />
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
};

export default ArkActivityDetailScreen;

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  statusRow: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
});
