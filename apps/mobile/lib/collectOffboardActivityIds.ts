import type { SentTransaction } from "@/lib/sentArkTransactions";

export const collectOffboardActivityIds = (
  sentTransactions: SentTransaction[],
  durableOffboardTxids: readonly string[] = [],
): Set<string> => {
  return new Set([
    ...durableOffboardTxids,
    ...sentTransactions.flatMap((entry) => {
      if (entry.offboard !== true) {
        return [];
      }

      return [entry.txid];
    }),
  ]);
};
