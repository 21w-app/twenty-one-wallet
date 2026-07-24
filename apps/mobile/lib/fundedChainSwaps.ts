import AsyncStorage from "@react-native-async-storage/async-storage";

import { FUNDED_CHAIN_SWAP_IDS_KEY } from "@/lib/asyncStorageKeys";

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

type FundedChainSwap = {
  swapId: string;
  fundedAt: number;
};

let inMemoryFundedChainSwaps: FundedChainSwap[] | null = null;

const pruneExpired = (entries: FundedChainSwap[]): FundedChainSwap[] => {
  const now = Date.now();

  return entries.filter((entry) => {
    return now - entry.fundedAt <= MAX_AGE_MS;
  });
};

const parseStoredEntries = (raw: string): FundedChainSwap[] => {
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
      const { swapId, fundedAt } = record;

      if (typeof swapId !== "string" || swapId.length === 0) {
        return [];
      }

      if (typeof fundedAt !== "number") {
        return [];
      }

      return [{ swapId, fundedAt }];
    });
  } catch {
    return [];
  }
};

const writeFundedChainSwaps = async (
  entries: FundedChainSwap[],
): Promise<FundedChainSwap[]> => {
  const prunedEntries = pruneExpired(entries);
  inMemoryFundedChainSwaps = prunedEntries;
  await AsyncStorage.setItem(
    FUNDED_CHAIN_SWAP_IDS_KEY,
    JSON.stringify(prunedEntries),
  );
  return prunedEntries;
};

export const readFundedChainSwapIds = async (): Promise<Set<string>> => {
  if (inMemoryFundedChainSwaps != null) {
    const prunedEntries = pruneExpired(inMemoryFundedChainSwaps);

    if (prunedEntries.length !== inMemoryFundedChainSwaps.length) {
      await writeFundedChainSwaps(prunedEntries);
    }

    return new Set(prunedEntries.map((entry) => entry.swapId));
  }

  const raw = await AsyncStorage.getItem(FUNDED_CHAIN_SWAP_IDS_KEY);

  if (raw == null) {
    inMemoryFundedChainSwaps = [];
    return new Set();
  }

  const entries = pruneExpired(parseStoredEntries(raw));

  if (entries.length === 0) {
    inMemoryFundedChainSwaps = [];
    await AsyncStorage.removeItem(FUNDED_CHAIN_SWAP_IDS_KEY);
    return new Set();
  }

  const writtenEntries = await writeFundedChainSwaps(entries);

  return new Set(writtenEntries.map((entry) => entry.swapId));
};

export const recordFundedChainSwap = async (
  swapId: string,
): Promise<Set<string>> => {
  const existingIds = await readFundedChainSwapIds();
  const existingEntries = inMemoryFundedChainSwaps ?? [];
  const nextEntry: FundedChainSwap = { swapId, fundedAt: Date.now() };
  const withoutDuplicate = existingEntries.filter((entry) => {
    return entry.swapId !== swapId && existingIds.has(entry.swapId);
  });
  const entries = await writeFundedChainSwaps([nextEntry, ...withoutDuplicate]);

  return new Set(entries.map((entry) => entry.swapId));
};

export const clearFundedChainSwaps = async (): Promise<void> => {
  inMemoryFundedChainSwaps = [];
  await AsyncStorage.removeItem(FUNDED_CHAIN_SWAP_IDS_KEY);
};
