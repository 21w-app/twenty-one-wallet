import { useQuery } from "@tanstack/react-query";

import { getAppConfig } from "../generated/sdk.gen";
import type { AppConfig } from "../generated/types.gen";
import { readSdkErrorMessage } from "../unwrapSdkResponse";

export const appConfigQueryKey = ["appConfig"] as const;

const isAppConfig = (value: unknown): value is AppConfig => {
  if (value == null || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return typeof record.minimumAppVersion === "string";
};

const fetchAppConfig = async (): Promise<AppConfig> => {
  const response = await getAppConfig({ throwOnError: false });

  if (response.error != null) {
    throw new Error(
      readSdkErrorMessage(response.error, "App config request failed"),
    );
  }

  if (!isAppConfig(response.data)) {
    throw new Error("App config unavailable");
  }

  return response.data;
};

export const useAppConfigQuery = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: appConfigQueryKey,
    queryFn: fetchAppConfig,
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    retry: 1,
  });
};
