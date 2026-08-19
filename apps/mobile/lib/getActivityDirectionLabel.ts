import type { ActivityItem } from "@/lib/activityTypes";
import type { TranslateFn } from "@/lib/createTranslator";

type ActivityDirectionLabelInput = Pick<
  ActivityItem,
  "direction" | "ramp" | "status"
>;

export const getActivityDirectionLabel = (
  item: ActivityDirectionLabelInput,
  t: TranslateFn,
): string => {
  if (item.ramp === "fund") {
    if (item.status === "pending") {
      return t("activity.directionPendingFund");
    }

    return t("activity.directionFund");
  }

  if (item.ramp === "withdraw") {
    if (item.status === "pending") {
      return t("activity.directionPendingWithdraw");
    }

    return t("activity.directionWithdraw");
  }

  if (item.direction === "received") {
    return t("activity.directionReceived");
  }

  return t("activity.directionSent");
};
