import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export const migrateSecureStoreStringToAsyncStorage = async (
  asyncStorageKey: string,
  secureStoreKey: string,
): Promise<string | null> => {
  const asyncValue = await AsyncStorage.getItem(asyncStorageKey);

  if (asyncValue != null) {
    return asyncValue;
  }

  const secureValue = await SecureStore.getItemAsync(secureStoreKey);

  if (secureValue == null) {
    return null;
  }

  await AsyncStorage.setItem(asyncStorageKey, secureValue);
  await SecureStore.deleteItemAsync(secureStoreKey);

  return secureValue;
};
