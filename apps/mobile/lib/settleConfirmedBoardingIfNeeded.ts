import type { Wallet } from "@arkade-os/sdk";

import {
  getBoardableBoardingUtxos,
  getConfirmedBoardingUtxos,
  onboardBoardingUtxos,
} from "@/lib/onboardBoardingUtxos";
import {
  readSettledBoardingTxids,
  recordSettledBoardingTxids,
} from "@/lib/settledBoardingTxids";

export type SettleConfirmedBoardingResult =
  | { onboarded: false }
  | { onboarded: true; txid: string; boardingTxids: string[] };

let inFlight: Promise<SettleConfirmedBoardingResult> | null = null;

const settleConfirmedBoarding = async (
  wallet: Wallet,
): Promise<SettleConfirmedBoardingResult> => {
  const boardingUtxos = await wallet.getBoardingUtxos();

  if (getConfirmedBoardingUtxos(boardingUtxos).length === 0) {
    return { onboarded: false };
  }

  const settledBoardingTxids = await readSettledBoardingTxids();
  const boardableBoardingUtxos = getBoardableBoardingUtxos(
    boardingUtxos,
    new Set(settledBoardingTxids),
  );

  if (boardableBoardingUtxos.length === 0) {
    return { onboarded: false };
  }

  const result = await onboardBoardingUtxos(wallet);
  await recordSettledBoardingTxids(result.boardingTxids);

  return {
    onboarded: true,
    txid: result.txid,
    boardingTxids: result.boardingTxids,
  };
};

export const settleConfirmedBoardingIfNeeded = async (
  wallet: Wallet,
): Promise<SettleConfirmedBoardingResult> => {
  if (inFlight != null) {
    return inFlight;
  }

  const run = settleConfirmedBoarding(wallet).finally(() => {
    inFlight = null;
  });

  inFlight = run;

  return run;
};
