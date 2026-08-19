import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { collectBoardingTxidsToSkip } from "@/lib/collectBoardingTxidsToSkip";

describe("collectBoardingTxidsToSkip", () => {
  test("dedupes activity boarding UTXOs against history and local settle records", () => {
    const skipped = collectBoardingTxidsToSkip(
      [
        { key: { boardingTxid: "history-boarding" } },
        { key: { boardingTxid: "" } },
      ],
      ["locally-settled"],
    );

    assert.equal(skipped.has("history-boarding"), true);
    assert.equal(skipped.has("locally-settled"), true);
    assert.equal(skipped.size, 2);
  });
});
