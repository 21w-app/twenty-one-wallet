import * as Notifications from "expo-notifications";

import { isExpoGo } from "@/lib/isExpoGo";

export type PushPermissionStatus =
  | { granted: true }
  | { granted: false; reason: "denied" | "unavailable" | "not_determined" };

export const getPushPermissionStatus =
  async (): Promise<PushPermissionStatus> => {
    if (isExpoGo()) {
      return { granted: false, reason: "unavailable" };
    }

    const current = await Notifications.getPermissionsAsync();

    if (current.granted) {
      return { granted: true };
    }

    if (current.canAskAgain) {
      return { granted: false, reason: "not_determined" };
    }

    return { granted: false, reason: "denied" };
  };
