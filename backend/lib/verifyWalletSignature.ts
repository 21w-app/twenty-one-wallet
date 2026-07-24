import { BIP322, networks } from "@arkade-os/sdk";

export const verifyWalletSignature = (
  message: string,
  signature: string,
  signerTaprootAddress: string,
): boolean => {
  try {
    return BIP322.verify(
      message,
      signature,
      signerTaprootAddress,
      networks.bitcoin,
    );
  } catch {
    return false;
  }
};
