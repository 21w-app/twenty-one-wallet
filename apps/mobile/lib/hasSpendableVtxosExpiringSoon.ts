import type { IWallet } from "@arkade-os/sdk";
import { isVtxoExpiringSoon } from "@arkade-os/sdk";

import { VTXO_EXPIRY_BANNER_THRESHOLD_MS } from "@/lib/vtxoExpiryThreshold";

export const hasSpendableVtxosExpiringSoon = async (
  wallet: IWallet,
): Promise<boolean> => {
  const vtxos = await wallet.getVtxos();

  if (vtxos.length === 0) {
    return false;
  }

  return vtxos.some((vtxo) => {
    return isVtxoExpiringSoon(vtxo, VTXO_EXPIRY_BANNER_THRESHOLD_MS);
  });
};
