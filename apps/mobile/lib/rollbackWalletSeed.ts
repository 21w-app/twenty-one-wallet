import * as SecureStore from "expo-secure-store";

import { WALLET_SEED_KEY } from "@/lib/walletKeys";
import { walletSeedSecureStoreOptions } from "@/lib/walletSeedSecureStoreOptions";

export const rollbackWalletSeed = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(
      WALLET_SEED_KEY,
      walletSeedSecureStoreOptions(),
    );
  } catch {
    // Rollback is best-effort; caller still rethrows the original error.
  }
};
