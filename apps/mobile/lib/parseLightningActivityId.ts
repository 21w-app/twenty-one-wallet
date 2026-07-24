export type LightningActivityFlow = "fund" | "withdraw";

export type ParsedLightningActivityId = {
  flow: LightningActivityFlow;
  swapId: string;
};

export const parseLightningActivityId = (
  activityId: string,
): ParsedLightningActivityId | null => {
  if (activityId.startsWith("lightning-fund-")) {
    return {
      flow: "fund",
      swapId: activityId.slice("lightning-fund-".length),
    };
  }

  if (activityId.startsWith("lightning-withdraw-")) {
    return {
      flow: "withdraw",
      swapId: activityId.slice("lightning-withdraw-".length),
    };
  }

  return null;
};
