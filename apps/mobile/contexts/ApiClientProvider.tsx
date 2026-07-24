import { configureApiClient } from "@21w/api-client";
import type { ReactNode } from "react";

import { getBackendConfig } from "@/lib/backendConfig";

type ApiClientProviderProps = {
  children: ReactNode;
};

export const ApiClientProvider = ({ children }: ApiClientProviderProps) => {
  const config = getBackendConfig();

  if (config != null) {
    configureApiClient(config.baseUrl);
  }

  return children;
};
