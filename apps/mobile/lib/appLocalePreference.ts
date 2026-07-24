import AsyncStorage from "@react-native-async-storage/async-storage";

import { APP_LOCALE_PREFERENCE_KEY } from "@/lib/asyncStorageKeys";
import type { AppLocale } from "@/lib/resolveAppLocale";

const isAppLocale = (value: string): value is AppLocale => {
  return value === "en" || value === "cs";
};

export const getAppLocalePreference = async (): Promise<AppLocale | null> => {
  const value = await AsyncStorage.getItem(APP_LOCALE_PREFERENCE_KEY);

  if (value == null || !isAppLocale(value)) {
    return null;
  }

  return value;
};

export const setAppLocalePreference = async (
  locale: AppLocale,
): Promise<void> => {
  await AsyncStorage.setItem(APP_LOCALE_PREFERENCE_KEY, locale);
};
