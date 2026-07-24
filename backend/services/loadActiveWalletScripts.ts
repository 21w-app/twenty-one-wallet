import { prisma } from "../lib/prisma.js";

export const loadActiveWalletScripts = async (): Promise<string[]> => {
  const wallets = await prisma.arkWallet.findMany({
    where: {
      devices: {
        some: {
          revoked_at: null,
        },
      },
    },
    select: {
      vtxo_script_hex: true,
    },
  });

  return wallets.map((wallet) => {
    return wallet.vtxo_script_hex;
  });
};
