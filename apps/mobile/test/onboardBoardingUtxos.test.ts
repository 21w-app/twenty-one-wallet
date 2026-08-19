import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  getBoardableBoardingUtxos,
  getConfirmedBoardingUtxos,
} from "@/lib/onboardBoardingUtxos";

describe("getConfirmedBoardingUtxos", () => {
  test("keeps only confirmed boarding UTXOs", () => {
    const confirmed = {
      id: "confirmed",
      txid: "confirmed",
      status: { confirmed: true },
    };
    const unconfirmed = {
      id: "unconfirmed",
      txid: "unconfirmed",
      status: { confirmed: false },
    };

    const result = getConfirmedBoardingUtxos([confirmed, unconfirmed]);

    assert.deepEqual(result, [confirmed]);
  });

  test("skips confirmed boarding UTXOs already settled", () => {
    const confirmed = {
      id: "confirmed",
      txid: "confirmed",
      status: { confirmed: true },
    };
    const settled = {
      id: "settled",
      txid: "settled",
      status: { confirmed: true },
    };

    const result = getBoardableBoardingUtxos(
      [confirmed, settled],
      new Set(["settled"]),
    );

    assert.deepEqual(result, [confirmed]);
  });
});
