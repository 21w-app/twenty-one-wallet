import { Ramps, type Wallet } from "@arkade-os/sdk";

import { getArkServerFees } from "@/lib/getArkServerFees";
import { readSettledBoardingTxids } from "@/lib/settledBoardingTxids";

export const getConfirmedBoardingUtxos = <
  TBoardingUtxo extends { status: { confirmed: boolean }; txid: string },
>(
  boardingUtxos: TBoardingUtxo[],
): TBoardingUtxo[] => {
  return boardingUtxos.filter((utxo) => {
    return utxo.status.confirmed;
  });
};

export const getBoardableBoardingUtxos = <
  TBoardingUtxo extends { status: { confirmed: boolean }; txid: string },
>(
  boardingUtxos: TBoardingUtxo[],
  settledTxids: ReadonlySet<string>,
): TBoardingUtxo[] => {
  return getConfirmedBoardingUtxos(boardingUtxos).filter((utxo) => {
    return !settledTxids.has(utxo.txid);
  });
};

export type OnboardBoardingUtxosResult = {
  txid: string;
  boardingTxids: string[];
};

export const onboardBoardingUtxos = async (
  wallet: Wallet,
): Promise<OnboardBoardingUtxosResult> => {
  const [fees, boardingUtxos, settledBoardingTxids] = await Promise.all([
    getArkServerFees(wallet),
    wallet.getBoardingUtxos(),
    readSettledBoardingTxids(),
  ]);
  const boardableBoardingUtxos = getBoardableBoardingUtxos(
    boardingUtxos,
    new Set(settledBoardingTxids),
  );

  if (boardableBoardingUtxos.length === 0) {
    throw new Error("No confirmed boarding UTXOs are ready to onboard");
  }

  const txid = await new Ramps(wallet).onboard(fees, boardableBoardingUtxos);

  return {
    txid,
    boardingTxids: boardableBoardingUtxos.map((utxo) => {
      return utxo.txid;
    }),
  };
};
