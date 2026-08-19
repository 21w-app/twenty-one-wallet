import * as Notifications from "expo-notifications";

import { isExpoGo } from "@/lib/isExpoGo";

export type PushPermissionResult =
  | { granted: true }
  | { granted: false; reason: "denied" | "unavailable" };

export const requestPushPermission =
  async (): Promise<PushPermissionResult> => {
    if (isExpoGo()) {
      return { granted: false, reason: "unavailable" };
    }

    const current = await Notifications.getPermissionsAsync();

    if (current.granted) {
      return { granted: true };
    }

    if (!current.canAskAgain) {
      return { granted: false, reason: "denied" };
    }

    const requested = await Notifications.requestPermissionsAsync();

    if (requested.granted) {
      return { granted: true };
    }

    return { granted: false, reason: "denied" };
  };
