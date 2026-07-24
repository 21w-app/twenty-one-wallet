import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { createTranslator, type TranslateFn } from "@/lib/createTranslator";
import {
  getAppLocalePreference,
  setAppLocalePreference,
} from "@/lib/appLocalePreference";
import {
  DEFAULT_APP_LOCALE,
  resolveDeviceAppLocale,
  type AppLocale,
} from "@/lib/resolveAppLocale";

type I18nContextValue = {
  locale: AppLocale;
  t: TranslateFn;
  setLocale: (locale: AppLocale) => Promise<void>;
};

export const I18nContext = createContext<I18nContextValue | null>(null);

type I18nProviderProps = {
  children: ReactNode;
};

export const I18nProvider = ({ children }: I18nProviderProps) => {
  const hasUserSetLocaleRef = useRef(false);
  const [locale, setLocaleState] = useState<AppLocale>(resolveDeviceAppLocale);

  useEffect(() => {
    const loadLocalePreference = async () => {
      const savedLocale = await getAppLocalePreference();

      if (hasUserSetLocaleRef.current) {
        return;
      }

      if (savedLocale != null) {
        setLocaleState(savedLocale);
      }
    };

    void loadLocalePreference();
  }, []);

  const setLocale = useCallback(async (nextLocale: AppLocale) => {
    hasUserSetLocaleRef.current = true;
    await setAppLocalePreference(nextLocale);
    setLocaleState(nextLocale);
  }, []);

  const value = useMemo(() => {
    return {
      locale,
      t: createTranslator(locale),
      setLocale,
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const getDefaultI18nValue = (): I18nContextValue => {
  return {
    locale: DEFAULT_APP_LOCALE,
    t: createTranslator(DEFAULT_APP_LOCALE),
    setLocale: async () => {},
  };
};
