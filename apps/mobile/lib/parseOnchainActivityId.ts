import type { ChainSwapFlow } from "@/lib/getChainSwapFlow";

type ParsedOnchainActivityId = {
  flow: ChainSwapFlow;
  swapId: string;
};

export const parseOnchainActivityId = (
  activityId: string,
): ParsedOnchainActivityId | null => {
  if (activityId.startsWith("onchain-fund-")) {
    const swapId = activityId.slice("onchain-fund-".length);

    if (swapId.length === 0) {
      return null;
    }

    return { flow: "fund", swapId };
  }

  if (activityId.startsWith("onchain-withdraw-")) {
    const swapId = activityId.slice("onchain-withdraw-".length);

    if (swapId.length === 0) {
      return null;
    }

    return { flow: "withdraw", swapId };
  }

  return null;
};
