import { useEffect, useRef, useState } from "react";

import { useActivity } from "@/hooks/useActivity";
import { useI18n } from "@/hooks/useI18n";
import { useWallet } from "@/hooks/useWallet";
import { createTrailingAsyncQueue } from "@/lib/createTrailingAsyncQueue";
import { refreshWalletAndActivity } from "@/lib/refreshWalletAndActivity";

type UseIncomingFundsListenerResult = {
  error: string | null;
};

type ListenerEffectState = {
  isActive: boolean;
  unsubscribe: (() => void) | null;
};

export const useIncomingFundsListener = (): UseIncomingFundsListenerResult => {
  const { t } = useI18n();
  const { getWallet, status, syncInBackground } = useWallet();
  const { refresh } = useActivity();
  const [error, setError] = useState<string | null>(null);
  const refreshQueueRef = useRef(createTrailingAsyncQueue());

  useEffect(() => {
    if (status !== "ready") {
      setError(null);
      return;
    }

    const wallet = getWallet();

    if (wallet == null) {
      setError(null);
      return;
    }

    const effectState: ListenerEffectState = {
      isActive: true,
      unsubscribe: null,
    };

    const handleIncomingFunds = async () => {
      try {
        await refreshWalletAndActivity({ syncInBackground, refresh });

        if (effectState.isActive) {
          setError(null);
        }
      } catch {
        if (effectState.isActive) {
          setError(t("activity.incomingFundsRefreshFailed"));
        }
      }
    };

    const queueIncomingFundsRefresh = () => {
      if (!effectState.isActive) {
        return;
      }

      void refreshQueueRef.current.enqueue(handleIncomingFunds);
    };

    const subscribe = async () => {
      try {
        const unsubscribe = await wallet.notifyIncomingFunds(() => {
          queueIncomingFundsRefresh();
        });

        if (!effectState.isActive) {
          unsubscribe();
          return;
        }

        effectState.unsubscribe = unsubscribe;
      } catch {
        if (effectState.isActive) {
          setError(t("activity.liveReceiveUnavailable"));
        }
      }
    };

    void subscribe();

    return () => {
      effectState.isActive = false;

      if (effectState.unsubscribe != null) {
        effectState.unsubscribe();
      }
    };
  }, [getWallet, refresh, status, syncInBackground, t]);

  return { error };
};
