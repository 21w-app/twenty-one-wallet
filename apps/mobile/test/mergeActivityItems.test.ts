import assert from "node:assert/strict";
import { describe, test } from "node:test";

import type { ActivityItem } from "@/lib/activityTypes";
import { mergeActivityItems } from "@/lib/mergeActivityItems";

const createItem = (
  id: string,
  options: Partial<ActivityItem> & Pick<ActivityItem, "timestamp">,
): ActivityItem => {
  return {
    id,
    direction: "received",
    amountSats: 1_000,
    status: "confirmed",
    protocol: "ark",
    ...options,
  };
};

describe("mergeActivityItems", () => {
  test("keeps pending fund and withdraw rows above older confirmed activity", () => {
    const confirmed = createItem("old", { timestamp: 3_000 });
    const pendingFund = createItem("fund", {
      timestamp: 1_000,
      status: "pending",
      ramp: "fund",
    });
    const pendingWithdraw = createItem("withdraw", {
      timestamp: 2_000,
      status: "pending",
      ramp: "withdraw",
      direction: "sent",
    });

    const { items } = mergeActivityItems(
      [confirmed],
      [pendingFund],
      [pendingWithdraw],
    );

    assert.deepEqual(
      items.map((item) => {
        return item.id;
      }),
      ["withdraw", "fund", "old"],
    );
  });
});
