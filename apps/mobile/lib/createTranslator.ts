import { cs } from "@/locales/cs";
import { en } from "@/locales/en";
import type { MessageKey, Messages } from "@/locales/types";
import type { AppLocale } from "@/lib/resolveAppLocale";

const messagesByLocale: Record<AppLocale, Messages> = {
  en,
  cs,
};

export type TranslateParams = Record<string, string | number>;

export type TranslateFn = (key: MessageKey, params?: TranslateParams) => string;

const getNestedMessage = (
  messages: Messages,
  key: MessageKey,
): string | undefined => {
  const parts = key.split(".");
  let current: unknown = messages;

  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  if (typeof current !== "string") {
    return undefined;
  }

  return current;
};

const interpolate = (template: string, params?: TranslateParams): string => {
  if (params == null) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (_match, paramKey: string) => {
    const value = params[paramKey];

    if (value == null) {
      return "";
    }

    return String(value);
  });
};

export const createTranslator = (locale: AppLocale): TranslateFn => {
  const messages = messagesByLocale[locale];
  const fallbackMessages = messagesByLocale.en;

  return (key, params) => {
    const template =
      getNestedMessage(messages, key) ??
      getNestedMessage(fallbackMessages, key);

    if (template == null) {
      return key;
    }

    return interpolate(template, params);
  };
};

export const formatActivityTotalCount = (
  locale: AppLocale,
  t: TranslateFn,
  count: number,
): string => {
  if (locale === "cs") {
    if (count === 1) {
      return t("activity.totalOne", { count });
    }

    if (count >= 2 && count <= 4) {
      return t("activity.totalFew", { count });
    }

    return t("activity.totalMany", { count });
  }

  if (count === 1) {
    return t("activity.totalOne", { count });
  }

  return t("activity.totalMany", { count });
};
