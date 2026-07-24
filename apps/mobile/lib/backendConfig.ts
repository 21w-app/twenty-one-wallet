import Constants from "expo-constants";

import { resolveBackendBaseUrl } from "@/lib/resolveBackendBaseUrl";

export type BackendConfig = {
  baseUrl: string;
};

export const getBackendConfig = (): BackendConfig => {
  const extra = Constants.expoConfig?.extra;
  const extraBackendUrl =
    extra != null && typeof extra.backendUrl === "string"
      ? extra.backendUrl
      : null;

  return {
    baseUrl: resolveBackendBaseUrl({
      envUrl: process.env.EXPO_PUBLIC_BACKEND_URL,
      extraUrl: extraBackendUrl,
      isDev: __DEV__,
    }),
  };
};
