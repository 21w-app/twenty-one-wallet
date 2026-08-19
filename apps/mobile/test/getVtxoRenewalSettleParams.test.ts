import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { ExtendedVirtualCoin, FeeInfo } from "@arkade-os/sdk";

import { getVtxoRenewalSettleParams } from "@/lib/getVtxoRenewalSettleParams";

const ARK_ADDRESS =
  "ark1qzpq904am6clw3pgqwyh4p02708fy4xs0hcpwt7rwfdttuxsjameeq5ydpgnhyjuyzeun9sycc5gek0d0a4yphmje25s9lwqdfafk0027450qg";

const createFees = (intentFee: FeeInfo["intentFee"] = {}): FeeInfo => {
  return {
    intentFee,
    txFeeRate: "1",
  };
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

describe("getVtxoRenewalSettleParams", () => {
  test("keeps the full input sum when Ark fees are zero", () => {
    const vtxos = [createVtxo("a", 1_000), createVtxo("b", 500)];

    const params = getVtxoRenewalSettleParams(
      vtxos,
      ARK_ADDRESS,
      createFees(),
      330n,
    );

    assert.deepEqual(
      params.inputs.map((vtxo) => {
        return vtxo.txid;
      }),
      ["a", "b"],
    );
    assert.equal(params.outputAmountSats, 1_500n);
  });

  test("deducts offchain input and output fees like the SDK renewal path", () => {
    const vtxos = [createVtxo("a", 1_000), createVtxo("b", 500)];

    const params = getVtxoRenewalSettleParams(
      vtxos,
      ARK_ADDRESS,
      createFees({
        offchainInput: "10.0",
        offchainOutput: "20.0",
      }),
      330n,
    );

    assert.equal(params.outputAmountSats, 1_500n - 10n - 10n - 20n);
  });

  test("skips VTXOs whose input fee consumes the whole coin", () => {
    const vtxos = [createVtxo("dust", 5), createVtxo("ok", 1_000)];

    const params = getVtxoRenewalSettleParams(
      vtxos,
      ARK_ADDRESS,
      createFees({
        offchainInput: "10.0",
      }),
      330n,
    );

    assert.deepEqual(
      params.inputs.map((vtxo) => {
        return vtxo.txid;
      }),
      ["ok"],
    );
    assert.equal(params.outputAmountSats, 990n);
  });
});
