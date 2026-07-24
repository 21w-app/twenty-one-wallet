import type { ActivityItem } from "@/lib/activityTypes";
import type { TranslateFn } from "@/lib/createTranslator";

type ActivityDirectionLabelInput = Pick<ActivityItem, "direction" | "protocol">;

export const getActivityDirectionLabel = (
  { direction, protocol }: ActivityDirectionLabelInput,
  t: TranslateFn,
): string => {
  if (protocol === "onchain") {
    if (direction === "received") {
      return t("activity.directionFunded");
    }

    return t("activity.directionWithdrawn");
  }

  if (protocol === "lightning") {
    if (direction === "received") {
      return t("activity.directionFunded");
    }

    return t("activity.directionWithdrawn");
  }

  if (direction === "received") {
    return t("activity.directionReceived");
  }

  return t("activity.directionSent");
};
