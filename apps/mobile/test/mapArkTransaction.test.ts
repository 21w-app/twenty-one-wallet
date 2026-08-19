import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { TxType, type ArkTransaction } from "@arkade-os/sdk";

import {
  collectOffboardTransactionIds,
  mapArkTransactionToActivity,
} from "@/lib/mapArkTransaction";

const createTransaction = ({
  amount = 5_000,
  arkTxid = "ark-txid",
  boardingTxid = "",
  commitmentTxid = "commitment-txid",
  createdAt = 1_800_000_000_000,
  settled = true,
  type = TxType.TxSent,
}: {
  amount?: number;
  arkTxid?: string;
  boardingTxid?: string;
  commitmentTxid?: string;
  createdAt?: number;
  settled?: boolean;
  type?: TxType;
} = {}): ArkTransaction => {
  return {
    amount,
    createdAt,
    key: {
      arkTxid,
      boardingTxid,
      commitmentTxid,
    },
    settled,
    type,
  } as ArkTransaction;
};

describe("mapArkTransactionToActivity", () => {
  test("marks sent transactions as withdrawals when an offboard id matches history", () => {
    const item = mapArkTransactionToActivity(createTransaction(), {
      offboardTxids: new Set(["commitment-txid"]),
    });

    assert.equal(item.ramp, "withdraw");
    assert.equal(item.direction, "sent");
  });

  test("marks recent same-amount offboard transactions as withdrawals when ids differ", () => {
    const createdAt = 1_800_000_000_000;
    const transaction = createTransaction({
      amount: 5_000,
      arkTxid: "history-ark-txid",
      commitmentTxid: "history-commitment-txid",
      createdAt,
    });
    const offboardTxids = collectOffboardTransactionIds([transaction], {
      sentTransactions: [
        {
          amountSats: 5_000,
          offboard: true,
          sentAt: createdAt + 5 * 60 * 1000,
          txid: "submitted-offboard-id",
        },
      ],
    });
    const item = mapArkTransactionToActivity(transaction, { offboardTxids });

    assert.equal(item.ramp, "withdraw");
    assert.equal(item.direction, "sent");
  });

  test("uses one recent offboard marker for only the closest same-amount transaction", () => {
    const sentAt = 1_800_000_000_000;
    const closest = createTransaction({
      amount: 5_000,
      arkTxid: "closest-ark-txid",
      commitmentTxid: "closest-commitment-txid",
      createdAt: sentAt + 2 * 60 * 1000,
    });
    const unrelated = createTransaction({
      amount: 5_000,
      arkTxid: "unrelated-ark-txid",
      commitmentTxid: "unrelated-commitment-txid",
      createdAt: sentAt + 10 * 60 * 1000,
    });
    const offboardTxids = collectOffboardTransactionIds([unrelated, closest], {
      sentTransactions: [
        {
          amountSats: 5_000,
          offboard: true,
          sentAt,
          txid: "submitted-offboard-id",
        },
      ],
    });

    assert.equal(
      mapArkTransactionToActivity(closest, { offboardTxids }).ramp,
      "withdraw",
    );
    assert.equal(
      mapArkTransactionToActivity(unrelated, { offboardTxids }).ramp,
      undefined,
    );
  });

  test("keeps ambiguous same-amount fallback candidates as Ark sends", () => {
    const sentAt = 1_800_000_000_000;
    const left = createTransaction({
      amount: 5_000,
      arkTxid: "left-ark-txid",
      commitmentTxid: "left-commitment-txid",
      createdAt: sentAt - 5 * 60 * 1000,
    });
    const right = createTransaction({
      amount: 5_000,
      arkTxid: "right-ark-txid",
      commitmentTxid: "right-commitment-txid",
      createdAt: sentAt + 5 * 60 * 1000,
    });
    const offboardTxids = collectOffboardTransactionIds([left, right], {
      sentTransactions: [
        {
          amountSats: 5_000,
          offboard: true,
          sentAt,
          txid: "submitted-offboard-id",
        },
      ],
    });

    assert.equal(
      mapArkTransactionToActivity(left, { offboardTxids }).ramp,
      undefined,
    );
    assert.equal(
      mapArkTransactionToActivity(right, { offboardTxids }).ramp,
      undefined,
    );
  });

  test("marks received boarding transactions as funds", () => {
    const item = mapArkTransactionToActivity(
      createTransaction({
        boardingTxid: "boarding-txid",
        type: TxType.TxReceived,
      }),
    );

    assert.equal(item.ramp, "fund");
    assert.equal(item.direction, "received");
  });
});
