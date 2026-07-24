import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import {
  clearPendingTransaction,
  markPendingTransactionStarted,
} from "@/lib/pendingTransaction";
import {
  isIncomingFundsPushData,
  readTxidFromPushData,
  shouldSuppressIncomingFundsPush,
} from "@/lib/shouldSuppressIncomingFundsPush";

describe("shouldSuppressIncomingFundsPush", () => {
  afterEach(() => {
    clearPendingTransaction();
  });

  it("suppresses incoming-funds pushes while an outgoing transaction is pending", async () => {
    markPendingTransactionStarted();

    const suppress = await shouldSuppressIncomingFundsPush({ txid: null });

    assert.equal(suppress, true);
  });

  it("does not suppress untracked incoming-funds pushes", async () => {
    const suppress = await shouldSuppressIncomingFundsPush({ txid: null });

    assert.equal(suppress, false);
  });
});

describe("incoming funds push data", () => {
  it("recognizes incoming funds payloads", () => {
    assert.equal(isIncomingFundsPushData({ type: "incoming_funds" }), true);
    assert.equal(isIncomingFundsPushData({ type: "vtxo_expiry" }), false);
  });

  it("prefers txid and falls back to the legacy ark_tx_id field", () => {
    assert.equal(
      readTxidFromPushData({
        txid: "subscription-txid",
        ark_tx_id: "legacy-ark-txid",
      }),
      "subscription-txid",
    );
    assert.equal(
      readTxidFromPushData({ ark_tx_id: "legacy-ark-txid" }),
      "legacy-ark-txid",
    );
  });
});
