import { ArkadeSwaps } from "@arkade-os/boltz-swap";
import { SQLiteSwapRepository } from "@arkade-os/boltz-swap/repositories/sqlite";
import type { IWallet } from "@arkade-os/sdk";

import { createSQLiteExecutor } from "@/lib/createSQLiteExecutor";

export const createArkadeSwaps = async (
  wallet: IWallet,
): Promise<ArkadeSwaps> => {
  const executor = createSQLiteExecutor();
  const swapRepository = new SQLiteSwapRepository(executor);

  return ArkadeSwaps.create({
    wallet,
    swapManager: { autoStart: false },
    swapRepository,
  });
};
