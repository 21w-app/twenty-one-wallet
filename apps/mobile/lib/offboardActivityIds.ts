import AsyncStorage from "@react-native-async-storage/async-storage";

import { OFFBOARD_ACTIVITY_IDS_KEY } from "@/lib/asyncStorageKeys";

let inMemoryTxids: string[] | null = null;

const parseStoredTxids = (raw: string): string[] => {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((entry) => {
      if (typeof entry !== "string" || entry.length === 0) {
        return [];
      }

      return [entry];
    });
  } catch {
    return [];
  }
};

const writeTxids = async (txids: string[]): Promise<string[]> => {
  const uniqueTxids = [...new Set(txids)];
  inMemoryTxids = uniqueTxids;
  await AsyncStorage.setItem(
    OFFBOARD_ACTIVITY_IDS_KEY,
    JSON.stringify(uniqueTxids),
  );
  return uniqueTxids;
};

export const readOffboardActivityIds = async (): Promise<string[]> => {
  if (inMemoryTxids != null) {
    return inMemoryTxids;
  }

  const raw = await AsyncStorage.getItem(OFFBOARD_ACTIVITY_IDS_KEY);

  if (raw == null) {
    inMemoryTxids = [];
    return [];
  }

  return writeTxids(parseStoredTxids(raw));
};

export const recordOffboardActivityIds = async (
  txids: string[],
): Promise<string[]> => {
  const existingTxids = await readOffboardActivityIds();
  const nextTxids = txids.filter((txid) => {
    return txid.length > 0;
  });

  if (nextTxids.length === 0) {
    return existingTxids;
  }

  return writeTxids([...nextTxids, ...existingTxids]);
};

export const clearOffboardActivityIds = async (): Promise<void> => {
  inMemoryTxids = [];
  await AsyncStorage.removeItem(OFFBOARD_ACTIVITY_IDS_KEY);
};
