import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { Coin } from "@arkade-os/sdk";

import { mapBoardingUtxosToActivity } from "@/lib/mapBoardingUtxosToActivity";

const createUtxo = (
  txid: string,
  options?: { confirmed?: boolean; value?: number; vout?: number },
): Coin => {
  return {
    txid,
    vout: options?.vout ?? 0,
    value: options?.value ?? 10_000,
    status: {
      confirmed: options?.confirmed === true,
      block_time: options?.confirmed === true ? 1_700_000_000 : undefined,
    },
  };
};

describe("mapBoardingUtxosToActivity", () => {
  test("maps boarding UTXOs as pending funds", () => {
    const items = mapBoardingUtxosToActivity(
      [createUtxo("abc", { confirmed: false })],
      new Set(),
    );

    assert.equal(items.length, 1);
    assert.equal(items[0]?.id, "boarding-abc:0");
    assert.equal(items[0]?.ramp, "fund");
    assert.equal(items[0]?.status, "pending");
    assert.equal(items[0]?.direction, "received");
    assert.equal(items[0]?.amountSats, 10_000);
  });

  test("skips boarding UTXOs already present in Ark history", () => {
    const items = mapBoardingUtxosToActivity(
      [createUtxo("abc")],
      new Set(["abc"]),
    );

    assert.deepEqual(items, []);
  });
});
