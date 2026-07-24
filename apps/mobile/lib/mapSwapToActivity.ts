import type {
  BoltzChainSwap,
  BoltzReverseSwap,
  BoltzSubmarineSwap,
} from "@arkade-os/boltz-swap";

import type { ActivityItem } from "@/lib/activityTypes";
import { mapBoltzSwapToActivity } from "@/lib/mapBoltzSwapToActivity";
import { mapChainSwapToActivity } from "@/lib/mapChainSwapToActivity";

export const mapSwapToActivity = (
  swap: BoltzReverseSwap | BoltzSubmarineSwap | BoltzChainSwap,
): ActivityItem => {
  if (swap.type === "chain") {
    return mapChainSwapToActivity(swap);
  }

  return mapBoltzSwapToActivity(swap);
};
