import {
  isChainFinalStatus,
  type ArkadeSwaps,
  type BoltzChainSwap,
} from "@arkade-os/boltz-swap";

import { logLightningFundDebug } from "@/lib/logLightningFundDebug";

export const startSwapManagerIfNeeded = async (
  swaps: ArkadeSwaps,
): Promise<void> => {
  const manager = swaps.getSwapManager();

  if (manager == null) {
    logLightningFundDebug("swap-manager", "startIfNeeded skipped: no manager");
    return;
  }

  const stats = await manager.getStats();

  if (stats.isRunning) {
    logLightningFundDebug(
      "swap-manager",
      "startIfNeeded skipped: already running",
      {
        stats,
      },
    );
    return;
  }

  const [submarine, reverse, chain, history] = await Promise.all([
    swaps.getPendingSubmarineSwaps(),
    swaps.getPendingReverseSwaps(),
    swaps.getPendingChainSwaps(),
    swaps.getSwapHistory(),
  ]);

  const nonFinalChain = history.filter((swap): swap is BoltzChainSwap => {
    return swap.type === "chain" && !isChainFinalStatus(swap.status);
  });
  const chainIds = new Set([
    ...chain.map((swap) => swap.id),
    ...nonFinalChain.map((swap) => swap.id),
  ]);
  const hasPendingSwaps = submarine.length + reverse.length + chainIds.size > 0;

  if (!hasPendingSwaps) {
    logLightningFundDebug(
      "swap-manager",
      "startIfNeeded skipped: no pending swaps",
      {
        submarine: submarine.length,
        reverse: reverse.length,
        chain: chainIds.size,
      },
    );
    return;
  }

  logLightningFundDebug("swap-manager", "starting for pending swaps", {
    submarine: submarine.length,
    reverse: reverse.length,
    chain: chainIds.size,
  });
  await swaps.startSwapManager();
  logLightningFundDebug("swap-manager", "started for pending swaps", {
    stats: await manager.getStats(),
  });
};

export const ensureSwapManagerStarted = async (
  swaps: ArkadeSwaps,
): Promise<void> => {
  const manager = swaps.getSwapManager();

  if (manager == null) {
    logLightningFundDebug("swap-manager", "ensureStarted skipped: no manager");
    return;
  }

  const statsBefore = await manager.getStats();

  if (statsBefore.isRunning) {
    logLightningFundDebug(
      "swap-manager",
      "ensureStarted skipped: already running",
      {
        stats: statsBefore,
      },
    );
    return;
  }

  logLightningFundDebug("swap-manager", "ensureStarted: starting manager", {
    stats: statsBefore,
  });
  await swaps.startSwapManager();
  logLightningFundDebug("swap-manager", "ensureStarted: manager started", {
    stats: await manager.getStats(),
  });
};
