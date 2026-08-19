import type { ArkTransaction } from "@arkade-os/sdk";

export const buildActivityId = (tx: ArkTransaction): string => {
  const { arkTxid, commitmentTxid, boardingTxid } = tx.key;
  const parts = [boardingTxid, commitmentTxid, arkTxid].filter((part) => {
    return part.length > 0;
  });

  if (parts.length > 0) {
    return parts.join(":");
  }

  return `tx-${tx.createdAt}-${tx.amount}`;
};
