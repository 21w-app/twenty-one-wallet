// Activity boarding-UTXO dedupe only. Do not use this skip set for settle or fund state:
// Ark history already includes the live boarding deposit before Ramps.onboard.
export const collectBoardingTxidsToSkip = (
  history: readonly { key: { boardingTxid: string } }[],
  settledTxids: readonly string[] = [],
): Set<string> => {
  return new Set([
    ...settledTxids,
    ...history.flatMap((tx) => {
      if (tx.key.boardingTxid.length === 0) {
        return [];
      }

      return [tx.key.boardingTxid];
    }),
  ]);
};
