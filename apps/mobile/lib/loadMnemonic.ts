import * as SecureStore from "expo-secure-store";

import { WALLET_SEED_KEY } from "@/lib/walletKeys";
import { walletSeedSecureStoreOptions } from "@/lib/walletSeedSecureStoreOptions";

// Rewrites legacy authenticated seeds without per-access SecureStore auth.
export const loadMnemonic = async (): Promise<string | null> => {
  const mnemonic = await SecureStore.getItemAsync(
    WALLET_SEED_KEY,
    walletSeedSecureStoreOptions(),
  );

  if (mnemonic == null || mnemonic.trim().length === 0) {
    return mnemonic;
  }

  await SecureStore.setItemAsync(
    WALLET_SEED_KEY,
    mnemonic,
    walletSeedSecureStoreOptions(),
  );

  return mnemonic;
};
