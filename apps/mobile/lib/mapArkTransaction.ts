import { TxType, type ArkTransaction, type VirtualCoin } from "@arkade-os/sdk";

import type { ActivityItem } from "@/lib/activityTypes";
import { buildActivityId } from "@/lib/buildActivityId";
import { resolveArkSentAmountSats } from "@/lib/resolveArkSentAmountSats";

type MapArkTransactionToActivityOptions = {
  overrides?: ReadonlyMap<string, number>;
  vtxos?: VirtualCoin[];
};

export const mapArkTransactionToActivity = (
  tx: ArkTransaction,
  options?: MapArkTransactionToActivityOptions,
): ActivityItem => {
  return {
    id: buildActivityId(tx),
    direction: tx.type === TxType.TxReceived ? "received" : "sent",
    amountSats: resolveArkSentAmountSats(tx, options),
    timestamp: tx.createdAt,
    status: tx.settled ? "confirmed" : "pending",
    protocol: "ark",
  };
};
