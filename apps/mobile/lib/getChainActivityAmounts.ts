import type { BoltzChainSwap } from "@arkade-os/boltz-swap";

import { getChainSwapFlow } from "@/lib/getChainSwapFlow";

export type ChainAmountBreakdown = {
  netAmountSats: number;
  lockAmountSats: number;
  feeSats: number | null;
};

export const getChainActivityAmounts = (
  swap: BoltzChainSwap,
): ChainAmountBreakdown => {
  const flow = getChainSwapFlow(swap);
  const lockAmountSats =
    swap.request.userLockAmount ??
    swap.response?.lockupDetails?.amount ??
    swap.amount;
  const claimAmountSats =
    swap.response?.claimDetails?.amount ?? swap.amount ?? lockAmountSats;

  if (flow === "fund") {
    const netAmountSats = claimAmountSats;
    const feeSats =
      lockAmountSats >= netAmountSats ? lockAmountSats - netAmountSats : null;

    return {
      netAmountSats,
      lockAmountSats,
      feeSats,
    };
  }

  const netAmountSats = claimAmountSats;
  const feeSats =
    lockAmountSats >= netAmountSats ? lockAmountSats - netAmountSats : null;

  return {
    netAmountSats,
    lockAmountSats,
    feeSats,
  };
};
