import type { Env } from "../lib/env.js";

export type AppConfig = {
  minimumAppVersion: string;
  minimumIosBuild: string | null;
  minimumAndroidBuild: string | null;
  iosStoreUrl: string | null;
  androidStoreUrl: string | null;
  updateMessage: string | null;
};

export const getAppConfig = (env: Env): AppConfig => {
  return {
    minimumAppVersion: env.minSupportedAppVersion,
    minimumIosBuild: env.minIosBuild,
    minimumAndroidBuild: env.minAndroidBuild,
    iosStoreUrl: env.iosStoreUrl,
    androidStoreUrl: env.androidStoreUrl,
    updateMessage: env.updateMessage,
  };
};
