import type { ActivityItem } from "@/lib/activityTypes";
import type { TranslateFn } from "@/lib/createTranslator";

export const getActivityListStatusSuffix = (
  item: Pick<ActivityItem, "status">,
  t: TranslateFn,
): string | null => {
  if (item.status === "failed") {
    return t("activity.failedSuffix");
  }

  return null;
};
