import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { getPushPermissionStatus } from "@/lib/getPushPermissionStatus";
import { createTranslator } from "@/lib/createTranslator";
import { resolveAppLocale } from "@/lib/resolveAppLocale";
import { requestPushPermission } from "@/lib/requestPushPermission";

export type ExpoPushTokenResult =
  | { token: string }
  | { token: null; reason: "denied" | "unavailable" | "error" };

type GetExpoPushTokenOptions = {
  requestPermission?: boolean;
};

const ensureAndroidNotificationChannel = async () => {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync("default", {
    name: createTranslator(resolveAppLocale())("notifications.channelDefault"),
    importance: Notifications.AndroidImportance.DEFAULT,
  });
};

const readEasProjectId = (): string | null => {
  const extra = Constants.expoConfig?.extra;
  const eas = extra?.eas;

  if (eas == null || typeof eas !== "object") {
    return null;
  }

  const projectId = (eas as { projectId?: unknown }).projectId;

  if (typeof projectId !== "string" || projectId.trim().length === 0) {
    return null;
  }

  return projectId;
};

export const getExpoPushToken = async (
  options: GetExpoPushTokenOptions = {},
): Promise<ExpoPushTokenResult> => {
  const requestPermission = options.requestPermission ?? false;

  if (requestPermission) {
    const permission = await requestPushPermission();

    if (!permission.granted) {
      return { token: null, reason: permission.reason };
    }
  } else {
    const status = await getPushPermissionStatus();

    if (!status.granted) {
      if (status.reason === "denied") {
        return { token: null, reason: "denied" };
      }

      return { token: null, reason: "unavailable" };
    }
  }

  await ensureAndroidNotificationChannel();

  const projectId = readEasProjectId();

  if (projectId == null) {
    return { token: null, reason: "error" };
  }

  try {
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    return { token: tokenResponse.data };
  } catch {
    return { token: null, reason: "error" };
  }
};
