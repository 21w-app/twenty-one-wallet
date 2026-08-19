import AsyncStorage from "@react-native-async-storage/async-storage";

const HANDLED_PUSH_NOTIFICATION_ID_KEY = "handled_push_notification_id";

export const readHandledPushNotificationId = async (): Promise<
  string | null
> => {
  return AsyncStorage.getItem(HANDLED_PUSH_NOTIFICATION_ID_KEY);
};

export const writeHandledPushNotificationId = async (
  identifier: string,
): Promise<void> => {
  await AsyncStorage.setItem(HANDLED_PUSH_NOTIFICATION_ID_KEY, identifier);
};
