import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import type { Env } from "../lib/env.js";
import { prisma } from "../lib/prisma.js";
import { parseFundsCursor } from "../services/fetchIndexerVtxos.js";
import { handleSubscriptionNewVtxos } from "../services/handleSubscriptionNewVtxos.js";

const hasDatabaseUrl = (): boolean => {
  const databaseUrl = process.env.DATABASE_URL;

  return databaseUrl != null && databaseUrl.trim().length > 0;
};

const hasCurrentWalletSchema = async (): Promise<boolean> => {
  const rows = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'ArkWallet'
        AND column_name = 'signer_taproot_address'
    ) AS exists
  `;

  return rows[0]?.exists === true;
};

const testEnv: Env = {
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://test",
  port: 3000,
  nodeEnv: "test",
  minSupportedAppVersion: "1.0.0",
  minIosBuild: "10",
  minAndroidBuild: null,
  iosStoreUrl: "https://apps.apple.com/app/example",
  androidStoreUrl: null,
  updateMessage: "Please update",
  arkIndexerUrl: "https://arkade.computer",
  expoAccessToken: null,
  vtxoExpiryPollIntervalMs: 3_600_000,
  vtxoReminderCooldownMs: 86_400_000,
  challengeTtlSeconds: 300,
  workersEnabled: false,
  vtxoExpiryWorkerEnabled: false,
};

const insertWalletWithDevice = async ({
  scriptHex,
  cursor,
}: {
  scriptHex: string;
  cursor: string | null;
}) => {
  await prisma.arkWallet.create({
    data: {
      vtxo_script_hex: scriptHex,
      ark_static_address: `ark-${scriptHex}`,
      signer_taproot_address: `signer-${scriptHex}`,
      last_funds_cursor: cursor,
      devices: {
        create: {
          expo_push_token: `ExponentPushToken[${scriptHex}]`,
          platform: "ios",
        },
      },
    },
  });
};

const withFetchSpy = async (
  callback: (calls: unknown[][]) => Promise<void>,
): Promise<void> => {
  const originalFetch = globalThis.fetch;
  const calls: unknown[][] = [];

  globalThis.fetch = (async (...args: Parameters<typeof fetch>) => {
    calls.push(args);

    return new Response(JSON.stringify({ data: [{ status: "ok" }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  try {
    await callback(calls);
  } finally {
    globalThis.fetch = originalFetch;
  }
};

test("subscription suppresses push for duplicate outpoint", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is required for database integration tests");
    return;
  }

  if (!(await hasCurrentWalletSchema())) {
    t.skip("current ArkWallet schema is required for subscription tests");
    return;
  }

  const scriptHex = `script-${crypto.randomUUID()}`;
  const txid =
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const cursor = JSON.stringify({
    outpoints: [`${txid}:1`],
  });

  await insertWalletWithDevice({ scriptHex, cursor });

  try {
    await withFetchSpy(async (calls) => {
      await handleSubscriptionNewVtxos(testEnv, [
        { script: scriptHex, txid, vout: 1 },
      ]);

      assert.equal(calls.length, 0);
    });
  } finally {
    await prisma.arkWallet.deleteMany({
      where: { vtxo_script_hex: scriptHex },
    });
  }
});

test("subscription sends push only to active device rows", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is required for database integration tests");
    return;
  }

  if (!(await hasCurrentWalletSchema())) {
    t.skip("current ArkWallet schema is required for subscription tests");
    return;
  }

  const scriptHex = `script-${crypto.randomUUID()}`;
  const txid =
    "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  const arkTxId =
    "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

  await prisma.arkWallet.create({
    data: {
      vtxo_script_hex: scriptHex,
      ark_static_address: `ark-${scriptHex}`,
      signer_taproot_address: `signer-${scriptHex}`,
      devices: {
        create: [
          {
            expo_push_token: "ExponentPushToken[active]",
            platform: "ios",
          },
          {
            expo_push_token: "ExponentPushToken[revoked]",
            platform: "android",
            revoked_at: new Date(),
          },
        ],
      },
    },
  });

  try {
    await withFetchSpy(async (calls) => {
      await handleSubscriptionNewVtxos(
        testEnv,
        [{ script: scriptHex, txid, vout: 0, arkTxId }],
        {},
      );

      assert.equal(calls.length, 1);

      const requestInit = calls[0]?.[1] as RequestInit | undefined;
      const body =
        typeof requestInit?.body === "string"
          ? JSON.parse(requestInit.body)
          : null;

      assert.ok(Array.isArray(body));
      assert.deepEqual(
        body.map((message: { to: string }) => {
          return message.to;
        }),
        ["ExponentPushToken[active]"],
      );

      const pushData = body[0]?.data as Record<string, string> | undefined;

      assert.deepEqual(pushData, {
        type: "incoming_funds",
        vtxo_txid: txid,
        vtxo_vout: "0",
        txid: arkTxId,
        ark_tx_id: arkTxId,
      });
    });

    const wallet = await prisma.arkWallet.findUniqueOrThrow({
      where: { vtxo_script_hex: scriptHex },
      select: { last_funds_cursor: true },
    });
    const keys = parseFundsCursor(wallet.last_funds_cursor);

    assert.equal(keys.has(`${txid}:0`), true);
  } finally {
    await prisma.arkWallet.deleteMany({
      where: { vtxo_script_hex: scriptHex },
    });
  }
});
