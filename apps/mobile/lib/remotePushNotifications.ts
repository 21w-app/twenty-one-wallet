import { AppState } from "react-native";
import type { Notification, NotificationResponse } from "expo-notifications";
import * as Notifications from "expo-notifications";

import {
  isIncomingFundsPushData,
  readTxidFromPushData,
} from "@/lib/shouldSuppressIncomingFundsPush";

export type RemotePushSubscriptionCallbacks = {
  onNotificationReceived: (notification: Notification) => void;
  onNotificationResponse: (response: NotificationResponse) => void;
};

type IncomingFundsPushFilter = (input: {
  txid: string | null;
}) => Promise<boolean>;

let incomingFundsPushFilter: IncomingFundsPushFilter | null = null;

export const setIncomingFundsPushFilter = (
  filter: IncomingFundsPushFilter | null,
): void => {
  incomingFundsPushFilter = filter;
};

const suppressNotification = () => {
  return {
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  };
};

export const initializeRemotePushNotifications = () => {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const isForeground = AppState.currentState === "active";
      const data = notification.request.content.data;

      if (typeof data === "object" && data != null && !Array.isArray(data)) {
        const pushData = data as Record<string, unknown>;

        if (
          isIncomingFundsPushData(pushData) &&
          incomingFundsPushFilter != null
        ) {
          const txid = readTxidFromPushData(pushData);
          const suppress = await incomingFundsPushFilter({
            txid,
          });

          if (suppress) {
            return suppressNotification();
          }
        }
      }

      return {
        shouldShowBanner: isForeground,
        shouldShowList: isForeground,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    },
  });
};

export const subscribeRemotePushNotifications = (
  callbacks: RemotePushSubscriptionCallbacks,
) => {
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      callbacks.onNotificationReceived(notification);
    },
  );

  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener((response) => {
      callbacks.onNotificationResponse(response);
    });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
};
