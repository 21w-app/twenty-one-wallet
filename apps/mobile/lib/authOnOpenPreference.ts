import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import {
  AUTH_ON_OPEN_BIOMETRICS_ENABLED_KEY,
  AUTH_ON_OPEN_ENABLED_KEY,
} from "@/lib/asyncStorageKeys";
import { migrateSecureStoreStringToAsyncStorage } from "@/lib/migrateSecureStoreStringToAsyncStorage";
import {
  readAsyncStorageBoolean,
  toAsyncStorageBoolean,
} from "@/lib/readAsyncStorageBoolean";

const LEGACY_AUTH_ON_OPEN_SECURE_STORE_KEY = "auth_on_open_enabled";

const readAuthOnOpenValue = async (): Promise<string | null> => {
  return migrateSecureStoreStringToAsyncStorage(
    AUTH_ON_OPEN_ENABLED_KEY,
    LEGACY_AUTH_ON_OPEN_SECURE_STORE_KEY,
  );
};

const readBiometricsOnOpenValue = async (): Promise<string | null> => {
  return AsyncStorage.getItem(AUTH_ON_OPEN_BIOMETRICS_ENABLED_KEY);
};

export const isAuthOnOpenEnabled = async (): Promise<boolean> => {
  const value = await readAuthOnOpenValue();

  return readAsyncStorageBoolean(value);
};

export const setAuthOnOpenEnabled = async (enabled: boolean): Promise<void> => {
  await AsyncStorage.setItem(
    AUTH_ON_OPEN_ENABLED_KEY,
    toAsyncStorageBoolean(enabled),
  );
};

export const isBiometricsOnOpenEnabled = async (): Promise<boolean> => {
  const value = await readBiometricsOnOpenValue();

  return readAsyncStorageBoolean(value);
};

export const setBiometricsOnOpenEnabled = async (
  enabled: boolean,
): Promise<void> => {
  await AsyncStorage.setItem(
    AUTH_ON_OPEN_BIOMETRICS_ENABLED_KEY,
    toAsyncStorageBoolean(enabled),
  );
};

export const deleteAuthOnOpenPreference = async (): Promise<void> => {
  await AsyncStorage.multiRemove([
    AUTH_ON_OPEN_ENABLED_KEY,
    AUTH_ON_OPEN_BIOMETRICS_ENABLED_KEY,
  ]);
  await SecureStore.deleteItemAsync(LEGACY_AUTH_ON_OPEN_SECURE_STORE_KEY);
};
