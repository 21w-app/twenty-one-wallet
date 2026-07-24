import { EsploraProvider, MnemonicIdentity, Wallet } from "@arkade-os/sdk";
import {
  ExpoArkProvider,
  ExpoIndexerProvider,
} from "@arkade-os/sdk/adapters/expo";

import { ARK_SERVER_URL, ESPLORA_URL } from "@/lib/arkConfig";
import { createSQLiteWalletRepositories } from "@/lib/createSQLiteExecutor";

// Seconds before a VTXO expires at which auto-renewal kicks in. The SDK default
// is 259_200 (3 days); we raise it so opening the app any time in roughly the
// second half of a VTXO's life triggers renewal. ArkInfo does not expose the
// server's VTXO lifetime, so we use a fixed conservative value. This MUST stay
// safely below the actual server VTXO lifetime (~4 weeks on mainnet Ark): if the
// threshold ever exceeds the lifetime, every VTXO reads as "expiring soon" and
// the wallet renews on every poll, wasting rounds/fees.
const VTXO_RENEWAL_THRESHOLD_SECONDS = 604_800; // 7 days

export const createArkWallet = async (mnemonic: string): Promise<Wallet> => {
  const identity = MnemonicIdentity.fromMnemonic(mnemonic);
  const storage = createSQLiteWalletRepositories();

  return Wallet.create({
    identity,
    arkProvider: new ExpoArkProvider(ARK_SERVER_URL),
    indexerProvider: new ExpoIndexerProvider(ARK_SERVER_URL),
    onchainProvider: new EsploraProvider(ESPLORA_URL),
    storage,
    // Pin a stable, seed-derived receive address (identity.xOnlyPublicKey()).
    // The SDK default 'auto' is "currently identical to 'static'" but reserved
    // for a future change that may re-enable HD rotation; 'static' guarantees
    // the address never rotates.
    walletMode: "static",
    settlementConfig: {
      vtxoThreshold: VTXO_RENEWAL_THRESHOLD_SECONDS,
    },
  });
};
