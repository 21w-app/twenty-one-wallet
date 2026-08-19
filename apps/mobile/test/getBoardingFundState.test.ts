import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  clearConfirmedBoardingFundState,
  toBoardingFundState,
} from "@/lib/getBoardingFundState";

const createUtxo = (
  txid: string,
  options: { confirmed: boolean; value: number },
) => {
  return {
    txid,
    value: options.value,
    status: { confirmed: options.confirmed },
  };
};

describe("toBoardingFundState", () => {
  test("treats confirmed boarding UTXOs as ready to settle", () => {
    const state = toBoardingFundState(
      [
        createUtxo("confirmed", { confirmed: true, value: 12_000 }),
        createUtxo("pending", { confirmed: false, value: 8_000 }),
      ],
      new Set(),
    );

    assert.equal(state.canOnboard, true);
    assert.equal(state.confirmedSats, 12_000);
    assert.equal(state.unconfirmedSats, 8_000);
    assert.equal(state.totalBoardingSats, 20_000);
    assert.equal(state.confirmedUtxoCount, 1);
  });

  test("hides settled boarding UTXOs after onboard", () => {
    const state = toBoardingFundState(
      [createUtxo("settled", { confirmed: true, value: 12_000 })],
      new Set(["settled"]),
    );

    assert.equal(state.canOnboard, false);
    assert.equal(state.confirmedSats, 0);
    assert.equal(state.confirmedUtxoCount, 0);
    assert.equal(state.totalBoardingSats, 0);
  });

  test("clears confirmed boarding after settle so the fund widget can hide", () => {
    const state = clearConfirmedBoardingFundState({
      confirmedSats: 12_000,
      unconfirmedSats: 3_000,
      totalBoardingSats: 15_000,
      confirmedUtxoCount: 1,
      canOnboard: true,
    });

    assert.equal(state.canOnboard, false);
    assert.equal(state.confirmedSats, 0);
    assert.equal(state.confirmedUtxoCount, 0);
    assert.equal(state.unconfirmedSats, 3_000);
    assert.equal(state.totalBoardingSats, 3_000);
  });
});
