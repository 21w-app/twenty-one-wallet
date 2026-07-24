import * as Application from "expo-application";
import Constants from "expo-constants";

export type AppVersionInfo = {
  appVersion: string;
  nativeBuild: string | null;
};

export const getAppVersionInfo = (): AppVersionInfo => {
  const appVersion =
    Application.nativeApplicationVersion ??
    Constants.expoConfig?.version ??
    "1.0.0";
  const nativeBuild = Application.nativeBuildVersion ?? null;

  return {
    appVersion,
    nativeBuild,
  };
};
