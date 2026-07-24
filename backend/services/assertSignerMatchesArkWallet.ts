import { prisma } from "../lib/prisma.js";
import { AuthError } from "./consumeAuthChallenge.js";

export const assertSignerMatchesArkWallet = async ({
  vtxoScriptHex,
  signerTaprootAddress,
}: {
  vtxoScriptHex: string;
  signerTaprootAddress: string;
}): Promise<void> => {
  const existingWallet = await prisma.arkWallet.findUnique({
    where: { vtxo_script_hex: vtxoScriptHex },
    select: { signer_taproot_address: true },
  });

  if (existingWallet == null) {
    return;
  }

  if (
    existingWallet.signer_taproot_address.length > 0 &&
    existingWallet.signer_taproot_address !== signerTaprootAddress
  ) {
    throw new AuthError(
      "signer_taproot_address does not match registered wallet",
    );
  }
};
