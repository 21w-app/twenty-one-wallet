import type { IWallet } from "@arkade-os/sdk";

export const getWalletAddress = async (wallet: IWallet): Promise<string> => {
  return wallet.getAddress();
};
