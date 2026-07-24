import type {
  ArkadeSwaps,
  BoltzChainSwap,
  BoltzReverseSwap,
  BoltzSubmarineSwap,
} from "@arkade-os/boltz-swap";

import { shouldIncludeSwapInActivity } from "@/lib/shouldIncludeSwapInActivity";

type ActivitySwap = BoltzReverseSwap | BoltzSubmarineSwap | BoltzChainSwap;

const isActivitySwap = (swap: { type: string }): swap is ActivitySwap => {
  return (
    swap.type === "reverse" ||
    swap.type === "submarine" ||
    swap.type === "chain"
  );
};

export const loadSwapHistoryForActivity = async (
  swaps: ArkadeSwaps,
  options?: {
    fundedChainSwapIds?: ReadonlySet<string>;
  },
): Promise<ActivitySwap[]> => {
  const localHistory = await swaps.getSwapHistory();
  const swapsById = new Map<string, ActivitySwap>();

  for (const swap of localHistory) {
    if (isActivitySwap(swap)) {
      swapsById.set(swap.id, swap);
    }
  }

  try {
    const restored = await swaps.restoreSwaps();

    for (const swap of restored.reverseSwaps) {
      if (swapsById.has(swap.id)) {
        continue;
      }

      swapsById.set(swap.id, swap);

      try {
        await swaps.swapRepository.saveSwap(swap);
      } catch {
        // Display still works when persistence fails.
      }
    }

    for (const swap of restored.submarineSwaps) {
      if (swapsById.has(swap.id)) {
        continue;
      }

      swapsById.set(swap.id, swap);

      try {
        await swaps.swapRepository.saveSwap(swap);
      } catch {
        // Display still works when persistence fails.
      }
    }

    for (const swap of restored.chainSwaps) {
      if (swapsById.has(swap.id)) {
        continue;
      }

      swapsById.set(swap.id, swap);

      try {
        await swaps.swapRepository.saveSwap(swap);
      } catch {
        // Display still works when persistence fails.
      }
    }
  } catch {
    // Best-effort: local SQLite history still applies when Boltz restore fails.
  }

  return [...swapsById.values()].filter((swap) => {
    return shouldIncludeSwapInActivity(swap, options);
  });
};
