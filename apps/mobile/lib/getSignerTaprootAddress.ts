import type { IWallet } from "@arkade-os/sdk";
import { networks } from "@arkade-os/sdk";
import { Address, OutScript, p2tr } from "@scure/btc-signer";

export const getSignerTaprootAddress = async (
  wallet: IWallet,
): Promise<string> => {
  const xOnlyPublicKey = await wallet.identity.xOnlyPublicKey();
  const payment = p2tr(xOnlyPublicKey, undefined, networks.bitcoin);
  const decoded = OutScript.decode(payment.script);

  return Address(networks.bitcoin).encode(decoded);
};
