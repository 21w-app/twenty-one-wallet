import type { Wallet } from "@arkade-os/sdk";
import { BIP322 } from "@arkade-os/sdk";
import {
  createAuthChallenge,
  isAuthChallengeResponse,
  isSyncDeviceResponse,
  readSdkErrorMessage,
  revokeDevice,
  syncDevice,
} from "@21w/api-client";
import { Platform } from "react-native";

import {
  clearBackendDeviceId,
  getBackendDeviceBinding,
  resolveBackendDeviceIdForWallet,
  setBackendDeviceBinding,
} from "@/lib/backendDeviceId";
import {
  formatRevokeDeviceAuthMessage,
  formatSyncDeviceAuthMessage,
} from "@/lib/formatDeviceAuthMessage";
import { getAppVersionInfo } from "@/lib/getAppVersionInfo";
import { getSignerTaprootAddress } from "@/lib/getSignerTaprootAddress";
import { getSignerXOnlyPublicKeyHex } from "@/lib/getSignerXOnlyPublicKeyHex";
import { getWalletVtxoScriptHex } from "@/lib/getWalletVtxoScriptHex";

const signChallengeMessage = async (
  wallet: Wallet,
  message: string,
): Promise<string> => {
  return BIP322.sign(message, wallet.identity);
};

const readApiPlatform = (): "ios" | "android" => {
  if (Platform.OS === "ios") {
    return "ios";
  }

  return "android";
};

const isStaleDeviceBindingError = (message: string): boolean => {
  return (
    message.includes("deviceId belongs to a different wallet") ||
    message.includes("device has been revoked")
  );
};

const submitDeviceSync = async ({
  wallet,
  expoPushToken,
  deviceId,
}: {
  wallet: Wallet;
  expoPushToken: string;
  deviceId?: string;
}): Promise<string> => {
  const challengeResponse = await createAuthChallenge({ throwOnError: false });

  if (challengeResponse.error != null) {
    throw new Error(
      readSdkErrorMessage(challengeResponse.error, "Challenge request failed"),
    );
  }

  if (!isAuthChallengeResponse(challengeResponse.data)) {
    throw new Error("Challenge request failed");
  }

  const challenge = challengeResponse.data;
  const vtxoScriptHex = await getWalletVtxoScriptHex(wallet);
  const arkStaticAddress = await wallet.getAddress();
  const signerTaprootAddress = await getSignerTaprootAddress(wallet);
  const signerXOnlyPublicKey = await getSignerXOnlyPublicKeyHex(wallet);
  const { appVersion, nativeBuild } = getAppVersionInfo();
  const signature = await signChallengeMessage(
    wallet,
    formatSyncDeviceAuthMessage({
      challengeId: challenge.challengeId,
      expiresAtSeconds: challenge.expiresAtSeconds,
      vtxoScriptHex,
      arkStaticAddress,
      signerTaprootAddress,
      signerXOnlyPublicKey,
      deviceId,
      expoPushToken,
      platform: readApiPlatform(),
      appVersion,
      nativeBuild,
    }),
  );

  const syncResponse = await syncDevice({
    throwOnError: false,
    body: {
      challengeId: challenge.challengeId,
      signature,
      signature_version: "device-auth-v1",
      vtxo_script_hex: vtxoScriptHex,
      ark_static_address: arkStaticAddress,
      signer_taproot_address: signerTaprootAddress,
      signer_xonly_public_key: signerXOnlyPublicKey,
      deviceId,
      expo_push_token: expoPushToken,
      platform: readApiPlatform(),
      app_version: appVersion,
      native_build: nativeBuild ?? undefined,
    },
  });

  if (syncResponse.error != null) {
    throw new Error(
      readSdkErrorMessage(syncResponse.error, "Device sync failed"),
    );
  }

  if (!isSyncDeviceResponse(syncResponse.data)) {
    throw new Error("Device sync failed");
  }

  await setBackendDeviceBinding({
    deviceId: syncResponse.data.deviceId,
    vtxoScriptHex,
  });

  return syncResponse.data.deviceId;
};

export const syncBackendDevice = async ({
  wallet,
  expoPushToken,
}: {
  wallet: Wallet;
  expoPushToken: string;
}): Promise<string | null> => {
  const vtxoScriptHex = await getWalletVtxoScriptHex(wallet);
  const storedDeviceId = await resolveBackendDeviceIdForWallet(vtxoScriptHex);

  try {
    return await submitDeviceSync({
      wallet,
      expoPushToken,
      deviceId: storedDeviceId,
    });
  } catch (error) {
    if (storedDeviceId == null) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "";

    if (!isStaleDeviceBindingError(message)) {
      throw error;
    }

    await clearBackendDeviceId();

    return submitDeviceSync({
      wallet,
      expoPushToken,
    });
  }
};

export const revokeBackendDevice = async ({
  wallet,
}: {
  wallet: Wallet;
}): Promise<void> => {
  const vtxoScriptHex = await getWalletVtxoScriptHex(wallet);
  const binding = await getBackendDeviceBinding();

  if (binding == null || binding.vtxoScriptHex !== vtxoScriptHex) {
    await clearBackendDeviceId();
    return;
  }

  const challengeResponse = await createAuthChallenge({ throwOnError: false });

  if (challengeResponse.error != null) {
    throw new Error(
      readSdkErrorMessage(challengeResponse.error, "Challenge request failed"),
    );
  }

  if (!isAuthChallengeResponse(challengeResponse.data)) {
    throw new Error("Challenge request failed");
  }

  const challenge = challengeResponse.data;
  const arkStaticAddress = await wallet.getAddress();
  const signature = await signChallengeMessage(
    wallet,
    formatRevokeDeviceAuthMessage({
      challengeId: challenge.challengeId,
      expiresAtSeconds: challenge.expiresAtSeconds,
      vtxoScriptHex,
      arkStaticAddress,
      deviceId: binding.deviceId,
    }),
  );

  const revokeResponse = await revokeDevice({
    throwOnError: false,
    path: { deviceId: binding.deviceId },
    body: {
      challengeId: challenge.challengeId,
      signature,
      signature_version: "device-auth-v1",
      vtxo_script_hex: vtxoScriptHex,
      ark_static_address: arkStaticAddress,
    },
  });

  if (revokeResponse.error != null) {
    const status = revokeResponse.response?.status;

    if (status !== 404) {
      throw new Error(
        readSdkErrorMessage(revokeResponse.error, "Device revoke failed"),
      );
    }
  }

  await clearBackendDeviceId();
};
