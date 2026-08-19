type LightningFundErrorDetails = {
  name: string;
  message: string;
  statusCode?: number;
  errorData?: unknown;
  isClaimable?: boolean;
  isRefundable?: boolean;
  cause?: string;
};

const readOptionalNumber = (value: unknown): number | undefined => {
  return typeof value === "number" ? value : undefined;
};

const readOptionalBoolean = (value: unknown): boolean | undefined => {
  return typeof value === "boolean" ? value : undefined;
};

const readCauseMessage = (cause: unknown): string | undefined => {
  if (cause instanceof Error) {
    return cause.message;
  }

  if (typeof cause === "string") {
    return cause;
  }

  return undefined;
};

export const formatLightningFundError = (
  error: unknown,
): LightningFundErrorDetails => {
  if (error instanceof Error) {
    const record = error as Error & {
      statusCode?: unknown;
      errorData?: unknown;
      isClaimable?: unknown;
      isRefundable?: unknown;
    };

    return {
      name: error.name,
      message: error.message,
      statusCode: readOptionalNumber(record.statusCode),
      errorData: record.errorData,
      isClaimable: readOptionalBoolean(record.isClaimable),
      isRefundable: readOptionalBoolean(record.isRefundable),
      cause: readCauseMessage(error.cause),
    };
  }

  return {
    name: "UnknownError",
    message: String(error),
  };
};

export const formatLightningFundErrorForDisplay = (error: unknown): string => {
  const details = formatLightningFundError(error);
  const lines = [`${details.name}: ${details.message}`];

  if (details.statusCode != null) {
    lines.push(`statusCode: ${details.statusCode}`);
  }

  if (details.errorData != null) {
    try {
      lines.push(`errorData: ${JSON.stringify(details.errorData)}`);
    } catch {
      lines.push("errorData: [unserializable]");
    }
  }

  if (details.isClaimable != null) {
    lines.push(`isClaimable: ${details.isClaimable}`);
  }

  if (details.isRefundable != null) {
    lines.push(`isRefundable: ${details.isRefundable}`);
  }

  if (details.cause != null) {
    lines.push(`cause: ${details.cause}`);
  }

  return lines.join("\n");
};
