import type { ActivityItem } from "@/lib/activityTypes";

export const isRampSettlementProtocol = (
  protocol: ActivityItem["protocol"],
): boolean => {
  return protocol === "lightning" || protocol === "onchain";
};
