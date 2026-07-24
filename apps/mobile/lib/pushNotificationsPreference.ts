import AsyncStorage from "@react-native-async-storage/async-storage";

import { PUSH_NOTIFICATIONS_ENABLED_KEY } from "@/lib/asyncStorageKeys";
import {
  readAsyncStorageBoolean,
  toAsyncStorageBoolean,
} from "@/lib/readAsyncStorageBoolean";

type PushPreferenceListener = () => void;

const listeners = new Set<PushPreferenceListener>();

const notifyListeners = (): void => {
  listeners.forEach((listener) => {
    listener();
  });
};

export const subscribePushNotificationsPreference = (
  listener: PushPreferenceListener,
): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export const isPushNotificationsEnabled = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(PUSH_NOTIFICATIONS_ENABLED_KEY);

  return readAsyncStorageBoolean(value);
};

export const setPushNotificationsEnabled = async (
  enabled: boolean,
): Promise<void> => {
  await AsyncStorage.setItem(
    PUSH_NOTIFICATIONS_ENABLED_KEY,
    toAsyncStorageBoolean(enabled),
  );
  notifyListeners();
};

export const deletePushNotificationsPreference = async (): Promise<void> => {
  await AsyncStorage.removeItem(PUSH_NOTIFICATIONS_ENABLED_KEY);
  notifyListeners();
};
