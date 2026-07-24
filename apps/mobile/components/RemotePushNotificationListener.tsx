import { useRemotePushNotifications } from "@/hooks/useRemotePushNotifications";
import { usePushRegistrationController } from "@/hooks/usePushRegistrationController";

export const RemotePushNotificationListener = () => {
  useRemotePushNotifications();

  usePushRegistrationController();

  return null;
};
