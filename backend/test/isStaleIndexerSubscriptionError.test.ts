import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isStaleIndexerSubscriptionError } from "../lib/isStaleIndexerSubscriptionError.js";

describe("isStaleIndexerSubscriptionError", () => {
  it("matches Ark indexer JSON subscription-not-found errors", () => {
    const error = new Error(
      'Failed to subscribe to scripts: {"code":13,"message":"subscription not found: c070db68-3eb4-449c-b2a1-a47d998f1dd6","details":[]}',
    );

    assert.equal(isStaleIndexerSubscriptionError(error), true);
  });

  it("matches legacy subscription id not found wording", () => {
    const error = new Error(
      "subscription c070db68-3eb4-449c-b2a1-a47d998f1dd6 not found",
    );

    assert.equal(isStaleIndexerSubscriptionError(error), true);
  });

  it("does not match unrelated errors", () => {
    assert.equal(
      isStaleIndexerSubscriptionError(new Error("network timeout")),
      false,
    );
  });
});
