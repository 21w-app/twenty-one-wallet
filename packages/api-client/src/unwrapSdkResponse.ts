import type {
  AuthChallengeResponse,
  SyncDeviceResponse,
} from "./generated/types.gen";

export const isAuthChallengeResponse = (
  value: unknown,
): value is AuthChallengeResponse => {
  if (value == null || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.challengeId === "string" &&
    typeof record.message === "string" &&
    typeof record.expiresAtSeconds === "number"
  );
};

export const isSyncDeviceResponse = (
  value: unknown,
): value is SyncDeviceResponse => {
  if (value == null || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return typeof record.deviceId === "string";
};

export const readSdkErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (error != null && typeof error === "object" && "error" in error) {
    const message = (error as { error?: unknown }).error;

    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  }

  return fallback;
};
