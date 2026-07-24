import {
  ARK_NETWORK_LABEL,
  ARK_SERVER_URL,
  ESPLORA_URL,
} from "@/lib/arkConfig";

export type WalletNetworkInfo = {
  networkLabel: string;
  arkServerUrl: string;
  esploraUrl: string;
};

export const getWalletNetworkInfo = (): WalletNetworkInfo => ({
  networkLabel: ARK_NETWORK_LABEL,
  arkServerUrl: ARK_SERVER_URL,
  esploraUrl: ESPLORA_URL,
});
