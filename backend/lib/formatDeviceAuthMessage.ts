export type SyncDeviceAuthMessageInput = {
  challengeId: string;
  expiresAtSeconds: number;
  vtxoScriptHex: string;
  arkStaticAddress: string;
  signerTaprootAddress: string;
  signerXOnlyPublicKey: string;
  deviceId?: string | null;
  expoPushToken: string;
  platform: string;
  appVersion?: string | null;
  nativeBuild?: string | null;
};

export type RevokeDeviceAuthMessageInput = {
  challengeId: string;
  expiresAtSeconds: number;
  vtxoScriptHex: string;
  arkStaticAddress: string;
  deviceId: string;
};

const normalizeOptional = (value: string | null | undefined): string => {
  return value == null ? "" : value;
};

export const formatSyncDeviceAuthMessage = (
  input: SyncDeviceAuthMessageInput,
): string => {
  return [
    "21W device authorization",
    "Action: devices.sync",
    `Challenge ID: ${input.challengeId}`,
    `Expires: ${input.expiresAtSeconds}`,
    `VTXO Script Hex: ${input.vtxoScriptHex.toLowerCase()}`,
    `Ark Static Address: ${input.arkStaticAddress}`,
    `Signer Taproot Address: ${input.signerTaprootAddress}`,
    `Signer X-Only Public Key: ${input.signerXOnlyPublicKey}`,
    `Device ID: ${normalizeOptional(input.deviceId)}`,
    `Expo Push Token: ${input.expoPushToken}`,
    `Platform: ${input.platform}`,
    `App Version: ${normalizeOptional(input.appVersion)}`,
    `Native Build: ${normalizeOptional(input.nativeBuild)}`,
  ].join("\n");
};

export const formatRevokeDeviceAuthMessage = (
  input: RevokeDeviceAuthMessageInput,
): string => {
  return [
    "21W device authorization",
    "Action: devices.revoke",
    `Challenge ID: ${input.challengeId}`,
    `Expires: ${input.expiresAtSeconds}`,
    `VTXO Script Hex: ${input.vtxoScriptHex.toLowerCase()}`,
    `Ark Static Address: ${input.arkStaticAddress}`,
    `Device ID: ${input.deviceId}`,
  ].join("\n");
};
