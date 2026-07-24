import type { Wallet } from "@arkade-os/sdk";

import { getBackendDeviceId } from "@/lib/backendDeviceId";
import { getExpoPushToken } from "@/lib/getExpoPushToken";
import {
  isPushNotificationsEnabled,
  setPushNotificationsEnabled,
} from "@/lib/pushNotificationsPreference";
import {
  revokeBackendDevice,
  syncBackendDevice,
} from "@/lib/syncBackendDevice";

export type PushRegistrationResult =
  | { ok: true; backendSynced: boolean }
  | {
      ok: false;
      reason: "denied" | "unavailable" | "error";
      backendSynced: false;
    };

const syncWalletPushDevice = async ({
  wallet,
  requestPermission,
}: {
  wallet: Wallet | null;
  requestPermission: boolean;
}): Promise<PushRegistrationResult> => {
  const tokenResult = await getExpoPushToken({ requestPermission });

  if (tokenResult.token == null) {
    return {
      ok: false,
      reason: tokenResult.reason,
      backendSynced: false,
    };
  }

  if (wallet == null) {
    return { ok: true, backendSynced: false };
  }

  try {
    await syncBackendDevice({
      wallet,
      expoPushToken: tokenResult.token,
    });

    return { ok: true, backendSynced: true };
  } catch {
    return { ok: true, backendSynced: false };
  }
};

export const enableWalletPushNotifications = async ({
  wallet,
}: {
  wallet: Wallet | null;
}): Promise<PushRegistrationResult> => {
  const result = await syncWalletPushDevice({
    wallet,
    requestPermission: true,
  });

  if (!result.ok) {
    await setPushNotificationsEnabled(false);
    return result;
  }

  await setPushNotificationsEnabled(true);
  return result;
};

export const disableWalletPushNotifications = async ({
  wallet,
}: {
  wallet: Wallet | null;
}): Promise<void> => {
  await setPushNotificationsEnabled(false);

  if (wallet == null) {
    return;
  }

  const deviceId = await getBackendDeviceId();

  if (deviceId == null) {
    return;
  }

  try {
    await revokeBackendDevice({ wallet });
  } catch {
    // Preference is already off locally; revoke can retry on next enable.
  }
};

export const syncWalletPushNotificationsIfEnabled = async ({
  wallet,
}: {
  wallet: Wallet | null;
}): Promise<void> => {
  const enabled = await isPushNotificationsEnabled();

  if (!enabled) {
    return;
  }

  await syncWalletPushDevice({
    wallet,
    requestPermission: false,
  });
};
