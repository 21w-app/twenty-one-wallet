import AsyncStorage from "@react-native-async-storage/async-storage";

import { VTXO_REMINDER_PREFERENCE_KEY } from "@/lib/asyncStorageKeys";

const VTXO_REMINDER_DISMISSED_PERMANENTLY = "dismissed";
const VTXO_REMINDER_SNOOZE_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

const parseSnoozeUntil = (value: string): number | null => {
  const until = Number(value);

  if (!Number.isFinite(until)) {
    return null;
  }

  return until;
};

export const isVtxoReminderDue = async (): Promise<boolean> => {
  const value = await AsyncStorage.getItem(VTXO_REMINDER_PREFERENCE_KEY);

  if (value == null) {
    return true;
  }

  if (value === VTXO_REMINDER_DISMISSED_PERMANENTLY) {
    return false;
  }

  const until = parseSnoozeUntil(value);

  if (until == null) {
    return true;
  }

  return Date.now() >= until;
};

export const snoozeVtxoReminder = async (): Promise<void> => {
  const until = Date.now() + VTXO_REMINDER_SNOOZE_DAYS * DAY_MS;

  await AsyncStorage.setItem(VTXO_REMINDER_PREFERENCE_KEY, String(until));
};

export const dismissVtxoReminderPermanently = async (): Promise<void> => {
  await AsyncStorage.setItem(
    VTXO_REMINDER_PREFERENCE_KEY,
    VTXO_REMINDER_DISMISSED_PERMANENTLY,
  );
};

export const clearVtxoReminderPreference = async (): Promise<void> => {
  await AsyncStorage.removeItem(VTXO_REMINDER_PREFERENCE_KEY);
};

export const vtxoReminderSnoozeDays = VTXO_REMINDER_SNOOZE_DAYS;
