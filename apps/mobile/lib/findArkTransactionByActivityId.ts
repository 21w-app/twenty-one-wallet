import type { ArkTransaction } from "@arkade-os/sdk";

import { buildActivityId } from "@/lib/buildActivityId";

export const findArkTransactionByActivityId = (
  transactions: ArkTransaction[],
  activityId: string,
): ArkTransaction | null => {
  const exactMatch = transactions.find((transaction) => {
    return buildActivityId(transaction) === activityId;
  });

  if (exactMatch != null) {
    return exactMatch;
  }

  const arkTxidMatch = transactions.find((transaction) => {
    return transaction.key.arkTxid === activityId;
  });

  return arkTxidMatch ?? null;
};
