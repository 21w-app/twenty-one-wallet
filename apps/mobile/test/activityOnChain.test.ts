import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ActivityItem } from "@/lib/activityTypes";
import { mapChainSwapToActivity } from "@/lib/mapChainSwapToActivity";
import { mergeActivityItems } from "@/lib/mergeActivityItems";
import { parseOnchainActivityId } from "@/lib/parseOnchainActivityId";
import { shouldIncludeChainSwapInActivity } from "@/lib/shouldIncludeSwapInActivity";

describe("parseOnchainActivityId", () => {
  it("parses on-chain fund activity ids", () => {
    assert.deepEqual(parseOnchainActivityId("onchain-fund-abc"), {
      flow: "fund",
      swapId: "abc",
    });
  });

  it("parses on-chain withdraw activity ids", () => {
    assert.deepEqual(parseOnchainActivityId("onchain-withdraw-xyz"), {
      flow: "withdraw",
      swapId: "xyz",
    });
  });
});

describe("mapChainSwapToActivity", () => {
  it("maps fund chain swaps as received on-chain activity", () => {
    const item = mapChainSwapToActivity({
      id: "swap-1",
      type: "chain",
      status: "transaction.claimed",
      createdAt: 1_700_000_000,
      amount: 10_000,
      request: {
        from: "BTC",
        to: "ARK",
        userLockAmount: 10_050,
      },
      response: {
        lockupDetails: { amount: 10_050 },
        claimDetails: { amount: 10_000 },
      },
    } as Parameters<typeof mapChainSwapToActivity>[0]);

    assert.equal(item.id, "onchain-fund-swap-1");
    assert.equal(item.protocol, "onchain");
    assert.equal(item.direction, "received");
    assert.equal(item.amountSats, 10_000);
    assert.equal(item.status, "confirmed");
  });

  it("maps withdraw chain swaps as sent on-chain activity", () => {
    const item = mapChainSwapToActivity({
      id: "swap-2",
      type: "chain",
      status: "transaction.mempool",
      createdAt: 1_700_000_100,
      amount: 8_000,
      request: {
        from: "ARK",
        to: "BTC",
        userLockAmount: 8_100,
      },
      response: {
        lockupDetails: { amount: 8_100 },
        claimDetails: { amount: 8_000 },
      },
    } as Parameters<typeof mapChainSwapToActivity>[0]);

    assert.equal(item.id, "onchain-withdraw-swap-2");
    assert.equal(item.protocol, "onchain");
    assert.equal(item.direction, "sent");
    assert.equal(item.amountSats, 8_100);
    assert.equal(item.status, "pending");
  });

  it("falls back to swap.amount when chain response details are missing", () => {
    const item = mapChainSwapToActivity({
      id: "swap-partial",
      type: "chain",
      status: "swap.created",
      createdAt: 1_700_000_200,
      amount: 5_000,
      request: {
        from: "BTC",
        to: "ARK",
      },
      response: {},
    } as Parameters<typeof mapChainSwapToActivity>[0]);

    assert.equal(item.amountSats, 5_000);
  });
});

describe("shouldIncludeChainSwapInActivity", () => {
  it("hides unfunded withdraw quotes still at swap.created", () => {
    assert.equal(
      shouldIncludeChainSwapInActivity({
        id: "swap-created-withdraw",
        type: "chain",
        status: "swap.created",
        createdAt: 1_700_000_100,
        amount: 8_000,
        request: {
          from: "ARK",
          to: "BTC",
          userLockAmount: 8_100,
        },
        response: {
          lockupDetails: { amount: 8_100 },
          claimDetails: { amount: 8_000 },
        },
      } as Parameters<typeof shouldIncludeChainSwapInActivity>[0]),
      false,
    );
  });

  it("includes funded withdraw swaps still at swap.created", () => {
    assert.equal(
      shouldIncludeChainSwapInActivity(
        {
          id: "funded-withdraw",
          type: "chain",
          status: "swap.created",
          createdAt: 1_700_000_100,
          amount: 8_000,
          request: {
            from: "ARK",
            to: "BTC",
            userLockAmount: 8_100,
          },
          response: {
            lockupDetails: { amount: 8_100 },
            claimDetails: { amount: 8_000 },
          },
        } as Parameters<typeof shouldIncludeChainSwapInActivity>[0],
        { fundedChainSwapIds: new Set(["funded-withdraw"]) },
      ),
      true,
    );
  });
});

