import type { VirtualCoin } from "@arkade-os/sdk";

import type { IndexerSubscriptionVtxo } from "./indexerSubscriptionTypes.js";

export const mapIndexerSubscriptionVtxo = (
  vtxo: VirtualCoin,
): IndexerSubscriptionVtxo => {
  return {
    txid: vtxo.txid,
    vout: vtxo.vout,
    value: vtxo.value,
    script: vtxo.script,
    arkTxId: vtxo.arkTxId,
    assets: vtxo.assets ?? [],
    createdAt: vtxo.createdAt,
    isSpent: vtxo.isSpent,
    isUnrolled: vtxo.isUnrolled,
    settledBy: vtxo.settledBy,
    spentBy: vtxo.spentBy,
    status: {
      confirmed: vtxo.status.confirmed,
      isLeaf: vtxo.status.isLeaf,
      block_height: vtxo.status.block_height,
      block_hash: vtxo.status.block_hash,
      block_time: vtxo.status.block_time,
    },
    virtualStatus: {
      state: vtxo.virtualStatus.state,
      commitmentTxIds: vtxo.virtualStatus.commitmentTxIds,
      batchExpiry: vtxo.virtualStatus.batchExpiry,
    },
  };
};
