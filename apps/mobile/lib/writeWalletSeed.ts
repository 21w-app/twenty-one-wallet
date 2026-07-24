import * as SecureStore from "expo-secure-store";

import { WALLET_SEED_KEY } from "@/lib/walletKeys";
import { walletSeedSecureStoreOptions } from "@/lib/walletSeedSecureStoreOptions";

export const writeWalletSeed = async (mnemonic: string): Promise<void> => {
  await SecureStore.setItemAsync(
    WALLET_SEED_KEY,
    mnemonic,
    walletSeedSecureStoreOptions(),
  );
};
