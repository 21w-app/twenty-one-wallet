import type { Platform } from "@prisma/client";

import type { Env } from "../lib/env.js";
import {
  formatRevokeDeviceAuthMessage,
  formatSyncDeviceAuthMessage,
} from "../lib/formatDeviceAuthMessage.js";
import { prisma } from "../lib/prisma.js";
import { validateStaticArkAddressSigner } from "../lib/validateStaticArkAddressSigner.js";
import { validateVtxoScriptHex } from "../lib/validateVtxoScriptHex.js";
import { AuthError, consumeAuthChallenge } from "./consumeAuthChallenge.js";
import { assertSignerMatchesArkWallet } from "./assertSignerMatchesArkWallet.js";
import { refreshIndexerSubscription } from "./indexerSubscriptionManager.js";
import { pruneOrphanWallet } from "./pruneOrphanWallet.js";

export type SyncDeviceInput = {
  env: Env;
  challengeId: string;
  signature: string;
  signatureVersion: "device-auth-v1";
  vtxoScriptHex: string;
  arkStaticAddress: string;
  signerTaprootAddress: string;
  signerXOnlyPublicKey: string;
  deviceId?: string;
  expoPushToken: string;
  platform: Platform;
  appVersion?: string | null;
  nativeBuild?: string | null;
};

export type SyncDeviceResult = {
  deviceId: string;
};

export const syncDevice = async (
  input: SyncDeviceInput,
): Promise<SyncDeviceResult> => {
  if (!validateVtxoScriptHex(input.vtxoScriptHex, input.arkStaticAddress)) {
    throw new AuthError("vtxo_script_hex does not match ark_static_address");
  }

  const existingWallet = await prisma.arkWallet.findUnique({
    where: { vtxo_script_hex: input.vtxoScriptHex },
    select: { signer_taproot_address: true },
  });

  if (input.signerTaprootAddress.trim().length === 0) {
    throw new AuthError("signer_taproot_address is required");
  }

  await assertSignerMatchesArkWallet({
    vtxoScriptHex: input.vtxoScriptHex,
    signerTaprootAddress: input.signerTaprootAddress,
  });

  const ownsStaticAddress = await validateStaticArkAddressSigner({
    arkStaticAddress: input.arkStaticAddress,
    signerTaprootAddress: input.signerTaprootAddress,
    signerXOnlyPublicKey: input.signerXOnlyPublicKey,
    arkServerUrl: input.env.arkIndexerUrl,
  });

  if (!ownsStaticAddress) {
    throw new AuthError(
      "signer_taproot_address does not own ark_static_address",
    );
  }

  await consumeAuthChallenge({
    challengeId: input.challengeId,
    signature: input.signature,
    signerTaprootAddress: input.signerTaprootAddress,
    formatMessage: ({ challengeId, expiresAtSeconds }) => {
      return formatSyncDeviceAuthMessage({
        challengeId,
        expiresAtSeconds,
        vtxoScriptHex: input.vtxoScriptHex,
        arkStaticAddress: input.arkStaticAddress,
        signerTaprootAddress: input.signerTaprootAddress,
        signerXOnlyPublicKey: input.signerXOnlyPublicKey,
        deviceId: input.deviceId,
        expoPushToken: input.expoPushToken,
        platform: input.platform,
        appVersion: input.appVersion,
        nativeBuild: input.nativeBuild,
      });
    },
  });

  const device = await prisma.$transaction(async (tx) => {
    const now = new Date();

    await tx.arkWallet.upsert({
      where: { vtxo_script_hex: input.vtxoScriptHex },
      create: {
        vtxo_script_hex: input.vtxoScriptHex,
        ark_static_address: input.arkStaticAddress,
        signer_taproot_address: input.signerTaprootAddress,
      },
      update: {
        ark_static_address: input.arkStaticAddress,
        ...(existingWallet != null &&
        existingWallet.signer_taproot_address.length === 0
          ? { signer_taproot_address: input.signerTaprootAddress }
          : {}),
      },
    });

    await tx.$queryRaw`
      SELECT vtxo_script_hex
      FROM "ArkWallet"
      WHERE vtxo_script_hex = ${input.vtxoScriptHex}
      FOR UPDATE
    `;

    const existingDevice =
      input.deviceId == null
        ? null
        : await tx.device.findUnique({
            where: { id: input.deviceId },
          });

    if (
      existingDevice != null &&
      existingDevice.vtxo_script_hex !== input.vtxoScriptHex
    ) {
      throw new AuthError("deviceId belongs to a different wallet");
    }

    const syncedDevice =
      existingDevice == null
        ? await tx.device.create({
            data: {
              vtxo_script_hex: input.vtxoScriptHex,
              expo_push_token: input.expoPushToken,
              platform: input.platform,
              app_version: input.appVersion ?? null,
              native_build: input.nativeBuild ?? null,
              last_seen_at: now,
            },
          })
        : await tx.device.update({
            where: { id: existingDevice.id },
            data: {
              vtxo_script_hex: input.vtxoScriptHex,
              expo_push_token: input.expoPushToken,
              platform: input.platform,
              app_version: input.appVersion ?? null,
              native_build: input.nativeBuild ?? null,
              last_seen_at: now,
              revoked_at: null,
            },
          });

    await tx.device.updateMany({
      where: {
        vtxo_script_hex: input.vtxoScriptHex,
        revoked_at: null,
        id: { not: syncedDevice.id },
      },
      data: { revoked_at: now },
    });

    return syncedDevice;
  });

  refreshIndexerSubscription();

  return { deviceId: device.id };
};

export const revokeDevice = async (input: {
  deviceId: string;
  challengeId: string;
  signature: string;
  signatureVersion: "device-auth-v1";
  arkStaticAddress: string;
  vtxoScriptHex: string;
}): Promise<void> => {
  if (!validateVtxoScriptHex(input.vtxoScriptHex, input.arkStaticAddress)) {
    throw new AuthError("vtxo_script_hex does not match ark_static_address");
  }

  const arkWallet = await prisma.arkWallet.findUnique({
    where: { vtxo_script_hex: input.vtxoScriptHex },
    select: { signer_taproot_address: true },
  });

  if (arkWallet == null) {
    throw new AuthError("Wallet not registered");
  }

  await consumeAuthChallenge({
    challengeId: input.challengeId,
    signature: input.signature,
    signerTaprootAddress: arkWallet.signer_taproot_address,
    formatMessage: ({ challengeId, expiresAtSeconds }) => {
      return formatRevokeDeviceAuthMessage({
        challengeId,
        expiresAtSeconds,
        vtxoScriptHex: input.vtxoScriptHex,
        arkStaticAddress: input.arkStaticAddress,
        deviceId: input.deviceId,
      });
    },
  });

  const device = await prisma.device.findUnique({
    where: { id: input.deviceId },
  });

  if (device == null) {
    throw new AuthError("Device not found");
  }

  if (device.vtxo_script_hex !== input.vtxoScriptHex) {
    throw new AuthError("Device does not belong to this wallet");
  }

  if (device.revoked_at != null) {
    return;
  }

  await prisma.device.update({
    where: { id: input.deviceId },
    data: { revoked_at: new Date() },
  });

  await pruneOrphanWallet(input.vtxoScriptHex);
};
