import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef } from "react";

import { useActivity } from "@/hooks/useActivity";
import { useWallet } from "@/hooks/useWallet";
import {
  readHandledPushNotificationId,
  writeHandledPushNotificationId,
} from "@/lib/handledPushNotificationResponse";
import { handleIncomingFundsNotificationResponse } from "@/lib/handleIncomingFundsNotificationResponse";
import {
  setIncomingFundsPushFilter,
  subscribeRemotePushNotifications,
} from "@/lib/remotePushNotifications";
import { shouldSuppressIncomingFundsPush } from "@/lib/shouldSuppressIncomingFundsPush";

export const useRemotePushNotifications = (): void => {
  const { status, syncInBackground } = useWallet();
  const { refresh } = useActivity();
  const handledNotificationIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setIncomingFundsPushFilter(async ({ txid }) => {
      return shouldSuppressIncomingFundsPush({ txid });
    });

    return () => {
      setIncomingFundsPushFilter(null);
    };
  }, []);

  const isNotificationAlreadyHandled = useCallback(
    async (identifier: string) => {
      if (handledNotificationIdsRef.current.has(identifier)) {
        return true;
      }

      const persistedIdentifier = await readHandledPushNotificationId();

      return persistedIdentifier === identifier;
    },
    [],
  );

  const markNotificationHandled = useCallback(async (identifier: string) => {
    handledNotificationIdsRef.current.add(identifier);
    await writeHandledPushNotificationId(identifier);
  }, []);

  const handleNotificationResponse = useCallback(
    async (response: Notifications.NotificationResponse) => {
      const identifier = response.notification.request.identifier;

      if (await isNotificationAlreadyHandled(identifier)) {
        return;
      }

      await markNotificationHandled(identifier);

      await handleIncomingFundsNotificationResponse({
        syncInBackground,
        refresh,
      });
    },
    [
      isNotificationAlreadyHandled,
      markNotificationHandled,
      refresh,
      syncInBackground,
    ],
  );

  useEffect(() => {
    const refreshFromPush = async () => {
      if (status !== "ready") {
        return;
      }

      try {
        await syncInBackground();
        await refresh();
      } catch {
        // Non-fatal — user can pull to refresh.
      }
    };

    return subscribeRemotePushNotifications({
      onNotificationReceived: () => {
        void refreshFromPush();
      },
      onNotificationResponse: (response) => {
        void handleNotificationResponse(response);
      },
    });
  }, [handleNotificationResponse, refresh, status, syncInBackground]);

  useEffect(() => {
    if (status !== "ready") {
      return;
    }

    const handleColdStartNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();

      if (response == null) {
        return;
      }

      await handleNotificationResponse(response);
    };

    void handleColdStartNotification();
  }, [handleNotificationResponse, status]);
};
