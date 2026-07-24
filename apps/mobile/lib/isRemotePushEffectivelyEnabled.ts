import { getPushPermissionStatus } from "@/lib/getPushPermissionStatus";
import { isPushNotificationsEnabled } from "@/lib/pushNotificationsPreference";

export const isRemotePushEffectivelyEnabled = async (): Promise<boolean> => {
  const [preferenceEnabled, permissionStatus] = await Promise.all([
    isPushNotificationsEnabled(),
    getPushPermissionStatus(),
  ]);

  return preferenceEnabled && permissionStatus.granted;
};
