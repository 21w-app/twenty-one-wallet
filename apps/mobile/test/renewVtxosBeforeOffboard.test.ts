import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { ExtendedVirtualCoin, Wallet } from "@arkade-os/sdk";

import { renewVtxosBeforeOffboard } from "@/lib/renewVtxosBeforeOffboard";

const ARK_ADDRESS =
  "ark1qzpq904am6clw3pgqwyh4p02708fy4xs0hcpwt7rwfdttuxsjameeq5ydpgnhyjuyzeun9sycc5gek0d0a4yphmje25s9lwqdfafk0027450qg";

type FakeWalletOptions = {
  vtxos: ExtendedVirtualCoin[];
};

const createVtxo = (txid: string, value: number): ExtendedVirtualCoin => {
  return {
    txid,
    vout: 0,
    value,
    createdAt: new Date("2026-08-18T00:00:00.000Z"),
    virtualStatus: { state: "settled" },
  } as ExtendedVirtualCoin;
};

const createFakeWallet = ({ vtxos }: FakeWalletOptions) => {
  const calls: string[] = [];
  let settleParams: unknown;

  const wallet = {
    arkProvider: {
      getInfo: async () => {
        calls.push("getInfo");
        return {
          dust: 330n,
          fees: {
            intentFee: {},
            txFeeRate: "1",
          },
        };
      },
    },
    getAddress: async () => {
      calls.push("getAddress");
      return ARK_ADDRESS;
    },
    getBalance: async () => {
      calls.push("getBalance");
    },
    getVtxos: async (filter?: unknown) => {
      calls.push(`getVtxos:${JSON.stringify(filter)}`);
      return vtxos;
    },
    settle: async (params?: unknown) => {
      calls.push("settle");
      settleParams = params;
      return "renewal-txid";
    },
  } as unknown as Wallet;

  return {
    calls,
    getSettleParams: () => {
      return settleParams;
    },
    wallet,
  };
};

describe("renewVtxosBeforeOffboard", () => {
  test("skips settle when there are no spendable VTXOs", async () => {
    const fake = createFakeWallet({ vtxos: [] });

    const result = await renewVtxosBeforeOffboard(fake.wallet);

    assert.deepEqual(result, {
      renewed: false,
      expiringVtxoCount: 0,
      renewalTxid: null,
      vtxoTxids: [],
    });
    assert.equal(fake.calls.includes("settle"), false);
    assert.deepEqual(fake.calls, [
      'getVtxos:{"withRecoverable":true,"withUnrolled":false}',
    ]);
  });

  test("settles spendable VTXOs to the wallet Ark address then refreshes", async () => {
    const vtxos = [createVtxo("vtxo-a", 1_000), createVtxo("vtxo-b", 500)];
    const fake = createFakeWallet({ vtxos });

    const result = await renewVtxosBeforeOffboard(fake.wallet);

    assert.deepEqual(result, {
      renewed: true,
      expiringVtxoCount: 2,
      renewalTxid: "renewal-txid",
      vtxoTxids: ["vtxo-a", "vtxo-b"],
    });
    assert.deepEqual(fake.getSettleParams(), {
      inputs: vtxos,
      outputs: [
        {
          address: ARK_ADDRESS,
          amount: 1_500n,
        },
      ],
    });
    assert.deepEqual(fake.calls, [
      'getVtxos:{"withRecoverable":true,"withUnrolled":false}',
      "getAddress",
      "getInfo",
      "settle",
      "getBalance",
      'getVtxos:{"withRecoverable":true,"withUnrolled":false}',
    ]);
  });
});
