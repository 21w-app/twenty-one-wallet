import type { Coin } from "@arkade-os/sdk";

import type { ActivityItem } from "@/lib/activityTypes";

export const BOARDING_ACTIVITY_ID_PREFIX = "boarding-";

export const buildBoardingActivityId = (utxo: Pick<Coin, "txid" | "vout">) => {
  return `${BOARDING_ACTIVITY_ID_PREFIX}${utxo.txid}:${utxo.vout}`;
};

export const mapBoardingUtxosToActivity = (
  boardingUtxos: Coin[],
  historyBoardingTxids: ReadonlySet<string>,
): ActivityItem[] => {
  return boardingUtxos.flatMap((utxo) => {
    if (historyBoardingTxids.has(utxo.txid)) {
      return [];
    }

    const blockTimeSeconds = utxo.status.block_time;
    const timestamp =
      blockTimeSeconds != null && blockTimeSeconds > 0
        ? blockTimeSeconds * 1000
        : Date.now();

    return [
      {
        id: buildBoardingActivityId(utxo),
        direction: "received",
        amountSats: utxo.value,
        timestamp,
        status: "pending",
        protocol: "ark",
        ramp: "fund",
      },
    ];
  });
};
