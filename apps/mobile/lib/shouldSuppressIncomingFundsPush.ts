import { hasPendingTransaction } from "@/lib/pendingTransaction";
import { hasRecordedSentTransaction } from "@/lib/sentArkTransactions";

export const readTxidFromPushData = (
  data: Record<string, unknown>,
): string | null => {
  const txid = data.txid;

  if (typeof txid === "string" && txid.length > 0) {
    return txid;
  }

  const legacyArkTxId = data.ark_tx_id;

  if (typeof legacyArkTxId === "string" && legacyArkTxId.length > 0) {
    return legacyArkTxId;
  }

  return null;
};

export const isIncomingFundsPushData = (
  data: Record<string, unknown>,
): boolean => {
  return data.type === "incoming_funds";
};

type ShouldSuppressIncomingFundsPushInput = {
  txid: string | null;
};

export const shouldSuppressIncomingFundsPush = async ({
  txid,
}: ShouldSuppressIncomingFundsPushInput): Promise<boolean> => {
  if (hasPendingTransaction()) {
    return true;
  }

  if (txid == null) {
    return false;
  }

  return hasRecordedSentTransaction(txid);
};
