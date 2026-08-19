import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatBtcAmount,
  formatBtcPaymentUri,
} from "@/lib/formatBtcPaymentUri";

describe("formatBtcAmount", () => {
  it("formats sats as an exact eight-decimal BTC amount", () => {
    assert.equal(formatBtcAmount(10_328), "0.00010328");
    assert.equal(formatBtcAmount(100_000_000), "1.00000000");
  });
});

describe("formatBtcPaymentUri", () => {
  it("encodes the exact recipient-output amount in a BIP21 URI", () => {
    assert.equal(
      formatBtcPaymentUri({
        address: "bc1qexample",
        amountSats: 10_328,
      }),
      "bitcoin:bc1qexample?amount=0.00010328",
    );
  });
});
