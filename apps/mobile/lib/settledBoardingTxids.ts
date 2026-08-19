import AsyncStorage from "@react-native-async-storage/async-storage";

import { SETTLED_BOARDING_TX_KEY } from "@/lib/asyncStorageKeys";

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

type SettledBoardingTxid = {
  txid: string;
  settledAt: number;
};

let inMemoryEntries: SettledBoardingTxid[] | null = null;

const pruneExpired = (
  entries: SettledBoardingTxid[],
): SettledBoardingTxid[] => {
  const cutoff = Date.now() - MAX_AGE_MS;

  return entries.filter((entry) => {
    return entry.settledAt >= cutoff;
  });
};

const parseStoredEntries = (raw: string): SettledBoardingTxid[] => {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((entry) => {
      if (typeof entry !== "object" || entry == null) {
        return [];
      }

      const record = entry as Record<string, unknown>;
      const { txid, settledAt } = record;

      if (typeof txid !== "string" || txid.length === 0) {
        return [];
      }

      if (typeof settledAt !== "number") {
        return [];
      }

      return [{ txid, settledAt }];
    });
  } catch {
    return [];
  }
};

const writeEntries = async (
  entries: SettledBoardingTxid[],
): Promise<SettledBoardingTxid[]> => {
  const prunedEntries = pruneExpired(entries);
  inMemoryEntries = prunedEntries;
  await AsyncStorage.setItem(
    SETTLED_BOARDING_TX_KEY,
    JSON.stringify(prunedEntries),
  );
  return prunedEntries;
};

export const readSettledBoardingTxids = async (): Promise<string[]> => {
  if (inMemoryEntries != null) {
    const prunedEntries = pruneExpired(inMemoryEntries);

    if (prunedEntries.length !== inMemoryEntries.length) {
      return (await writeEntries(prunedEntries)).map((entry) => {
        return entry.txid;
      });
    }

    return prunedEntries.map((entry) => {
      return entry.txid;
    });
  }

  const raw = await AsyncStorage.getItem(SETTLED_BOARDING_TX_KEY);

  if (raw == null) {
    inMemoryEntries = [];
    return [];
  }

  const entries = pruneExpired(parseStoredEntries(raw));
  const stored = await writeEntries(entries);

  return stored.map((entry) => {
    return entry.txid;
  });
};

export const recordSettledBoardingTxids = async (
  txids: string[],
): Promise<string[]> => {
  const existingEntries = await readSettledBoardingTxids();
  const existingSet = new Set(existingEntries);
  const settledAt = Date.now();
  const current = inMemoryEntries ?? [];
  const newEntries = txids.flatMap((txid) => {
    if (txid.length === 0 || existingSet.has(txid)) {
      return [];
    }

    return [{ txid, settledAt }];
  });

  return (await writeEntries([...newEntries, ...current])).map((entry) => {
    return entry.txid;
  });
};

export const hasSettledBoardingTxid = async (
  txid: string,
): Promise<boolean> => {
  const txids = await readSettledBoardingTxids();

  return txids.includes(txid);
};

export const clearSettledBoardingTxids = async (): Promise<void> => {
  inMemoryEntries = [];
  await AsyncStorage.removeItem(SETTLED_BOARDING_TX_KEY);
};
