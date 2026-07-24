import type { ActivityItem } from "@/lib/activityTypes";
import { isMatchingRampFundSettlement } from "@/lib/isMatchingRampFundSettlement";
import { isMatchingRampWithdrawSettlement } from "@/lib/isMatchingRampWithdrawSettlement";
import { isRampSettlementProtocol } from "@/lib/isRampSettlementProtocol";

const findClosestMatchingArkFundItem = ({
  arkItems,
  hiddenArkIds,
  rampFundItem,
}: {
  arkItems: ActivityItem[];
  hiddenArkIds: ReadonlySet<string>;
  rampFundItem: ActivityItem;
}): ActivityItem | null => {
  let closestAfterQuoteMatch: ActivityItem | null = null;
  let closestAfterQuoteGapMs: number | null = null;
  let closestPriorCreditMatch: ActivityItem | null = null;
  let closestPriorCreditGapMs: number | null = null;

  for (const arkItem of arkItems) {
    if (hiddenArkIds.has(arkItem.id)) {
      continue;
    }

    if (!isMatchingRampFundSettlement(arkItem, rampFundItem)) {
      continue;
    }

    const arkAfterQuoteMs = arkItem.timestamp - rampFundItem.timestamp;

    if (arkAfterQuoteMs >= 0) {
      if (
        closestAfterQuoteGapMs == null ||
        arkAfterQuoteMs < closestAfterQuoteGapMs
      ) {
        closestAfterQuoteMatch = arkItem;
        closestAfterQuoteGapMs = arkAfterQuoteMs;
      }

      continue;
    }

    const rampAfterArkCreditMs = rampFundItem.timestamp - arkItem.timestamp;

    if (
      closestPriorCreditGapMs == null ||
      rampAfterArkCreditMs < closestPriorCreditGapMs
    ) {
      closestPriorCreditMatch = arkItem;
      closestPriorCreditGapMs = rampAfterArkCreditMs;
    }
  }

  return closestAfterQuoteMatch ?? closestPriorCreditMatch;
};

const findClosestMatchingArkWithdrawItem = ({
  arkItems,
  hiddenArkIds,
  rampWithdrawItem,
}: {
  arkItems: ActivityItem[];
  hiddenArkIds: ReadonlySet<string>;
  rampWithdrawItem: ActivityItem;
}): ActivityItem | null => {
  let closestAfterQuoteMatch: ActivityItem | null = null;
  let closestAfterQuoteGapMs: number | null = null;
  let closestPriorLockMatch: ActivityItem | null = null;
  let closestPriorLockGapMs: number | null = null;

  for (const arkItem of arkItems) {
    if (hiddenArkIds.has(arkItem.id)) {
      continue;
    }

    if (!isMatchingRampWithdrawSettlement(arkItem, rampWithdrawItem)) {
      continue;
    }

    const arkAfterQuoteMs = arkItem.timestamp - rampWithdrawItem.timestamp;

    if (arkAfterQuoteMs >= 0) {
      if (
        closestAfterQuoteGapMs == null ||
        arkAfterQuoteMs < closestAfterQuoteGapMs
      ) {
        closestAfterQuoteMatch = arkItem;
        closestAfterQuoteGapMs = arkAfterQuoteMs;
      }

      continue;
    }

    const rampAfterArkLockMs = rampWithdrawItem.timestamp - arkItem.timestamp;

    if (
      closestPriorLockGapMs == null ||
      rampAfterArkLockMs < closestPriorLockGapMs
    ) {
      closestPriorLockMatch = arkItem;
      closestPriorLockGapMs = rampAfterArkLockMs;
    }
  }

  return closestAfterQuoteMatch ?? closestPriorLockMatch;
};

export type MergeActivityItemsResult = {
  items: ActivityItem[];
  hiddenArkIds: string[];
};

export const mergeActivityItems = (
  arkItems: ActivityItem[],
  rampItems: ActivityItem[],
  failedItems: ActivityItem[],
): MergeActivityItemsResult => {
  const hiddenArkIds = new Set<string>();

  for (const rampItem of rampItems) {
    if (!isRampSettlementProtocol(rampItem.protocol)) {
      continue;
    }

    if (rampItem.direction === "received") {
      const closestArkItem = findClosestMatchingArkFundItem({
        arkItems,
        hiddenArkIds,
        rampFundItem: rampItem,
      });

      if (closestArkItem != null) {
        hiddenArkIds.add(closestArkItem.id);
      }

      continue;
    }

    if (rampItem.direction === "sent") {
      const closestArkItem = findClosestMatchingArkWithdrawItem({
        arkItems,
        hiddenArkIds,
        rampWithdrawItem: rampItem,
      });

      if (closestArkItem != null) {
        hiddenArkIds.add(closestArkItem.id);
      }
    }
  }

  const visibleArkItems = arkItems.filter((item) => {
    return !hiddenArkIds.has(item.id);
  });

  return {
    items: [...visibleArkItems, ...rampItems, ...failedItems].sort(
      (left, right) => {
        return right.timestamp - left.timestamp;
      },
    ),
    hiddenArkIds: [...hiddenArkIds],
  };
};
