import type { IWallet } from "@arkade-os/sdk";
import { hex } from "@scure/base";

export const getSignerXOnlyPublicKeyHex = async (
  wallet: IWallet,
): Promise<string> => {
  const xOnlyPublicKey = await wallet.identity.xOnlyPublicKey();

  return hex.encode(xOnlyPublicKey);
};
