import * as LocalAuthentication from "expo-local-authentication";
import type { LocalAuthenticationError } from "expo-local-authentication";

import { isSystemAuthAvailable } from "@/lib/isSystemAuthAvailable";

export type SystemAuthFailureReason = "unavailable" | "cancelled" | "failed";

export type SystemAuthResult =
  | { success: true }
  | {
      success: false;
      reason: SystemAuthFailureReason;
      error?: LocalAuthenticationError;
    };

type RequireSystemAuthOptions = {
  promptMessage?: string;
  cancelLabel?: string;
  biometricsRequired?: boolean;
  disableDeviceFallback?: boolean;
};

export const requireSystemAuth = async (
  options: RequireSystemAuthOptions = {},
): Promise<SystemAuthResult> => {
  const biometricsRequired = options.biometricsRequired ?? false;
  const disableDeviceFallback = options.disableDeviceFallback ?? false;

  if (!biometricsRequired) {
    const isAvailable = await isSystemAuthAvailable();

    if (!isAvailable) {
      return { success: false, reason: "unavailable" };
    }
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: options.promptMessage ?? "Authenticate to continue",
    cancelLabel: options.cancelLabel ?? "Cancel",
    disableDeviceFallback,
  });

  if (result.success) {
    return { success: true };
  }

  if (result.error === "user_cancel" || result.error === "user_fallback") {
    return { success: false, reason: "cancelled", error: result.error };
  }

  if (
    result.error === "not_available" ||
    result.error === "not_enrolled" ||
    result.error === "passcode_not_set"
  ) {
    return { success: false, reason: "unavailable", error: result.error };
  }

  return { success: false, reason: "failed", error: result.error };
};
