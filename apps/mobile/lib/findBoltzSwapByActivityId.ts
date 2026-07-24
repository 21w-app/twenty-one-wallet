import type {
  BoltzChainSwap,
  BoltzReverseSwap,
  BoltzSubmarineSwap,
  BoltzSwap,
} from "@arkade-os/boltz-swap";

import { parseLightningActivityId } from "@/lib/parseLightningActivityId";
import { parseOnchainActivityId } from "@/lib/parseOnchainActivityId";

export const findBoltzSwapByActivityId = (
  swaps: BoltzSwap[],
  activityId: string,
): BoltzReverseSwap | BoltzSubmarineSwap | BoltzChainSwap | null => {
  const lightningParsed = parseLightningActivityId(activityId);
  const onchainParsed = parseOnchainActivityId(activityId);
  const swapId = lightningParsed?.swapId ?? onchainParsed?.swapId;

  if (swapId == null) {
    return null;
  }

  const swap = swaps.find((entry) => {
    return entry.id === swapId;
  });

  if (
    swap?.type === "reverse" ||
    swap?.type === "submarine" ||
    swap?.type === "chain"
  ) {
    return swap;
  }

  return null;
};

export const findSubmarineSwapByPreimage = (
  swaps: BoltzSwap[],
  preimage: string,
): BoltzSubmarineSwap | null => {
  const swap = swaps.find((entry) => {
    return entry.type === "submarine" && entry.preimage === preimage;
  });

  if (swap?.type === "submarine") {
    return swap;
  }

  return null;
};
