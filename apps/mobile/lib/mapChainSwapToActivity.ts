import {
  isChainClaimableStatus,
  isChainFailedStatus,
  isChainPendingStatus,
  isChainSuccessStatus,
  type BoltzChainSwap,
  type BoltzSwapStatus,
} from "@arkade-os/boltz-swap";

import type { ActivityItem, ActivityStatus } from "@/lib/activityTypes";
import { getChainActivityAmounts } from "@/lib/getChainActivityAmounts";
import { getChainSwapFlow } from "@/lib/getChainSwapFlow";

export const mapChainSwapStatus = (status: BoltzSwapStatus): ActivityStatus => {
  if (isChainSuccessStatus(status)) {
    return "confirmed";
  }

  if (isChainFailedStatus(status)) {
    return "failed";
  }

  if (isChainPendingStatus(status) || isChainClaimableStatus(status)) {
    return "pending";
  }

  return "pending";
};

export const mapChainSwapToActivity = (swap: BoltzChainSwap): ActivityItem => {
  const flow = getChainSwapFlow(swap);
  const amounts = getChainActivityAmounts(swap);

  if (flow === "fund") {
    return {
      id: `onchain-fund-${swap.id}`,
      direction: "received",
      amountSats: amounts.netAmountSats,
      timestamp: swap.createdAt * 1000,
      status: mapChainSwapStatus(swap.status),
      protocol: "onchain",
    };
  }

  return {
    id: `onchain-withdraw-${swap.id}`,
    direction: "sent",
    amountSats: amounts.lockAmountSats,
    timestamp: swap.createdAt * 1000,
    status: mapChainSwapStatus(swap.status),
    protocol: "onchain",
  };
};
