import type { Wallet } from "@arkade-os/sdk";

export const getBoardingAddress = async (wallet: Wallet): Promise<string> => {
  return wallet.getBoardingAddress();
};
