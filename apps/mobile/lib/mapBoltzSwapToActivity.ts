import {
  isReverseFailedStatus,
  isReversePendingStatus,
  isReverseSuccessStatus,
  isSubmarineFailedStatus,
  isSubmarinePendingStatus,
  isSubmarineSuccessStatus,
  type BoltzReverseSwap,
  type BoltzSubmarineSwap,
  type BoltzSwapStatus,
} from "@arkade-os/boltz-swap";

import type { ActivityItem, ActivityStatus } from "@/lib/activityTypes";
import {
  getLightningFundAmounts,
  getLightningWithdrawAmounts,
} from "@/lib/getLightningActivityAmounts";

export const mapBoltzSwapStatus = (status: BoltzSwapStatus): ActivityStatus => {
  if (isReverseSuccessStatus(status) || isSubmarineSuccessStatus(status)) {
    return "confirmed";
  }

  if (isReverseFailedStatus(status) || isSubmarineFailedStatus(status)) {
    return "failed";
  }

  if (isReversePendingStatus(status) || isSubmarinePendingStatus(status)) {
    return "pending";
  }

  return "pending";
};

export const mapBoltzSwapToActivity = (
  swap: BoltzReverseSwap | BoltzSubmarineSwap,
): ActivityItem => {
  if (swap.type === "reverse") {
    const amounts = getLightningFundAmounts(swap);

    return {
      id: `lightning-fund-${swap.id}`,
      direction: "received",
      amountSats: amounts.netAmountSats,
      timestamp: swap.createdAt * 1000,
      status: mapBoltzSwapStatus(swap.status),
      protocol: "lightning",
    };
  }

  const amounts = getLightningWithdrawAmounts(swap);

  return {
    id: `lightning-withdraw-${swap.id}`,
    direction: "sent",
    amountSats: amounts.netAmountSats,
    timestamp: swap.createdAt * 1000,
    status: mapBoltzSwapStatus(swap.status),
    protocol: "lightning",
  };
};
