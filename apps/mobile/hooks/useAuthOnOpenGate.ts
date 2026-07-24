import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useI18n } from "@/hooks/useI18n";
import { isAuthOnOpenEnabled } from "@/lib/authOnOpenPreference";
import {
  shouldLockAuthOnResume,
  shouldRecordAuthBackgroundTimestamp,
} from "@/lib/authOnOpenResumePolicy";
import { describeSystemAuthFailure } from "@/lib/describeSystemAuthFailure";
import { requireContextSystemAuth } from "@/lib/requireContextSystemAuth";

type RunGateOptions = {
  resume?: boolean;
};

type AuthOnOpenGateState = {
  isChecking: boolean;
  isUnlocked: boolean;
  isRequired: boolean;
  hasUnlockedOnce: boolean;
  error: string | null;
  retry: () => void;
};

export const useAuthOnOpenGate = (): AuthOnOpenGateState => {
  const { t } = useI18n();
  const [isChecking, setIsChecking] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasUnlockedOnce, setHasUnlockedOnce] = useState(false);
  const [isRequired, setIsRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const gateInFlightRef = useRef(false);
  const isRequiredRef = useRef(false);
  const backgroundedAtRef = useRef<number | null>(null);

  const markUnlocked = useCallback(() => {
    setIsUnlocked(true);
    setHasUnlockedOnce(true);
    setError(null);
  }, []);

  const runGate = useCallback(
    async (options?: RunGateOptions) => {
      const isResume = options?.resume === true;

      if (gateInFlightRef.current) {
        return;
      }

      gateInFlightRef.current = true;

      if (!isResume) {
        setIsChecking(true);
      }

      setError(null);

      try {
        const enabled = await isAuthOnOpenEnabled();
        setIsRequired(enabled);
        isRequiredRef.current = enabled;

        if (!enabled) {
          markUnlocked();
          return;
        }

        const auth = await requireContextSystemAuth({
          context: "app_open",
          promptMessage: t("auth.unlockTitle"),
          cancelLabel: t("common.cancel"),
        });

        if (auth.success) {
          markUnlocked();
        } else {
          setIsUnlocked(false);
          setError(describeSystemAuthFailure(auth, t));
        }
      } finally {
        gateInFlightRef.current = false;

        if (!isResume) {
          setIsChecking(false);
        }
      }
    },
    [markUnlocked, t],
  );

  useEffect(() => {
    void runGate();
  }, [attempt, runGate]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (shouldRecordAuthBackgroundTimestamp(nextState)) {
        backgroundedAtRef.current = Date.now();
      }

      if (
        nextState === "active" &&
        (previousState === "background" || previousState === "inactive")
      ) {
        const backgroundedAt = backgroundedAtRef.current;
        backgroundedAtRef.current = null;

        if (
          backgroundedAt != null &&
          isRequiredRef.current &&
          shouldLockAuthOnResume({
            backgroundedAt,
            now: Date.now(),
          })
        ) {
          // Keep the previous screen visible; lock overlay appears only if auth fails.
          void runGate({ resume: true });
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [runGate]);

  const retry = useCallback(() => {
    setAttempt((current) => {
      return current + 1;
    });
  }, []);

  return {
    isChecking,
    isUnlocked,
    isRequired,
    hasUnlockedOnce,
    error,
    retry,
  };
};
