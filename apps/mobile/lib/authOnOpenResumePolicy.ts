import type { AppStateStatus } from "react-native";

export const AUTH_ON_OPEN_RESUME_LOCK_MS = 3 * 60 * 1000;

export const shouldRecordAuthBackgroundTimestamp = (
  nextState: AppStateStatus,
): boolean => {
  return nextState === "background";
};

export const shouldLockAuthOnResume = ({
  backgroundedAt,
  now,
  lockAfterMs = AUTH_ON_OPEN_RESUME_LOCK_MS,
}: {
  backgroundedAt: number | null;
  now: number;
  lockAfterMs?: number;
}): boolean => {
  if (backgroundedAt == null) {
    return false;
  }

  return now - backgroundedAt >= lockAfterMs;
};
