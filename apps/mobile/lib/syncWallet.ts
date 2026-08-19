import type { IWallet } from "@arkade-os/sdk";

import { getWalletBalance } from "@/lib/getWalletBalance";

export const syncWallet = async (wallet: IWallet): Promise<void> => {
  await getWalletBalance(wallet);
  await wallet.getVtxos();
};
