import type { IWallet, WalletBalance } from "@arkade-os/sdk";

export const getWalletBalance = async (
  wallet: IWallet,
): Promise<WalletBalance> => {
  return wallet.getBalance();
};
