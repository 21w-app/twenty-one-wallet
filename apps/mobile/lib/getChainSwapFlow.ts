import type { BoltzChainSwap } from "@arkade-os/boltz-swap";

export type ChainSwapFlow = "fund" | "withdraw";

export const getChainSwapFlow = (swap: BoltzChainSwap): ChainSwapFlow => {
  if (swap.request.from === "BTC" && swap.request.to === "ARK") {
    return "fund";
  }

  return "withdraw";
};
