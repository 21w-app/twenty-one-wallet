import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { Wallet } from "@arkade-os/sdk";

import { settleConfirmedBoardingIfNeeded } from "@/lib/settleConfirmedBoardingIfNeeded";

describe("settleConfirmedBoardingIfNeeded", () => {
  test("does nothing when there are no confirmed boarding UTXOs", async () => {
    const wallet = {
      getBoardingUtxos: async () => {
        return [
          {
            txid: "unconfirmed",
            status: { confirmed: false },
            value: 10_000,
          },
        ];
      },
    } as unknown as Wallet;

    const result = await settleConfirmedBoardingIfNeeded(wallet);

    assert.deepEqual(result, { onboarded: false });
  });
});
