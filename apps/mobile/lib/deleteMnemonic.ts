import * as SecureStore from "expo-secure-store";

import { WALLET_CONFIGURED_KEY, WALLET_SEED_KEY } from "@/lib/walletKeys";

export const deleteMnemonic = async (): Promise<void> => {
  // Never pass SecureStore authentication options here. Wallet deletion must
  // not trigger device authentication, even for legacy seeds that were stored
  // with requireAuthentication before TASK-045.
  try {
    await SecureStore.deleteItemAsync(WALLET_SEED_KEY);
  } catch {
    // Best-effort cleanup; continue removing the configured flag.
  }

  await SecureStore.deleteItemAsync(WALLET_CONFIGURED_KEY);
};
