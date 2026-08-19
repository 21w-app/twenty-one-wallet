import type { Wallet } from "@arkade-os/sdk";

import { createArkWallet } from "@/lib/createArkWallet";
import { loadMnemonic } from "@/lib/loadMnemonic";

export type SecureStoreWalletResult =
  | { wallet: Wallet; mnemonic: string }
  | { wallet: null; reason: "missing" | "auth_cancelled" };

export const createArkWalletFromSecureStore =
  async (): Promise<SecureStoreWalletResult> => {
    const mnemonic = await loadMnemonic();

    if (mnemonic == null || mnemonic.trim().length === 0) {
      return { wallet: null, reason: "missing" };
    }

    const wallet = await createArkWallet(mnemonic);

    return { wallet, mnemonic };
  };
