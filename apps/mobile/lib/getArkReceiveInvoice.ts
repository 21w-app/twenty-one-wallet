import type { IWallet } from "@arkade-os/sdk";

export const getArkReceiveInvoice = async (
  wallet: IWallet,
): Promise<string> => {
  return wallet.getAddress();
};
