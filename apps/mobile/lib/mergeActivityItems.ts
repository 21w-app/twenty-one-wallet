import type { ActivityItem } from "@/lib/activityTypes";

export type MergeActivityItemsResult = {
  items: ActivityItem[];
};

const pendingRampScore = (item: ActivityItem): number => {
  if (item.status === "pending" && item.ramp != null) {
    return 1;
  }

  return 0;
};

export const mergeActivityItems = (
  ...groups: ActivityItem[][]
): MergeActivityItemsResult => {
  return {
    items: groups.flat().sort((left, right) => {
      const rampDelta = pendingRampScore(right) - pendingRampScore(left);

      if (rampDelta !== 0) {
        return rampDelta;
      }

      return right.timestamp - left.timestamp;
    }),
  };
};
