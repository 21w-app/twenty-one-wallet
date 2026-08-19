import type { Wallet } from "@arkade-os/sdk";

import { readSettledBoardingTxids } from "@/lib/settledBoardingTxids";

export type BoardingFundState = {
  confirmedSats: number;
  unconfirmedSats: number;
  totalBoardingSats: number;
  confirmedUtxoCount: number;
  canOnboard: boolean;
};

type BoardingUtxoLike = {
  txid: string;
  value: number;
  status: { confirmed: boolean };
};

const sumUtxoValue = (utxos: BoardingUtxoLike[]): number => {
  return utxos.reduce((total, utxo) => {
    return total + utxo.value;
  }, 0);
};

export const toBoardingFundState = (
  boardingUtxos: BoardingUtxoLike[],
  settledTxids: ReadonlySet<string>,
): BoardingFundState => {
  const unsettledUtxos = boardingUtxos.filter((utxo) => {
    return !settledTxids.has(utxo.txid);
  });
  const confirmedUtxos = unsettledUtxos.filter((utxo) => {
    return utxo.status.confirmed;
  });
  const unconfirmedUtxos = unsettledUtxos.filter((utxo) => {
    return !utxo.status.confirmed;
  });
  const confirmedSats = sumUtxoValue(confirmedUtxos);
  const unconfirmedSats = sumUtxoValue(unconfirmedUtxos);

  return {
    confirmedSats,
    unconfirmedSats,
    totalBoardingSats: confirmedSats + unconfirmedSats,
    confirmedUtxoCount: confirmedUtxos.length,
    canOnboard: confirmedUtxos.length > 0,
  };
};

export const clearConfirmedBoardingFundState = (
  state: BoardingFundState,
): BoardingFundState => {
  return {
    ...state,
    canOnboard: false,
    confirmedSats: 0,
    confirmedUtxoCount: 0,
    totalBoardingSats: state.unconfirmedSats,
  };
};

export const getBoardingFundState = async (
  wallet: Wallet,
): Promise<BoardingFundState> => {
  const [boardingUtxos, settledBoardingTxids] = await Promise.all([
    wallet.getBoardingUtxos(),
    readSettledBoardingTxids(),
  ]);

  return toBoardingFundState(boardingUtxos, new Set(settledBoardingTxids));
};
