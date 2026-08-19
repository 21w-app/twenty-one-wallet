import type { FeeInfo, Wallet } from "@arkade-os/sdk";

export const getArkServerFees = async (wallet: Wallet): Promise<FeeInfo> => {
  const info = await wallet.arkProvider.getInfo();
  return info.fees;
};
