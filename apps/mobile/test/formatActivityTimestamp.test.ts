import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { createTranslator } from "@/lib/createTranslator";
import { formatActivityTimestamp } from "@/lib/formatActivityTimestamp";

describe("formatActivityTimestamp", () => {
  test("shows Just now when the timestamp is missing", () => {
    const t = createTranslator("en");

    assert.equal(formatActivityTimestamp(0, t), "Just now");
    assert.equal(formatActivityTimestamp(Number.NaN, t), "Just now");
    assert.equal(
      formatActivityTimestamp(Number.NEGATIVE_INFINITY, t),
      "Just now",
    );
  });

  test("shows the Czech Just now copy", () => {
    const t = createTranslator("cs");

    assert.equal(formatActivityTimestamp(0, t), "Právě teď");
  });
});
