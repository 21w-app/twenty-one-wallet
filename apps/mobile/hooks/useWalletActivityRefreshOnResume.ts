import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useActivity } from "@/hooks/useActivity";
import { useWallet } from "@/hooks/useWallet";
import { refreshWalletAndActivity } from "@/lib/refreshWalletAndActivity";

type RefreshEffectState = {
  isActive: boolean;
  refreshPromise: Promise<void> | null;
};

export const useWalletActivityRefreshOnResume = (): void => {
  const { status, syncInBackground } = useWallet();
  const { refresh } = useActivity();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (status !== "ready") {
      return;
    }

    const effectState: RefreshEffectState = {
      isActive: true,
      refreshPromise: null,
    };

    const queueRefresh = () => {
      if (!effectState.isActive || effectState.refreshPromise != null) {
        return;
      }

      const refreshPromise = refreshWalletAndActivity({
        syncInBackground,
        refresh,
      }).finally(() => {
        if (effectState.refreshPromise === refreshPromise) {
          effectState.refreshPromise = null;
        }
      });

      effectState.refreshPromise = refreshPromise;
    };

    const handleAppStateChange = (nextState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (
        nextState === "active" &&
        (previousState === "background" || previousState === "inactive")
      ) {
        queueRefresh();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      effectState.isActive = false;
      subscription.remove();
    };
  }, [refresh, status, syncInBackground]);
};
