import type { ArkadeSwaps } from "@arkade-os/boltz-swap";

import { deleteAuthOnOpenPreference } from "@/lib/authOnOpenPreference";
import { clearAddressBookContacts } from "@/lib/addressBook";
import { deletePushNotificationsPreference } from "@/lib/pushNotificationsPreference";
import { clearArkSentAmountOverrides } from "@/lib/arkSentAmountOverrides";
import { deleteMnemonic } from "@/lib/deleteMnemonic";
import { deleteWalletDatabase } from "@/lib/deleteWalletDatabase";
import { clearVtxoReminderPreference } from "@/lib/vtxoReminderPreference";
import { clearBackendDeviceId } from "@/lib/backendDeviceId";
import { clearPendingTransaction } from "@/lib/pendingTransaction";
import { clearSentTransactions } from "@/lib/sentArkTransactions";
import { clearFundedChainSwaps } from "@/lib/fundedChainSwaps";
import { clearWalletViewCache } from "@/lib/walletViewCache";

type ClearWalletDataOptions = {
  swaps: ArkadeSwaps | null;
  releaseActiveWallet?: () => void | Promise<void>;
  revokeBackendRegistration?: () => Promise<void>;
};

export const clearWalletData = async ({
  swaps,
  releaseActiveWallet,
  revokeBackendRegistration,
}: ClearWalletDataOptions): Promise<void> => {
  if (swaps != null) {
    try {
      await swaps.reset();
    } catch {
      // Best-effort swap cleanup; wallet deletion must still proceed.
    }
  }

  if (revokeBackendRegistration != null) {
    try {
      await revokeBackendRegistration();
    } catch {
      // Best-effort remote deregistration.
    }
  }

  await releaseActiveWallet?.();

  await deleteMnemonic();
  await deleteAuthOnOpenPreference();
  await deletePushNotificationsPreference();
  await clearArkSentAmountOverrides();
  await clearAddressBookContacts();
  await clearWalletViewCache();
  await clearFundedChainSwaps();
  await clearVtxoReminderPreference();
  await clearBackendDeviceId();
  clearPendingTransaction();
  await clearSentTransactions();
  await deleteWalletDatabase();
};
