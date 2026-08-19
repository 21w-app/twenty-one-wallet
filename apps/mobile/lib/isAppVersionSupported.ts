import { Platform } from "react-native";

import { compareSemver } from "@/lib/compareSemver";
import type { AppConfig } from "@21w/api-client";
import type { AppVersionInfo } from "@/lib/getAppVersionInfo";

export const isAppVersionSupported = (
  appConfig: AppConfig,
  versionInfo: AppVersionInfo,
): boolean => {
  if (compareSemver(versionInfo.appVersion, appConfig.minimumAppVersion) < 0) {
    return false;
  }

  if (appConfig.minimumIosBuild != null && versionInfo.nativeBuild != null) {
    const currentBuild = Number.parseInt(versionInfo.nativeBuild, 10);
    const minimumBuild = Number.parseInt(appConfig.minimumIosBuild, 10);

    if (!Number.isFinite(currentBuild) || !Number.isFinite(minimumBuild)) {
      return true;
    }

    if (currentBuild < minimumBuild) {
      return false;
    }
  }

  if (
    appConfig.minimumAndroidBuild != null &&
    versionInfo.nativeBuild != null
  ) {
    const currentBuild = Number.parseInt(versionInfo.nativeBuild, 10);
    const minimumBuild = Number.parseInt(appConfig.minimumAndroidBuild, 10);

    if (!Number.isFinite(currentBuild) || !Number.isFinite(minimumBuild)) {
      return true;
    }

    if (currentBuild < minimumBuild) {
      return false;
    }
  }

  return true;
};

export const getStoreUrlForPlatform = (appConfig: AppConfig): string | null => {
  if (Platform.OS === "ios") {
    return appConfig.iosStoreUrl;
  }

  return appConfig.androidStoreUrl;
};
