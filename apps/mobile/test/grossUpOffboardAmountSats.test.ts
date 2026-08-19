import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { Estimator, networks, type FeeInfo } from "@arkade-os/sdk";
import { hex } from "@scure/base";
import { Address, OutScript } from "@scure/btc-signer";

import { grossUpOffboardAmountSats } from "@/lib/grossUpOffboardAmountSats";

const DESTINATION_ADDRESS = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";
const NET_AMOUNT_SATS = 10_000;

const createFees = (onchainOutput?: string): FeeInfo => {
  return {
    intentFee: onchainOutput == null ? {} : { onchainOutput },
    txFeeRate: "1",
  };
};

const destinationAfterSdkFee = (fees: FeeInfo, spendAmountSats: number) => {
  const script = hex.encode(
    OutScript.encode(Address(networks.bitcoin).decode(DESTINATION_ADDRESS)),
  );
  const outputFeeSats = new Estimator(fees.intentFee).evalOnchainOutput({
    amount: BigInt(spendAmountSats),
    script,
  }).satoshis;

  return spendAmountSats - outputFeeSats;
};

describe("grossUpOffboardAmountSats", () => {
  test("keeps the requested amount when there is no on-chain output fee", () => {
    const fees = createFees();

    const spendAmountSats = grossUpOffboardAmountSats(
      DESTINATION_ADDRESS,
      fees,
      NET_AMOUNT_SATS,
    );

    assert.equal(spendAmountSats, NET_AMOUNT_SATS);
    assert.equal(
      destinationAfterSdkFee(fees, spendAmountSats),
      NET_AMOUNT_SATS,
    );
  });

  test("adds a constant on-chain output fee so the destination receives the requested sats", () => {
    const fees = createFees("250.0");

    const spendAmountSats = grossUpOffboardAmountSats(
      DESTINATION_ADDRESS,
      fees,
      NET_AMOUNT_SATS,
    );

    assert.equal(spendAmountSats, NET_AMOUNT_SATS + 250);
    assert.equal(
      destinationAfterSdkFee(fees, spendAmountSats),
      NET_AMOUNT_SATS,
    );
  });

  test("converges when the output fee depends on the offboard amount", () => {
    const fees = createFees("amount * 0.01");

    const spendAmountSats = grossUpOffboardAmountSats(
      DESTINATION_ADDRESS,
      fees,
      NET_AMOUNT_SATS,
    );

    assert.equal(
      destinationAfterSdkFee(fees, spendAmountSats),
      NET_AMOUNT_SATS,
    );
  });
});
