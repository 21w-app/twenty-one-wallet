export type IndexerVtxoStatus = {
  confirmed: boolean;
  isLeaf?: boolean;
  block_height?: number;
  block_hash?: string;
  block_time?: number;
};

export type IndexerVirtualStatusState =
  | "preconfirmed"
  | "settled"
  | "swept"
  | "spent";

export type IndexerVirtualStatus = {
  state: IndexerVirtualStatusState;
  commitmentTxIds?: string[];
  batchExpiry?: number;
};

/** Virtual output shape from indexer script subscription events (SDK `VirtualCoin`). */
export type IndexerSubscriptionVtxo = {
  txid: string;
  vout: number;
  value: number;
  script: string;
  arkTxId?: string;
  assets: unknown[];
  createdAt: Date;
  isSpent?: boolean;
  isUnrolled: boolean;
  settledBy?: string;
  spentBy?: string;
  status: IndexerVtxoStatus;
  virtualStatus: IndexerVirtualStatus;
};

export type IndexerCheckpointTx = {
  tx: string;
  txid: string;
};

/** Subscription event envelope from indexer script subscription SSE. */
export type IndexerSubscriptionUpdate = {
  txid?: string;
  scripts: string[];
  newVtxos: IndexerSubscriptionVtxo[];
  spentVtxos: IndexerSubscriptionVtxo[];
  sweptVtxos: IndexerSubscriptionVtxo[];
  tx?: string;
  checkpointTxs?: Record<string, IndexerCheckpointTx>;
};
