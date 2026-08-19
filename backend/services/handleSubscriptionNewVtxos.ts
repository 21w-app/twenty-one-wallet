import type { Env } from "../lib/env.js";
import { buildIncomingFundsPushData } from "../lib/buildIncomingFundsPushData.js";
import { outpointKey } from "../lib/outpointKey.js";
import { prisma } from "../lib/prisma.js";
import { mergeFundsCursor } from "./fundsCursorStore.js";
import { sendExpoPush } from "./sendExpoPush.js";

export type SubscriptionVtxo = {
  script: string;
  txid: string;
  vout: number;
  arkTxId?: string;
};

type HandleSubscriptionNewVtxosOptions = {
  subscriptionTxid?: string;
};

export const handleSubscriptionNewVtxos = async (
  env: Env,
  newVtxos: SubscriptionVtxo[],
  options: HandleSubscriptionNewVtxosOptions = {},
): Promise<void> => {
  if (newVtxos.length === 0) {
    return;
  }

  const byScript = new Map<string, SubscriptionVtxo[]>();

  for (const vtxo of newVtxos) {
    const existing = byScript.get(vtxo.script) ?? [];
    existing.push(vtxo);
    byScript.set(vtxo.script, existing);
  }

  for (const [scriptHex, scriptVtxos] of byScript) {
    try {
      await handleWalletNewVtxos(
        env,
        scriptHex,
        scriptVtxos,
        options.subscriptionTxid,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown error";
      console.warn(`incoming funds event failed for ${scriptHex}: ${message}`);
    }
  }
};

const handleWalletNewVtxos = async (
  env: Env,
  scriptHex: string,
  scriptVtxos: SubscriptionVtxo[],
  subscriptionTxid?: string,
): Promise<void> => {
  const wallet = await prisma.arkWallet.findFirst({
    where: {
      vtxo_script_hex: scriptHex,
      devices: {
        some: {
          revoked_at: null,
        },
      },
    },
    include: {
      devices: {
        where: {
          revoked_at: null,
        },
      },
    },
  });

  if (wallet == null) {
    return;
  }

  const now = new Date();
  let pushableFreshVtxos: SubscriptionVtxo[] = [];

  await mergeFundsCursor({
    vtxoScriptHex: scriptHex,
    now,
    merge: (knownKeys) => {
      pushableFreshVtxos = scriptVtxos.filter((vtxo) => {
        const key = outpointKey({ txid: vtxo.txid, vout: vtxo.vout });
        return !knownKeys.has(key);
      });

      for (const vtxo of scriptVtxos) {
        knownKeys.add(outpointKey({ txid: vtxo.txid, vout: vtxo.vout }));
      }
    },
  });

  if (pushableFreshVtxos.length === 0) {
    return;
  }

  const tokens = wallet.devices.map((device) => {
    return device.expo_push_token;
  });
  const primaryVtxo = pushableFreshVtxos[pushableFreshVtxos.length - 1];
  const pushData = buildIncomingFundsPushData({
    vtxo: primaryVtxo,
    subscriptionTxid,
  });

  await sendExpoPush(
    env,
    tokens.map((token) => {
      return {
        to: token,
        title: "Bitcoin received",
        body: "You received funds in your 21W wallet.",
        data: pushData,
      };
    }),
  );
};
