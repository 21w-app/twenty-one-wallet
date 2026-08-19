import type { SubscriptionVtxo } from "../services/handleSubscriptionNewVtxos.js";

type BuildIncomingFundsPushDataInput = {
  vtxo: SubscriptionVtxo;
  subscriptionTxid?: string;
};

const resolvePushTxid = (
  vtxo: SubscriptionVtxo,
  subscriptionTxid?: string,
): string | null => {
  if (vtxo.arkTxId != null && vtxo.arkTxId.length > 0) {
    return vtxo.arkTxId;
  }

  if (subscriptionTxid != null && subscriptionTxid.length > 0) {
    return subscriptionTxid;
  }

  return null;
};

export const buildIncomingFundsPushData = ({
  vtxo,
  subscriptionTxid,
}: BuildIncomingFundsPushDataInput): Record<string, string> => {
  const data: Record<string, string> = {
    type: "incoming_funds",
    vtxo_txid: vtxo.txid,
    vtxo_vout: String(vtxo.vout),
  };

  const txid = resolvePushTxid(vtxo, subscriptionTxid);

  if (txid != null) {
    data.txid = txid;
    // Legacy field for mobile builds shipped before TASK-112.
    data.ark_tx_id = txid;
  }

  return data;
};
