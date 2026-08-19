import * as SecureStore from "expo-secure-store";

import {
  WALLET_CONFIGURED_KEY,
  WALLET_CONFIGURED_TRUE,
} from "@/lib/walletKeys";

export const writeWalletConfiguredFlag = async (): Promise<void> => {
  await SecureStore.setItemAsync(WALLET_CONFIGURED_KEY, WALLET_CONFIGURED_TRUE);
};
