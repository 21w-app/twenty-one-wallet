import { deleteAuthOnOpenPreference } from "@/lib/authOnOpenPreference";
import { clearAddressBookContacts } from "@/lib/addressBook";
import { deletePushNotificationsPreference } from "@/lib/pushNotificationsPreference";
import { clearArkSentAmountOverrides } from "@/lib/arkSentAmountOverrides";
import { deleteMnemonic } from "@/lib/deleteMnemonic";
import { deleteWalletDatabase } from "@/lib/deleteWalletDatabase";
import { clearVtxoReminderPreference } from "@/lib/vtxoReminderPreference";
import { clearBackendDeviceId } from "@/lib/backendDeviceId";
import { clearOffboardActivityIds } from "@/lib/offboardActivityIds";
import { clearPendingTransaction } from "@/lib/pendingTransaction";
import { clearSentTransactions } from "@/lib/sentArkTransactions";
import { clearSettledBoardingTxids } from "@/lib/settledBoardingTxids";
import { clearWalletViewCache } from "@/lib/walletViewCache";

type ClearWalletDataOptions = {
  releaseActiveWallet?: () => void | Promise<void>;
  revokeBackendRegistration?: () => Promise<void>;
};

export const clearWalletData = async ({
  releaseActiveWallet,
  revokeBackendRegistration,
}: ClearWalletDataOptions): Promise<void> => {
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
  await clearVtxoReminderPreference();
  await clearBackendDeviceId();
  clearPendingTransaction();
  await clearSentTransactions();
  await clearOffboardActivityIds();
  await clearSettledBoardingTxids();
  await deleteWalletDatabase();
};
