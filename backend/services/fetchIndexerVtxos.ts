import { RestIndexerProvider } from "@arkade-os/sdk";

import type { Env } from "../lib/env.js";
import { outpointKey, type Outpoint } from "../lib/outpointKey.js";

export type IndexerVtxo = {
  outpoint: Outpoint;
  amount: string;
  expiresAtSeconds: bigint | null;
  createdAt: string;
};

const indexerForEnv = (env: Env): RestIndexerProvider => {
  return new RestIndexerProvider(env.arkIndexerUrl);
};

export const fetchSpendableIndexerVtxos = async (
  env: Env,
  vtxoScriptHex: string,
): Promise<IndexerVtxo[]> => {
  const indexer = indexerForEnv(env);
  const { vtxos } = await indexer.getVtxos({
    scripts: [vtxoScriptHex],
    spendableOnly: true,
    pageSize: 100,
  });

  return vtxos.map((vtxo) => {
    const batchExpiryMs = vtxo.virtualStatus.batchExpiry;

    return {
      outpoint: {
        txid: vtxo.txid,
        vout: vtxo.vout,
      },
      amount: String(vtxo.value),
      expiresAtSeconds:
        batchExpiryMs != null ? BigInt(Math.floor(batchExpiryMs / 1000)) : null,
      createdAt: vtxo.createdAt.toISOString(),
    };
  });
};

export const parseFundsCursor = (cursor: string | null): Set<string> => {
  if (cursor == null || cursor.trim().length === 0) {
    return new Set();
  }

  try {
    const parsed = JSON.parse(cursor) as { outpoints?: string[] };

    if (!Array.isArray(parsed.outpoints)) {
      return new Set();
    }

    return new Set(parsed.outpoints);
  } catch {
    return new Set();
  }
};

export const serializeFundsCursor = (outpoints: Iterable<string>): string => {
  return JSON.stringify({ outpoints: Array.from(outpoints) });
};

export const collectOutpointKeys = (vtxos: IndexerVtxo[]): string[] => {
  return vtxos.map((vtxo) => {
    return outpointKey(vtxo.outpoint);
  });
};
