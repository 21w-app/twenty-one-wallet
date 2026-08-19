import { useContext } from "react";

import { I18nContext, getDefaultI18nValue } from "@/contexts/I18nProvider";
import type { TranslateFn } from "@/lib/createTranslator";
import type { AppLocale } from "@/lib/resolveAppLocale";

type UseI18nResult = {
  locale: AppLocale;
  t: TranslateFn;
  setLocale: (locale: AppLocale) => Promise<void>;
};

export const useI18n = (): UseI18nResult => {
  const context = useContext(I18nContext);

  if (context == null) {
    return getDefaultI18nValue();
  }

  return context;
};
