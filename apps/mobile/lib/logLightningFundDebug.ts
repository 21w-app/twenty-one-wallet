import { formatLightningFundError } from "@/lib/formatLightningFundError";

const LOG_PREFIX = "[21W:lightning-fund]";

export const logLightningFundDebug = (
  scope: string,
  message: string,
  details?: Record<string, unknown>,
): void => {
  if (!__DEV__) {
    return;
  }

  if (details == null) {
    console.log(`${LOG_PREFIX} [${scope}] ${message}`);
    return;
  }

  console.log(`${LOG_PREFIX} [${scope}] ${message}`, details);
};

export const logLightningFundError = (
  scope: string,
  message: string,
  error: unknown,
  details?: Record<string, unknown>,
): void => {
  if (!__DEV__) {
    return;
  }

  console.error(`${LOG_PREFIX} [${scope}] ${message}`, {
    ...details,
    error: formatLightningFundError(error),
    rawError: error,
  });
};
