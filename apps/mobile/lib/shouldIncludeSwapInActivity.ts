import {
  isChainClaimableStatus,
  isChainFailedStatus,
  isChainSuccessStatus,
  isReverseClaimableStatus,
  isReverseSuccessStatus,
  type BoltzChainSwap,
  type BoltzReverseSwap,
  type BoltzSubmarineSwap,
} from "@arkade-os/boltz-swap";

import { getChainSwapFlow } from "@/lib/getChainSwapFlow";

type ShouldIncludeSwapInActivityOptions = {
  fundedChainSwapIds?: ReadonlySet<string>;
};

export const shouldIncludeChainSwapInActivity = (
  swap: BoltzChainSwap,
  options?: ShouldIncludeSwapInActivityOptions,
): boolean => {
  if (isChainFailedStatus(swap.status)) {
    return true;
  }

  if (
    isChainSuccessStatus(swap.status) ||
    isChainClaimableStatus(swap.status)
  ) {
    return true;
  }

  const flow = getChainSwapFlow(swap);

  if (flow === "fund") {
    return swap.status !== "swap.created";
  }

  if (options?.fundedChainSwapIds?.has(swap.id) === true) {
    return true;
  }

  return swap.status !== "swap.created";
};

export const shouldIncludeSwapInActivity = (
  swap: BoltzReverseSwap | BoltzSubmarineSwap | BoltzChainSwap,
  options?: ShouldIncludeSwapInActivityOptions,
): boolean => {
  if (swap.type === "chain") {
    return shouldIncludeChainSwapInActivity(swap, options);
  }

  if (swap.type === "reverse") {
    return (
      isReverseSuccessStatus(swap.status) ||
      isReverseClaimableStatus(swap.status)
    );
  }

  return true;
};
