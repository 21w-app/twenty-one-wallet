import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { collectOffboardActivityIds } from "@/lib/collectOffboardActivityIds";

describe("collectOffboardActivityIds", () => {
  test("keeps durable offboard ids after the recent-send cache expires", () => {
    const ids = collectOffboardActivityIds(
      [{ txid: "recent-send", sentAt: 1 }],
      ["durable-offboard"],
    );

    assert.equal(ids.has("durable-offboard"), true);
    assert.equal(ids.has("recent-send"), false);
  });

  test("includes offboard flags still present on recent-send entries", () => {
    const ids = collectOffboardActivityIds(
      [{ txid: "recent-offboard", sentAt: 1, offboard: true }],
      [],
    );

    assert.equal(ids.has("recent-offboard"), true);
  });
});
