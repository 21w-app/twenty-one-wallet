import type { MessageKey } from "@/locales/types";
import type { AppLocale } from "@/lib/resolveAppLocale";

export type AppLocaleOption = {
  locale: AppLocale;
  flag: string;
  labelKey: MessageKey;
};

export const APP_LOCALE_OPTIONS: AppLocaleOption[] = [
  {
    locale: "en",
    flag: "🇬🇧",
    labelKey: "settings.languageEnglish",
  },
  {
    locale: "cs",
    flag: "🇨🇿",
    labelKey: "settings.languageCzech",
  },
];
