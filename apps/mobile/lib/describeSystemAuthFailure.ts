import type { LocalAuthenticationError } from "expo-local-authentication";

import type { TranslateFn } from "@/lib/createTranslator";
import { isExpoGo } from "@/lib/isExpoGo";
import type { SystemAuthFailureReason } from "@/lib/requireSystemAuth";

type SystemAuthFailure = {
  reason: SystemAuthFailureReason;
  error?: LocalAuthenticationError;
};

const describeAuthError = (
  error: LocalAuthenticationError | undefined,
  t: TranslateFn,
): string | null => {
  if (error == null) {
    return null;
  }

  if (error === "not_available" && isExpoGo()) {
    return t("auth.errors.notAvailableExpoGo");
  }

  if (error === "not_available") {
    return t("auth.errors.deviceAuthNotAvailable");
  }

  if (error === "user_fallback") {
    return t("auth.errors.switchedToPasscode");
  }

  if (error === "lockout") {
    return t("auth.errors.lockout");
  }

  if (error === "authentication_failed") {
    return t("auth.errors.authFailed");
  }

  if (error === "not_enrolled") {
    return t("auth.errors.setupBiometrics");
  }

  if (error === "passcode_not_set") {
    return t("auth.errors.setupPasscode");
  }

  return null;
};

export const describeSystemAuthFailure = (
  failure: SystemAuthFailure,
  t: TranslateFn,
): string => {
  if (failure.reason === "cancelled") {
    return t("auth.errors.authCancelled");
  }

  if (failure.reason === "unavailable") {
    return t("auth.errors.deviceAuthNotEnrolled");
  }

  const errorMessage = describeAuthError(failure.error, t);

  if (errorMessage != null) {
    return errorMessage;
  }

  return t("auth.errors.identityVerifyFailed");
};
