import type { ActivityItem } from "@/lib/activityTypes";

export const getActivityDetailHref = (
  item: ActivityItem,
): {
  pathname: "/activity/ark" | "/activity/lightning" | "/activity/onchain";
  params: { id: string };
} | null => {
  if (item.id.startsWith("failed-")) {
    return null;
  }

  if (item.protocol === "lightning") {
    return {
      pathname: "/activity/lightning",
      params: { id: item.id },
    };
  }

  if (item.protocol === "onchain") {
    return {
      pathname: "/activity/onchain",
      params: { id: item.id },
    };
  }

  if (item.protocol !== "ark") {
    return null;
  }

  return {
    pathname: "/activity/ark",
    params: { id: item.id },
  };
};
