import { TxType, type ArkTransaction, type VirtualCoin } from "@arkade-os/sdk";

type ResolveArkSentAmountSatsOptions = {
  overrides?: ReadonlyMap<string, number>;
  vtxos?: VirtualCoin[];
};

const deriveSentAmountFromVtxos = (
  arkTxid: string,
  vtxos: VirtualCoin[],
): number | null => {
  const spentVtxos = vtxos.filter((vtxo) => {
    return vtxo.arkTxId === arkTxid;
  });
  const outputVtxos = vtxos.filter((vtxo) => {
    return vtxo.txid === arkTxid;
  });

  if (spentVtxos.length === 0 || outputVtxos.length === 0) {
    return null;
  }

  const spentAmount = spentVtxos.reduce((sum, vtxo) => {
    return sum + vtxo.value;
  }, 0);
  const maxOutput = outputVtxos.reduce((max, vtxo) => {
    return Math.max(max, vtxo.value);
  }, 0);
  const derived = spentAmount - maxOutput;

  if (derived > 0) {
    return derived;
  }

  const minOutput = outputVtxos.reduce((min, vtxo) => {
    return Math.min(min, vtxo.value);
  }, Number.POSITIVE_INFINITY);

  if (Number.isFinite(minOutput) && minOutput > 0) {
    return minOutput;
  }

  return null;
};

export const resolveArkSentAmountSats = (
  tx: ArkTransaction,
  options?: ResolveArkSentAmountSatsOptions,
): number => {
  if (tx.type !== TxType.TxSent) {
    return tx.amount;
  }

  if (tx.amount > 0) {
    return tx.amount;
  }

  const arkTxid = tx.key.arkTxid;

  if (arkTxid.length > 0) {
    const override = options?.overrides?.get(arkTxid);

    if (override != null && override > 0) {
      return override;
    }

    const vtxos = options?.vtxos;

    if (vtxos != null && vtxos.length > 0) {
      const derived = deriveSentAmountFromVtxos(arkTxid, vtxos);

      if (derived != null && derived > 0) {
        return derived;
      }
    }
  }

  return tx.amount;
};
