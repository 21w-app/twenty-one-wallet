import { useCallback, useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useWallet } from "@/hooks/useWallet";
import { syncWalletPushNotificationsIfEnabled } from "@/lib/pushRegistration";

export const usePushRegistrationController = (): void => {
  const { getWallet, isReady } = useWallet();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const syncInFlightRef = useRef<Promise<void> | null>(null);

  const syncIfEnabled = useCallback(() => {
    if (syncInFlightRef.current != null) {
      return syncInFlightRef.current;
    }

    const syncPromise = syncWalletPushNotificationsIfEnabled({
      wallet: isReady ? getWallet() : null,
    }).finally(() => {
      if (syncInFlightRef.current === syncPromise) {
        syncInFlightRef.current = null;
      }
    });

    syncInFlightRef.current = syncPromise;
    return syncPromise;
  }, [getWallet, isReady]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    void syncIfEnabled();
  }, [isReady, syncIfEnabled]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (
        nextState === "active" &&
        (previousState === "background" || previousState === "inactive")
      ) {
        void syncIfEnabled();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [syncIfEnabled]);
};
