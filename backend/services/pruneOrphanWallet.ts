import { prisma } from "../lib/prisma.js";
import { refreshIndexerSubscription } from "./indexerSubscriptionManager.js";

export const pruneOrphanWallet = async (
  vtxoScriptHex: string,
): Promise<void> => {
  const activeDeviceCount = await prisma.device.count({
    where: {
      vtxo_script_hex: vtxoScriptHex,
      revoked_at: null,
    },
  });

  if (activeDeviceCount > 0) {
    return;
  }

  await prisma.arkWallet
    .delete({
      where: { vtxo_script_hex: vtxoScriptHex },
    })
    .catch(() => {
      // Wallet may already be gone.
    });

  refreshIndexerSubscription();
};
