import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { useWallet } from "@/hooks/useWallet";
import { isRemotePushEffectivelyEnabled } from "@/lib/isRemotePushEffectivelyEnabled";
import { hasSpendableVtxosExpiringSoon } from "@/lib/hasSpendableVtxosExpiringSoon";
import {
  dismissVtxoReminderPermanently,
  isVtxoReminderDue,
  snoozeVtxoReminder,
} from "@/lib/vtxoReminderPreference";

type UseVtxoReminderResult = {
  isDue: boolean;
  isLoading: boolean;
  dismissPermanently: () => Promise<void>;
  snooze: () => Promise<void>;
};

export const useVtxoReminder = (): UseVtxoReminderResult => {
  const { getWallet, status } = useWallet();
  const [isDue, setIsDue] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    try {
      const preferenceDue = await isVtxoReminderDue();

      if (!preferenceDue) {
        setIsDue(false);
        return;
      }

      const pushActive = await isRemotePushEffectivelyEnabled();

      if (pushActive) {
        setIsDue(false);
        return;
      }

      if (status !== "ready") {
        setIsDue(false);
        return;
      }

      const wallet = getWallet();

      if (wallet == null) {
        setIsDue(false);
        return;
      }

      const expiringSoon = await hasSpendableVtxosExpiringSoon(wallet);

      setIsDue(expiringSoon);
    } finally {
      setIsLoading(false);
    }
  }, [getWallet, status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        void refresh();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [refresh]);

  const dismissPermanently = useCallback(async () => {
    await dismissVtxoReminderPermanently();
    setIsDue(false);
  }, []);

  const snooze = useCallback(async () => {
    await snoozeVtxoReminder();
    setIsDue(false);
  }, []);

  return {
    isDue,
    isLoading,
    dismissPermanently,
    snooze,
  };
};
