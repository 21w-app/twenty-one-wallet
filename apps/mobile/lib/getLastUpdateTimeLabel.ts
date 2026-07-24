import { getLocales } from "expo-localization";
import * as Updates from "expo-updates";

export const getLastUpdateTimeLabel = (): string | null => {
  if (!Updates.isEnabled) {
    return null;
  }

  const createdAt = Updates.createdAt;

  if (createdAt == null) {
    return null;
  }

  const locale = getLocales()[0]?.languageTag;

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(createdAt);
};
