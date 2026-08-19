import type { ActivityItem } from "@/lib/activityTypes";
import { BOARDING_ACTIVITY_ID_PREFIX } from "@/lib/mapBoardingUtxosToActivity";

export const getActivityDetailHref = (
  item: ActivityItem,
):
  | {
      pathname: "/activity/ark";
      params: { id: string };
    }
  | {
      pathname: "/funding/fund";
    }
  | null => {
  if (item.id.startsWith("failed-")) {
    return null;
  }

  if (
    item.ramp === "fund" &&
    (item.status === "pending" ||
      item.id.startsWith(BOARDING_ACTIVITY_ID_PREFIX))
  ) {
    return {
      pathname: "/funding/fund",
    };
  }

  return {
    pathname: "/activity/ark",
    params: { id: item.id },
  };
};
