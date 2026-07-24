import type { ActivityItem } from "@/lib/activityTypes";
import type { TranslateFn } from "@/lib/createTranslator";

export const getActivityListStatusSuffix = (
  item: Pick<ActivityItem, "protocol" | "status">,
  t: TranslateFn,
): string | null => {
  if (item.status === "failed") {
    return t("activity.failedSuffix");
  }

  if (
    (item.protocol === "lightning" || item.protocol === "onchain") &&
    item.status === "pending"
  ) {
    return t("activity.pendingSuffix");
  }

  return null;
};
