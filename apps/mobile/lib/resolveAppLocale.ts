import { getLocales } from "expo-localization";

export type AppLocale = "en" | "cs";

const SUPPORTED_LOCALES: AppLocale[] = ["en", "cs"];

export const DEFAULT_APP_LOCALE: AppLocale = "en";

export const resolveDeviceAppLocale = (): AppLocale => {
  const languageCode = getLocales()[0]?.languageCode?.toLowerCase();

  if (languageCode == null) {
    return DEFAULT_APP_LOCALE;
  }

  if (languageCode === "cs" || languageCode.startsWith("cs-")) {
    return "cs";
  }

  if (SUPPORTED_LOCALES.includes(languageCode as AppLocale)) {
    return languageCode as AppLocale;
  }

  return DEFAULT_APP_LOCALE;
};

export const resolveAppLocale = resolveDeviceAppLocale;
