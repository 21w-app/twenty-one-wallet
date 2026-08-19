import type { ActivityStatus } from "@/lib/activityTypes";
import type { TranslateFn } from "@/lib/createTranslator";

export const formatActivityStatusLabel = (
  status: ActivityStatus,
  t: TranslateFn,
): string => {
  if (status === "pending") {
    return t("activity.statusPending");
  }

  if (status === "failed") {
    return t("activity.statusFailed");
  }

  return t("activity.statusConfirmed");
};
