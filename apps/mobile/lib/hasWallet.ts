import * as SecureStore from "expo-secure-store";

import {
  WALLET_CONFIGURED_KEY,
  WALLET_CONFIGURED_TRUE,
} from "@/lib/walletKeys";

export const hasWallet = async (): Promise<boolean> => {
  const configured = await SecureStore.getItemAsync(WALLET_CONFIGURED_KEY);

  return configured === WALLET_CONFIGURED_TRUE;
};
