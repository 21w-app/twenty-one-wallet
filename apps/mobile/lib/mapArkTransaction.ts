import { TxType, type ArkTransaction, type VirtualCoin } from "@arkade-os/sdk";

import type { ActivityItem } from "@/lib/activityTypes";
import { buildActivityId } from "@/lib/buildActivityId";
import { resolveArkSentAmountSats } from "@/lib/resolveArkSentAmountSats";
import type { SentTransaction } from "@/lib/sentArkTransactions";

const OFFBOARD_FALLBACK_MATCH_WINDOW_MS = 30 * 60 * 1000;

type MapArkTransactionToActivityOptions = {
  overrides?: ReadonlyMap<string, number>;
  vtxos?: VirtualCoin[];
  offboardTxids?: ReadonlySet<string>;
};

const getTransactionIdCandidates = (
  tx: ArkTransaction,
  activityId: string,
): string[] => {
  return [
    activityId,
    tx.key.arkTxid,
    tx.key.commitmentTxid,
    tx.key.boardingTxid,
  ];
};

const hasMatchingOffboardId = (
  tx: ArkTransaction,
  activityId: string,
  offboardTxids?: ReadonlySet<string>,
): boolean => {
  if (offboardTxids == null || offboardTxids.size === 0) {
    return false;
  }

  return getTransactionIdCandidates(tx, activityId).some((candidate) => {
    return candidate.length > 0 && offboardTxids.has(candidate);
  });
};

const isOffboardTransaction = (
  tx: ArkTransaction,
  activityId: string,
  offboardTxids?: ReadonlySet<string>,
): boolean => {
  if (tx.type !== TxType.TxSent) {
    return false;
  }

  return hasMatchingOffboardId(tx, activityId, offboardTxids);
};

type CollectOffboardTransactionIdsOptions =
  MapArkTransactionToActivityOptions & {
    sentTransactions?: SentTransaction[];
  };

export const collectOffboardTransactionIds = (
  transactions: ArkTransaction[],
  options?: CollectOffboardTransactionIdsOptions,
): Set<string> => {
  const offboardTxids = new Set(options?.offboardTxids ?? []);
  const sentTransactions = options?.sentTransactions ?? [];

  if (sentTransactions.length === 0) {
    return offboardTxids;
  }

  for (const entry of sentTransactions) {
    if (entry.offboard !== true || entry.amountSats == null) {
      continue;
    }

    const candidates = transactions
      .flatMap((tx) => {
        const activityId = buildActivityId(tx);

        if (
          tx.type !== TxType.TxSent ||
          hasMatchingOffboardId(tx, activityId, offboardTxids)
        ) {
          return [];
        }

        const amountSats = resolveArkSentAmountSats(tx, options);

        if (amountSats !== entry.amountSats) {
          return [];
        }

        const deltaMs = Math.abs(tx.createdAt - entry.sentAt);

        if (deltaMs > OFFBOARD_FALLBACK_MATCH_WINDOW_MS) {
          return [];
        }

        return [{ activityId, deltaMs }];
      })
      .sort((left, right) => {
        return left.deltaMs - right.deltaMs;
      });

    if (
      candidates.length > 0 &&
      (candidates[1] == null || candidates[0].deltaMs < candidates[1].deltaMs)
    ) {
      offboardTxids.add(candidates[0].activityId);
    }
  }

  return offboardTxids;
};

export const mapArkTransactionToActivity = (
  tx: ArkTransaction,
  options?: MapArkTransactionToActivityOptions,
): ActivityItem => {
  const activityId = buildActivityId(tx);
  const direction = tx.type === TxType.TxReceived ? "received" : "sent";
  const isFund = direction === "received" && tx.key.boardingTxid.length > 0;
  const amountSats = resolveArkSentAmountSats(tx, options);
  const isWithdraw = isOffboardTransaction(
    tx,
    activityId,
    options?.offboardTxids,
  );

  return {
    id: activityId,
    direction,
    amountSats,
    timestamp: tx.createdAt,
    status: tx.settled ? "confirmed" : "pending",
    protocol: "ark",
    ramp: isWithdraw ? "withdraw" : isFund ? "fund" : undefined,
  };
};
