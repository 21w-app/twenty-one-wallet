import * as SecureStore from "expo-secure-store";

const BACKEND_DEVICE_BINDING_KEY = "backend_device_binding";
const LEGACY_BACKEND_DEVICE_ID_KEY = "backend_device_id";

export type BackendDeviceBinding = {
  deviceId: string;
  vtxoScriptHex: string;
};

const parseBackendDeviceBinding = (
  raw: string,
): BackendDeviceBinding | null => {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== "object" || parsed == null) {
      return null;
    }

    const record = parsed as Record<string, unknown>;

    if (
      typeof record.deviceId !== "string" ||
      record.deviceId.length === 0 ||
      typeof record.vtxoScriptHex !== "string" ||
      record.vtxoScriptHex.length === 0
    ) {
      return null;
    }

    return {
      deviceId: record.deviceId,
      vtxoScriptHex: record.vtxoScriptHex,
    };
  } catch {
    return null;
  }
};

const readLegacyBackendDeviceId = async (): Promise<string | null> => {
  return SecureStore.getItemAsync(LEGACY_BACKEND_DEVICE_ID_KEY);
};

export const getBackendDeviceBinding =
  async (): Promise<BackendDeviceBinding | null> => {
    const raw = await SecureStore.getItemAsync(BACKEND_DEVICE_BINDING_KEY);

    if (raw == null) {
      return null;
    }

    return parseBackendDeviceBinding(raw);
  };

export const getBackendDeviceId = async (): Promise<string | null> => {
  const binding = await getBackendDeviceBinding();

  if (binding != null) {
    return binding.deviceId;
  }

  return readLegacyBackendDeviceId();
};

export const setBackendDeviceBinding = async (
  binding: BackendDeviceBinding,
): Promise<void> => {
  await SecureStore.setItemAsync(
    BACKEND_DEVICE_BINDING_KEY,
    JSON.stringify(binding),
  );
  await SecureStore.deleteItemAsync(LEGACY_BACKEND_DEVICE_ID_KEY);
};

export const clearBackendDeviceId = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(BACKEND_DEVICE_BINDING_KEY);
  await SecureStore.deleteItemAsync(LEGACY_BACKEND_DEVICE_ID_KEY);
};

export const resolveBackendDeviceIdForWallet = async (
  vtxoScriptHex: string,
): Promise<string | undefined> => {
  const binding = await getBackendDeviceBinding();

  if (binding != null) {
    if (binding.vtxoScriptHex !== vtxoScriptHex) {
      await clearBackendDeviceId();
      return undefined;
    }

    return binding.deviceId;
  }

  const legacyDeviceId = await readLegacyBackendDeviceId();

  if (legacyDeviceId != null) {
    return legacyDeviceId;
  }

  return undefined;
};
