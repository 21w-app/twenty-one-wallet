import { TxType, type ArkTransaction } from "@arkade-os/sdk";

export const isArkReceivePendingButSpendable = (
  tx: ArkTransaction,
): boolean => {
  if (tx.type !== TxType.TxReceived) {
    return false;
  }

  if (tx.settled) {
    return false;
  }

  return tx.key.arkTxid.length > 0;
};