describe("mergeActivityItems", () => {
  it("hides duplicate ark rows for matching on-chain fund settlements", () => {
    const timestamp = 1_700_000_000_000;
    const arkItems: ActivityItem[] = [
      {
        id: "ark-fund",
        direction: "received",
        amountSats: 10_000,
        timestamp,
        status: "confirmed",
        protocol: "ark",
      },
    ];
    const rampItems: ActivityItem[] = [
      {
        id: "onchain-fund-1",
        direction: "received",
        amountSats: 10_000,
        timestamp,
        status: "confirmed",
        protocol: "onchain",
      },
    ];

    const merged = mergeActivityItems(arkItems, rampItems, []);

    assert.equal(merged.items.length, 1);
    assert.equal(merged.items[0]?.protocol, "onchain");
    assert.deepEqual(merged.hiddenArkIds, ["ark-fund"]);
  });

  it("hides duplicate ark rows when on-chain fund settles long after quote creation", () => {
    const quoteTimestamp = 1_700_000_000_000;
    const arkTimestamp = quoteTimestamp + 47 * 60 * 1000;
    const arkItems: ActivityItem[] = [
      {
        id: "ark-fund-delayed",
        direction: "received",
        amountSats: 10_000,
        timestamp: arkTimestamp,
        status: "confirmed",
        protocol: "ark",
      },
    ];
    const rampItems: ActivityItem[] = [
      {
        id: "onchain-fund-delayed",
        direction: "received",
        amountSats: 10_000,
        timestamp: quoteTimestamp,
        status: "confirmed",
        protocol: "onchain",
      },
    ];

    const merged = mergeActivityItems(arkItems, rampItems, []);

    assert.equal(merged.items.length, 1);
    assert.equal(merged.items[0]?.protocol, "onchain");
    assert.deepEqual(merged.hiddenArkIds, ["ark-fund-delayed"]);
  });

  it("pairs same-amount on-chain fund rows with the closest later ark receive", () => {
    const firstQuoteTimestamp = 1_700_000_000_000;
    const secondQuoteTimestamp = firstQuoteTimestamp + 60 * 60 * 1000;
    const firstArkTimestamp = firstQuoteTimestamp + 30 * 60 * 1000;
    const secondArkTimestamp = secondQuoteTimestamp + 30 * 60 * 1000;
    const arkItems: ActivityItem[] = [
      {
        id: "ark-fund-1",
        direction: "received",
        amountSats: 10_000,
        timestamp: firstArkTimestamp,
        status: "confirmed",
        protocol: "ark",
      },
      {
        id: "ark-fund-2",
        direction: "received",
        amountSats: 10_000,
        timestamp: secondArkTimestamp,
        status: "confirmed",
        protocol: "ark",
      },
    ];
    const rampItems: ActivityItem[] = [
      {
        id: "onchain-fund-1",
        direction: "received",
        amountSats: 10_000,
        timestamp: firstQuoteTimestamp,
        status: "confirmed",
        protocol: "onchain",
      },
      {
        id: "onchain-fund-2",
        direction: "received",
        amountSats: 10_000,
        timestamp: secondQuoteTimestamp,
        status: "confirmed",
        protocol: "onchain",
      },
    ];

    const merged = mergeActivityItems(arkItems, rampItems, []);

    assert.equal(merged.items.length, 2);
    assert.deepEqual(
      merged.items.map((item) => {
        return item.protocol;
      }),
      ["onchain", "onchain"],
    );
    assert.deepEqual(merged.hiddenArkIds.sort(), ["ark-fund-1", "ark-fund-2"]);
  });

  it("hides duplicate ark rows for matching lightning fund settlements", () => {
    const timestamp = 1_700_000_000_000;
    const arkItems: ActivityItem[] = [
      {
        id: "ark-fund",
        direction: "received",
        amountSats: 10_000,
        timestamp,
        status: "confirmed",
        protocol: "ark",
      },
    ];
    const rampItems: ActivityItem[] = [
      {
        id: "lightning-fund-1",
        direction: "received",
        amountSats: 10_000,
        timestamp,
        status: "confirmed",
        protocol: "lightning",
      },
    ];

    const merged = mergeActivityItems(arkItems, rampItems, []);

    assert.equal(merged.items.length, 1);
    assert.equal(merged.items[0]?.protocol, "lightning");
    assert.deepEqual(merged.hiddenArkIds, ["ark-fund"]);
  });

  it("hides duplicate ark rows when lightning fund settles long after quote creation", () => {
    const quoteTimestamp = 1_700_000_000_000;
    const arkTimestamp = quoteTimestamp + 22 * 60 * 1000;
    const arkItems: ActivityItem[] = [
      {
        id: "ark-fund-delayed-lightning",
        direction: "received",
        amountSats: 1_230,
        timestamp: arkTimestamp,
        status: "confirmed",
        protocol: "ark",
      },
    ];
    const rampItems: ActivityItem[] = [
      {
        id: "lightning-fund-delayed",
        direction: "received",
        amountSats: 1_230,
        timestamp: quoteTimestamp,
        status: "confirmed",
        protocol: "lightning",
      },
    ];

    const merged = mergeActivityItems(arkItems, rampItems, []);

    assert.equal(merged.items.length, 1);
    assert.equal(merged.items[0]?.protocol, "lightning");
    assert.deepEqual(merged.hiddenArkIds, ["ark-fund-delayed-lightning"]);
  });

  it("hides duplicate ark rows when ark credit arrives shortly before ramp fund row", () => {
    const arkTimestamp = 1_700_000_000_000;
    const rampTimestamp = arkTimestamp + 60 * 1000;
    const arkItems: ActivityItem[] = [
      {
        id: "ark-fund-credit-first",
        direction: "received",
        amountSats: 3_990,
        timestamp: arkTimestamp,
        status: "confirmed",
        protocol: "ark",
      },
    ];
    const rampItems: ActivityItem[] = [
      {
        id: "lightning-fund-credit-first",
        direction: "received",
        amountSats: 3_990,
        timestamp: rampTimestamp,
        status: "confirmed",
        protocol: "lightning",
      },
    ];

    const merged = mergeActivityItems(arkItems, rampItems, []);

    assert.equal(merged.items.length, 1);
    assert.equal(merged.items[0]?.protocol, "lightning");
    assert.deepEqual(merged.hiddenArkIds, ["ark-fund-credit-first"]);
  });

  it("keeps ark rows when ramp fund row is long after ark credit", () => {
    const arkTimestamp = 1_700_000_000_000;
    const rampTimestamp = arkTimestamp + 30 * 60 * 1000;
    const arkItems: ActivityItem[] = [
      {
        id: "ark-unrelated-receive",
        direction: "received",
        amountSats: 3_990,
        timestamp: arkTimestamp,
        status: "confirmed",
        protocol: "ark",
      },
    ];
    const rampItems: ActivityItem[] = [
      {
        id: "lightning-fund-unrelated",
        direction: "received",
        amountSats: 3_990,
        timestamp: rampTimestamp,
        status: "confirmed",
        protocol: "lightning",
      },
    ];

    const merged = mergeActivityItems(arkItems, rampItems, []);

    assert.equal(merged.items.length, 2);
    assert.deepEqual(merged.hiddenArkIds, []);
  });

  it("hides duplicate ark rows for lightning withdraw settlements", () => {
    const timestamp = 1_700_000_000_000;
    const arkItems: ActivityItem[] = [
      {
        id: "ark-withdraw-lightning",
        direction: "sent",
        amountSats: 8_100,
        timestamp,
        status: "confirmed",
        protocol: "ark",
      },
    ];
    const rampItems: ActivityItem[] = [
      {
        id: "lightning-withdraw-1",
        direction: "sent",
        amountSats: 8_100,
        timestamp,
        status: "confirmed",
        protocol: "lightning",
      },
    ];

    const merged = mergeActivityItems(arkItems, rampItems, []);

    assert.equal(merged.items.length, 1);
    assert.equal(merged.items[0]?.protocol, "lightning");
    assert.deepEqual(merged.hiddenArkIds, ["ark-withdraw-lightning"]);
  });

  it("hides duplicate ark rows when lightning withdraw lock happens after quote creation", () => {
    const quoteTimestamp = 1_700_000_000_000;
    const arkTimestamp = quoteTimestamp + 12 * 60 * 1000;
    const arkItems: ActivityItem[] = [
      {
        id: "ark-withdraw-delayed-lightning",
        direction: "sent",
        amountSats: 8_100,
        timestamp: arkTimestamp,
        status: "confirmed",
        protocol: "ark",
      },
    ];
    const rampItems: ActivityItem[] = [
      {
        id: "lightning-withdraw-delayed",
        direction: "sent",
        amountSats: 8_100,
        timestamp: quoteTimestamp,
        status: "pending",
        protocol: "lightning",
      },
    ];

    const merged = mergeActivityItems(arkItems, rampItems, []);

    assert.equal(merged.items.length, 1);
    assert.equal(merged.items[0]?.protocol, "lightning");
    assert.deepEqual(merged.hiddenArkIds, ["ark-withdraw-delayed-lightning"]);
  });

  it("hides duplicate ark rows for on-chain withdraw settlements with fees", () => {
    const timestamp = 1_700_000_000_000;
    const arkItems: ActivityItem[] = [
      {
        id: "ark-withdraw",
        direction: "sent",
        amountSats: 8_100,
        timestamp,
        status: "confirmed",
        protocol: "ark",
      },
    ];
    const rampItems: ActivityItem[] = [
      {
        id: "onchain-withdraw-1",
        direction: "sent",
        amountSats: 8_100,
        timestamp,
        status: "pending",
        protocol: "onchain",
      },
    ];

    const merged = mergeActivityItems(arkItems, rampItems, []);

    assert.equal(merged.items.length, 1);
    assert.equal(merged.items[0]?.protocol, "onchain");
    assert.deepEqual(merged.hiddenArkIds, ["ark-withdraw"]);
  });

  it("hides duplicate ark rows when on-chain withdraw row is shortly after ark lock send", () => {
    const arkTimestamp = 1_700_000_000_000;
    const onChainTimestamp = arkTimestamp + 60 * 1000;
    const arkItems: ActivityItem[] = [
      {
        id: "ark-withdraw-lock-first",
        direction: "sent",
        amountSats: 10_770,
        timestamp: arkTimestamp,
        status: "confirmed",
        protocol: "ark",
      },
    ];
    const rampItems: ActivityItem[] = [
      {
        id: "onchain-withdraw-lock-first",
        direction: "sent",
        amountSats: 10_770,
        timestamp: onChainTimestamp,
        status: "pending",
        protocol: "onchain",
      },
    ];

    const merged = mergeActivityItems(arkItems, rampItems, []);

    assert.equal(merged.items.length, 1);
    assert.equal(merged.items[0]?.protocol, "onchain");
    assert.deepEqual(merged.hiddenArkIds, ["ark-withdraw-lock-first"]);
  });

  it("hides duplicate ark rows when on-chain withdraw sends ark after quote creation", () => {
    const quoteTimestamp = 1_700_000_000_000;
    const arkTimestamp = quoteTimestamp + 12 * 60 * 1000;
    const arkItems: ActivityItem[] = [
      {
        id: "ark-withdraw-delayed",
        direction: "sent",
        amountSats: 8_100,
        timestamp: arkTimestamp,
        status: "confirmed",
        protocol: "ark",
      },
    ];
    const rampItems: ActivityItem[] = [
      {
        id: "onchain-withdraw-delayed",
        direction: "sent",
        amountSats: 8_100,
        timestamp: quoteTimestamp,
        status: "pending",
        protocol: "onchain",
      },
    ];

    const merged = mergeActivityItems(arkItems, rampItems, []);

    assert.equal(merged.items.length, 1);
    assert.equal(merged.items[0]?.protocol, "onchain");
    assert.deepEqual(merged.hiddenArkIds, ["ark-withdraw-delayed"]);
  });

  it("pairs same-amount on-chain withdraw rows with the closest prior ark lock send", () => {
    const onChainTimestamp = 1_700_000_000_000;
    const firstArkTimestamp = onChainTimestamp - 10 * 60 * 1000;
    const secondArkTimestamp = onChainTimestamp - 2 * 60 * 1000;
    const arkItems: ActivityItem[] = [
      {
        id: "ark-withdraw-earlier",
        direction: "sent",
        amountSats: 10_770,
        timestamp: firstArkTimestamp,
        status: "confirmed",
        protocol: "ark",
      },
      {
        id: "ark-withdraw-lock",
        direction: "sent",
        amountSats: 10_770,
        timestamp: secondArkTimestamp,
        status: "confirmed",
        protocol: "ark",
      },
    ];
    const rampItems: ActivityItem[] = [
      {
        id: "onchain-withdraw-pair",
        direction: "sent",
        amountSats: 10_770,
        timestamp: onChainTimestamp,
        status: "pending",
        protocol: "onchain",
      },
    ];

    const merged = mergeActivityItems(arkItems, rampItems, []);

    assert.equal(merged.items.length, 2);
    assert.deepEqual(merged.hiddenArkIds, ["ark-withdraw-lock"]);
    assert.equal(
      merged.items.some((item) => {
        return item.id === "ark-withdraw-earlier";
      }),
      true,
    );
  });

  it("prefers delayed after-quote ark lock send over a closer prior unrelated send", () => {
    const quoteTimestamp = 1_700_000_000_000;
    const unrelatedArkTimestamp = quoteTimestamp - 2 * 60 * 1000;
    const lockArkTimestamp = quoteTimestamp + 12 * 60 * 1000;
    const arkItems: ActivityItem[] = [
      {
        id: "ark-unrelated-before-quote",
        direction: "sent",
        amountSats: 8_100,
        timestamp: unrelatedArkTimestamp,
        status: "confirmed",
        protocol: "ark",
      },
      {
        id: "ark-withdraw-lock-after-quote",
        direction: "sent",
        amountSats: 8_100,
        timestamp: lockArkTimestamp,
        status: "confirmed",
        protocol: "ark",
      },
    ];
    const rampItems: ActivityItem[] = [
      {
        id: "onchain-withdraw-delayed",
        direction: "sent",
        amountSats: 8_100,
        timestamp: quoteTimestamp,
        status: "pending",
        protocol: "onchain",
      },
    ];

    const merged = mergeActivityItems(arkItems, rampItems, []);

    assert.equal(merged.items.length, 2);
    assert.deepEqual(merged.hiddenArkIds, ["ark-withdraw-lock-after-quote"]);
    assert.equal(
      merged.items.some((item) => {
        return item.id === "ark-unrelated-before-quote";
      }),
      true,
    );
  });

  it("keeps ark rows when on-chain withdraw row is long after ark lock send", () => {
    const arkTimestamp = 1_700_000_000_000;
    const onChainTimestamp = arkTimestamp + 30 * 60 * 1000;
    const arkItems: ActivityItem[] = [
      {
        id: "ark-unrelated-send",
        direction: "sent",
        amountSats: 10_770,
        timestamp: arkTimestamp,
        status: "confirmed",
        protocol: "ark",
      },
    ];
    const rampItems: ActivityItem[] = [
      {
        id: "onchain-withdraw-unrelated",
        direction: "sent",
        amountSats: 10_770,
        timestamp: onChainTimestamp,
        status: "pending",
        protocol: "onchain",
      },
    ];

    const merged = mergeActivityItems(arkItems, rampItems, []);

    assert.equal(merged.items.length, 2);
    assert.deepEqual(merged.hiddenArkIds, []);
  });

  it("keeps ark rows when ramp timestamps match but amounts differ", () => {
    const timestamp = 1_700_000_000_000;
    const arkItems: ActivityItem[] = [
      {
        id: "ark-receive",
        direction: "received",
        amountSats: 50_000,
        timestamp,
        status: "confirmed",
        protocol: "ark",
      },
    ];
    const rampItems: ActivityItem[] = [
      {
        id: "onchain-fund-2",
        direction: "received",
        amountSats: 10_000,
        timestamp,
        status: "confirmed",
        protocol: "onchain",
      },
    ];

    const merged = mergeActivityItems(arkItems, rampItems, []);

    assert.equal(merged.items.length, 2);
    assert.deepEqual(merged.hiddenArkIds, []);
  });
});
