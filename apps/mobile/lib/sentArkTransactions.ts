import AsyncStorage from "@react-native-async-storage/async-storage";

import { RECENT_SENT_ARK_TX_KEY } from "@/lib/asyncStorageKeys";
import { recordOffboardActivityIds } from "@/lib/offboardActivityIds";

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type SentTransaction = {
  txid: string;
  sentAt: number;
  amountSats?: number;
  offboard?: boolean;
};

let inMemorySentTransactions: SentTransaction[] | null = null;

const isExpired = (entry: SentTransaction): boolean => {
  return Date.now() - entry.sentAt > MAX_AGE_MS;
};

const pruneExpired = (entries: SentTransaction[]): SentTransaction[] => {
  return entries.filter((entry) => {
    return !isExpired(entry);
  });
};

const readStoredTxid = (entry: Record<string, unknown>): string | null => {
  const { txid, arkTxid } = entry;

  if (typeof txid === "string" && txid.length > 0) {
    return txid;
  }

  if (typeof arkTxid === "string" && arkTxid.length > 0) {
    return arkTxid;
  }

  return null;
};

const parseStoredEntries = (raw: string): SentTransaction[] => {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed.flatMap((entry) => {
        if (typeof entry !== "object" || entry == null) {
          return [];
        }

        const record = entry as Record<string, unknown>;
        const txid = readStoredTxid(record);
        const { sentAt, amountSats, offboard } = record;

        if (txid == null || typeof sentAt !== "number") {
          return [];
        }

        return [
          {
            txid,
            sentAt,
            amountSats:
              typeof amountSats === "number" &&
              Number.isFinite(amountSats) &&
              amountSats > 0
                ? amountSats
                : undefined,
            offboard: offboard === true ? true : undefined,
          },
        ];
      });
    }

    if (typeof parsed === "object" && parsed != null) {
      const record = parsed as Record<string, unknown>;
      const txid = readStoredTxid(record);
      const { sentAt, amountSats, offboard } = record;

      if (txid != null && typeof sentAt === "number") {
        return [
          {
            txid,
            sentAt,
            amountSats:
              typeof amountSats === "number" &&
              Number.isFinite(amountSats) &&
              amountSats > 0
                ? amountSats
                : undefined,
            offboard: offboard === true ? true : undefined,
          },
        ];
      }
    }
  } catch {
    return [];
  }

  return [];
};

const writeSentTransactions = async (
  entries: SentTransaction[],
): Promise<SentTransaction[]> => {
  const prunedEntries = pruneExpired(entries);
  inMemorySentTransactions = prunedEntries;
  await AsyncStorage.setItem(
    RECENT_SENT_ARK_TX_KEY,
    JSON.stringify(prunedEntries),
  );
  return prunedEntries;
};

export const readSentTransactions = async (): Promise<SentTransaction[]> => {
  if (inMemorySentTransactions != null) {
    const prunedEntries = pruneExpired(inMemorySentTransactions);

    if (prunedEntries.length !== inMemorySentTransactions.length) {
      return writeSentTransactions(prunedEntries);
    }

    return prunedEntries;
  }

  const raw = await AsyncStorage.getItem(RECENT_SENT_ARK_TX_KEY);

  if (raw == null) {
    inMemorySentTransactions = [];
    return [];
  }

  const entries = pruneExpired(parseStoredEntries(raw));

  if (entries.length === 0) {
    inMemorySentTransactions = [];
    await AsyncStorage.removeItem(RECENT_SENT_ARK_TX_KEY);
    return [];
  }

  const offboardTxids = entries.flatMap((entry) => {
    if (entry.offboard !== true) {
      return [];
    }

    return [entry.txid];
  });

  if (offboardTxids.length > 0) {
    await recordOffboardActivityIds(offboardTxids);
  }

  return writeSentTransactions(entries);
};

export const recordSentTransaction = async (
  txid: string,
  options?: { amountSats?: number; offboard?: boolean },
): Promise<SentTransaction[]> => {
  const existingEntries = await readSentTransactions();
  const existing = existingEntries.find((entry) => {
    return entry.txid === txid;
  });
  const nextEntry: SentTransaction = {
    txid,
    sentAt: Date.now(),
    amountSats:
      options?.amountSats != null &&
      Number.isFinite(options.amountSats) &&
      options.amountSats > 0
        ? options.amountSats
        : existing?.amountSats,
    offboard:
      options?.offboard === true || existing?.offboard === true
        ? true
        : undefined,
  };
  const withoutDuplicate = existingEntries.filter((entry) => {
    return entry.txid !== txid;
  });

  if (nextEntry.offboard === true) {
    await recordOffboardActivityIds([txid]);
  }

  return writeSentTransactions([nextEntry, ...withoutDuplicate]);
};

export const clearSentTransactions = async (): Promise<void> => {
  inMemorySentTransactions = [];
  await AsyncStorage.removeItem(RECENT_SENT_ARK_TX_KEY);
};

export const hasRecordedSentTransaction = async (
  txid: string,
): Promise<boolean> => {
  const entries = await readSentTransactions();

  return entries.some((entry) => {
    return entry.txid === txid;
  });
};
