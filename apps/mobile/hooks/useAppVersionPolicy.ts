import { useAppConfigQuery } from "@21w/api-client";

import { getBackendConfig } from "@/lib/backendConfig";
import { getAppVersionInfo } from "@/lib/getAppVersionInfo";
import {
  getStoreUrlForPlatform,
  isAppVersionSupported,
} from "@/lib/isAppVersionSupported";
import { shouldBypassForceUpdate } from "@/lib/shouldBypassForceUpdate";

export type AppVersionPolicyState = {
  isLoading: boolean;
  isBlocked: boolean;
  updateMessage: string | null;
  storeUrl: string | null;
};

export const useAppVersionPolicy = (): AppVersionPolicyState => {
  const backendConfig = getBackendConfig();
  const bypassForceUpdate = shouldBypassForceUpdate();
  const queryEnabled = !bypassForceUpdate && backendConfig != null;
  const { data, isLoading, isError } = useAppConfigQuery({
    enabled: queryEnabled,
  });

  if (bypassForceUpdate || backendConfig == null) {
    return {
      isLoading: false,
      isBlocked: false,
      updateMessage: null,
      storeUrl: null,
    };
  }

  if (isLoading) {
    return {
      isLoading: true,
      isBlocked: false,
      updateMessage: null,
      storeUrl: null,
    };
  }

  if (isError || data == null) {
    return {
      isLoading: false,
      isBlocked: false,
      updateMessage: null,
      storeUrl: null,
    };
  }

  const versionInfo = getAppVersionInfo();
  const supported = isAppVersionSupported(data, versionInfo);

  return {
    isLoading: false,
    isBlocked: !supported,
    updateMessage: data.updateMessage,
    storeUrl: getStoreUrlForPlatform(data),
  };
};
