import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { ExtendedVirtualCoin, FeeInfo } from "@arkade-os/sdk";

import {
  getOffboardSettleParams,
  ImmatureOffboardVtxosError,
} from "@/lib/getOffboardSettleParams";

const ARK_ADDRESS =
  "ark1qzpq904am6clw3pgqwyh4p02708fy4xs0hcpwt7rwfdttuxsjameeq5ydpgnhyjuyzeun9sycc5gek0d0a4yphmje25s9lwqdfafk0027450qg";
const BTC_ADDRESS = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";
const NOW_MS = new Date("2026-08-19T12:00:00.000Z").getTime();

const createFees = (intentFee: FeeInfo["intentFee"] = {}): FeeInfo => {
  return {
    intentFee,
    txFeeRate: "1",
  };
};

const createVtxo = ({
  expiryMs,
  txid,
  value,
}: {
  expiryMs: number;
  txid: string;
  value: number;
}): ExtendedVirtualCoin => {
  return {
    txid,
    vout: 0,
    value,
    createdAt: new Date("2026-08-18T00:00:00.000Z"),
    virtualStatus: {
      batchExpiry: expiryMs,
      state: "settled",
    },
  } as ExtendedVirtualCoin;
};

describe("getOffboardSettleParams", () => {
  test("uses only VTXOs whose expiry is inside the collaborative exit gap", () => {
    const mature = createVtxo({
      expiryMs: NOW_MS + 690 * 60 * 60 * 1000,
      txid: "mature",
      value: 10_000,
    });
    const immature = createVtxo({
      expiryMs: NOW_MS + 720 * 60 * 60 * 1000,
      txid: "immature",
      value: 50_000,
    });

    const { diagnostics, settleParams } = getOffboardSettleParams({
      arkChangeAddress: ARK_ADDRESS,
      destinationAddress: BTC_ADDRESS,
      dustSats: 330n,
      fees: createFees({ onchainOutput: "200.0" }),
      nowMs: NOW_MS,
      requestedAmountSats: 5_000,
      spendAmountSats: 5_200,
      vtxos: [immature, mature],
    });

    assert.deepEqual(
      settleParams.inputs.map((input) => {
        return input.txid;
      }),
      ["mature"],
    );
    assert.equal(diagnostics.immatureVtxoCount, 1);
    assert.equal(diagnostics.selectedInputCount, 1);
    assert.equal(diagnostics.totalVtxoCount, 2);
    assert.deepEqual(settleParams.outputs, [
      {
        address: BTC_ADDRESS,
        amount: 5_000n,
      },
      {
        address: ARK_ADDRESS,
        amount: 4_800n,
      },
    ]);
  });

  test("prioritizes eligible VTXOs by earliest expiry and ignores too-fresh value", () => {
    const laterMature = createVtxo({
      expiryMs: NOW_MS + 694 * 60 * 60 * 1000,
      txid: "later-mature",
      value: 4_000,
    });
    const earliestMature = createVtxo({
      expiryMs: NOW_MS + 680 * 60 * 60 * 1000,
      txid: "earliest-mature",
      value: 3_000,
    });
    const immature = createVtxo({
      expiryMs: NOW_MS + 720 * 60 * 60 * 1000,
      txid: "immature-large",
      value: 50_000,
    });
    const unnecessaryMature = createVtxo({
      expiryMs: NOW_MS + 695 * 60 * 60 * 1000,
      txid: "unnecessary-mature",
      value: 10_000,
    });

    const { diagnostics, settleParams } = getOffboardSettleParams({
      arkChangeAddress: ARK_ADDRESS,
      destinationAddress: BTC_ADDRESS,
      dustSats: 330n,
      fees: createFees({ onchainOutput: "200.0" }),
      nowMs: NOW_MS,
      requestedAmountSats: 5_000,
      spendAmountSats: 5_200,
      vtxos: [laterMature, immature, unnecessaryMature, earliestMature],
    });

    assert.deepEqual(
      settleParams.inputs.map((input) => {
        return input.txid;
      }),
      ["earliest-mature", "later-mature"],
    );
    assert.equal(diagnostics.eligibleBalanceSats, 17_000);
    assert.equal(diagnostics.immatureVtxoCount, 1);
    assert.equal(diagnostics.selectedInputCount, 2);
  });

  test("deducts Ark change output fees before adding change", () => {
    const mature = createVtxo({
      expiryMs: NOW_MS + 690 * 60 * 60 * 1000,
      txid: "mature",
      value: 10_000,
    });

    const { settleParams } = getOffboardSettleParams({
      arkChangeAddress: ARK_ADDRESS,
      destinationAddress: BTC_ADDRESS,
      dustSats: 330n,
      fees: createFees({
        offchainOutput: "100.0",
        onchainOutput: "200.0",
      }),
      nowMs: NOW_MS,
      requestedAmountSats: 5_000,
      spendAmountSats: 5_200,
      vtxos: [mature],
    });

    assert.deepEqual(settleParams.outputs, [
      {
        address: BTC_ADDRESS,
        amount: 5_000n,
      },
      {
        address: ARK_ADDRESS,
        amount: 4_700n,
      },
    ]);
  });

  test("omits Ark change when the fee-adjusted amount is below dust", () => {
    const mature = createVtxo({
      expiryMs: NOW_MS + 690 * 60 * 60 * 1000,
      txid: "mature",
      value: 5_500,
    });

    const { diagnostics, settleParams } = getOffboardSettleParams({
      arkChangeAddress: ARK_ADDRESS,
      destinationAddress: BTC_ADDRESS,
      dustSats: 330n,
      fees: createFees({
        offchainOutput: "100.0",
        onchainOutput: "200.0",
      }),
      nowMs: NOW_MS,
      requestedAmountSats: 5_000,
      spendAmountSats: 5_200,
      vtxos: [mature],
    });

    assert.equal(diagnostics.selectedInputCount, 1);
    assert.deepEqual(settleParams.outputs, [
      {
        address: BTC_ADDRESS,
        amount: 5_000n,
      },
    ]);
  });

  test("reports when enough balance exists only in too-fresh VTXOs", () => {
    const immature = createVtxo({
      expiryMs: NOW_MS + 720 * 60 * 60 * 1000,
      txid: "immature",
      value: 50_000,
    });

    assert.throws(
      () => {
        getOffboardSettleParams({
          arkChangeAddress: ARK_ADDRESS,
          destinationAddress: BTC_ADDRESS,
          dustSats: 330n,
          fees: createFees({ onchainOutput: "200.0" }),
          nowMs: NOW_MS,
          requestedAmountSats: 5_000,
          spendAmountSats: 5_200,
          vtxos: [immature],
        });
      },
      (error) => {
        assert.equal(error instanceof ImmatureOffboardVtxosError, true);

        if (!(error instanceof ImmatureOffboardVtxosError)) {
          return false;
        }

        assert.equal(error.eligibleBalanceSats, 0);
        assert.equal(error.immatureVtxoCount, 1);
        assert.equal(
          error.nextEligibleAt?.toISOString(),
          "2026-08-20T12:00:00.000Z",
        );
        return true;
      },
    );
  });

  test("does not report a wait-state when no immature VTXOs can become eligible", () => {
    const mature = createVtxo({
      expiryMs: NOW_MS + 690 * 60 * 60 * 1000,
      txid: "mature-small",
      value: 5_000,
    });

    assert.throws(
      () => {
        getOffboardSettleParams({
          arkChangeAddress: ARK_ADDRESS,
          destinationAddress: BTC_ADDRESS,
          dustSats: 330n,
          fees: createFees({ onchainOutput: "200.0" }),
          nowMs: NOW_MS,
          requestedAmountSats: 5_000,
          spendAmountSats: 5_200,
          vtxos: [mature],
        });
      },
      (error) => {
        assert.equal(error instanceof ImmatureOffboardVtxosError, false);
        assert.equal(
          error instanceof Error &&
            error.message.includes("No eligible VTXO set can cover withdrawal"),
          true,
        );
        return true;
      },
    );
  });
});
