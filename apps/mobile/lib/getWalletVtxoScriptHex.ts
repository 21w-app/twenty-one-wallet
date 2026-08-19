import type { IWallet } from "@arkade-os/sdk";
import { ArkAddress } from "@arkade-os/sdk";
import { hex } from "@scure/base";

export const getWalletVtxoScriptHex = async (
  wallet: IWallet,
): Promise<string> => {
  const address = await wallet.getAddress();
  const decoded = ArkAddress.decode(address);

  return hex.encode(decoded.pkScript);
};
