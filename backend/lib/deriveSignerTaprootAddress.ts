import { networks } from "@arkade-os/sdk";
import { Address, OutScript, p2tr } from "@scure/btc-signer";

export const deriveSignerTaprootAddress = async (identity: {
  xOnlyPublicKey: () => Promise<Uint8Array>;
}): Promise<string> => {
  const xOnlyPublicKey = await identity.xOnlyPublicKey();
  const payment = p2tr(xOnlyPublicKey, undefined, networks.bitcoin);
  const decoded = OutScript.decode(payment.script);

  return Address(networks.bitcoin).encode(decoded);
};
