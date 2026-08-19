import test from "node:test";
import assert from "node:assert/strict";

import { buildIncomingFundsPushData } from "../lib/buildIncomingFundsPushData.js";

test("buildIncomingFundsPushData includes vtxo outpoint for mobile deeplink", () => {
  const data = buildIncomingFundsPushData({
    vtxo: {
      script: "deadbeef",
      txid: "abc123",
      vout: 2,
    },
  });

  assert.deepEqual(data, {
    type: "incoming_funds",
    vtxo_txid: "abc123",
    vtxo_vout: "2",
  });
});

test("buildIncomingFundsPushData prefers vtxo arkTxId as txid", () => {
  const data = buildIncomingFundsPushData({
    vtxo: {
      script: "deadbeef",
      txid: "abc123",
      vout: 2,
      arkTxId:
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
  });

  assert.deepEqual(data, {
    type: "incoming_funds",
    vtxo_txid: "abc123",
    vtxo_vout: "2",
    txid: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    ark_tx_id:
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  });
});

test("buildIncomingFundsPushData falls back to subscription txid", () => {
  const data = buildIncomingFundsPushData({
    vtxo: {
      script: "deadbeef",
      txid: "abc123",
      vout: 2,
      arkTxId: "",
    },
    subscriptionTxid:
      "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  });

  assert.deepEqual(data, {
    type: "incoming_funds",
    vtxo_txid: "abc123",
    vtxo_vout: "2",
    txid: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    ark_tx_id:
      "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  });
});
