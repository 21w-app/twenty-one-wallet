import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useI18n } from "@/hooks/useI18n";
import { useWallet } from "@/hooks/useWallet";
import type { ActivityItem } from "@/lib/activityTypes";
import { readArkSentAmountOverridesMap } from "@/lib/arkSentAmountOverrides";
import { collectOffboardActivityIds } from "@/lib/collectOffboardActivityIds";
import {
  collectOffboardTransactionIds,
  mapArkTransactionToActivity,
} from "@/lib/mapArkTransaction";
import { collectBoardingTxidsToSkip } from "@/lib/collectBoardingTxidsToSkip";
import { createTrailingAsyncQueue } from "@/lib/createTrailingAsyncQueue";
import { mapBoardingUtxosToActivity } from "@/lib/mapBoardingUtxosToActivity";
import { mergeActivityItems } from "@/lib/mergeActivityItems";
import { readOffboardActivityIds } from "@/lib/offboardActivityIds";
import {
  readSentTransactions,
  recordSentTransaction,
  type SentTransaction,
} from "@/lib/sentArkTransactions";
import { settleConfirmedBoardingIfNeeded } from "@/lib/settleConfirmedBoardingIfNeeded";
import { readSettledBoardingTxids } from "@/lib/settledBoardingTxids";
import { syncWallet } from "@/lib/syncWallet";
import {
  clearWalletViewCacheIfSyncedAt,
  readWalletViewCache,
  WALLET_VIEW_CACHE_LIMIT,
  writeWalletViewCache,
} from "@/lib/walletViewCache";

const PENDING_BOARDING_REFRESH_MS = 5_000;

type ActivityContextValue = {
  items: ActivityItem[];
  sentTransactions: SentTransaction[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  recordFailedPayment: (item: Omit<ActivityItem, "id" | "status">) => void;
  recordSentTx: (
    txid: string,
    options?: { amountSats?: number; offboard?: boolean },
  ) => Promise<void>;
  clearActivity: () => void;
};

export const ActivityContext = createContext<ActivityContextValue | null>(null);

type ActivityProviderProps = {
  children: ReactNode;
};

export const ActivityProvider = ({ children }: ActivityProviderProps) => {
  const { t } = useI18n();
  const { isReady, getWallet, syncInBackground } = useWallet();
  const [arkItems, setArkItems] = useState<ActivityItem[]>([]);
  const [boardingItems, setBoardingItems] = useState<ActivityItem[]>([]);
  const [failedItems, setFailedItems] = useState<ActivityItem[]>([]);
  const [sentTransactions, setSentTransactions] = useState<SentTransaction[]>(
    [],
  );
  const [cachedItems, setCachedItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const failedItemsRef = useRef<ActivityItem[]>([]);
  const refreshQueueRef = useRef(createTrailingAsyncQueue());
  const initialActivityLoadDoneRef = useRef(false);
  const activitySessionRef = useRef(0);

  failedItemsRef.current = failedItems;

  const clearActivity = useCallback(() => {
    activitySessionRef.current += 1;
    setArkItems([]);
    setBoardingItems([]);
    setFailedItems([]);
    setSentTransactions([]);
    setCachedItems([]);
    setError(null);
    setIsLoading(false);
    initialActivityLoadDoneRef.current = false;
  }, []);

  const refresh = useCallback(async () => {
    const wallet = getWallet();

    if (wallet == null) {
      return;
    }

    await refreshQueueRef.current.enqueue(async () => {
      const session = activitySessionRef.current;

      setIsLoading(true);
      setError(null);

      try {
        try {
          await syncWallet(wallet);
        } catch {
          // Best-effort — still load history when sync fails.
        }

        try {
          const settled = await settleConfirmedBoardingIfNeeded(wallet);

          if (settled.onboarded) {
            await syncWallet(wallet);
          }
        } catch {
          // Leave pending boarding visible; Fund can retry settle.
        }

        const [
          history,
          vtxos,
          overrides,
          boardingUtxos,
          storedSentTransactions,
          settledBoardingTxids,
          durableOffboardTxids,
        ] = await Promise.all([
          wallet.getTransactionHistory(),
          wallet.getVtxos({ withRecoverable: false }),
          readArkSentAmountOverridesMap(),
          wallet.getBoardingUtxos(),
          readSentTransactions(),
          readSettledBoardingTxids(),
          readOffboardActivityIds(),
        ]);

        if (getWallet() !== wallet || activitySessionRef.current !== session) {
          return;
        }

        const offboardTxids = collectOffboardTransactionIds(history, {
          offboardTxids: collectOffboardActivityIds(
            storedSentTransactions,
            durableOffboardTxids,
          ),
          overrides,
          sentTransactions: storedSentTransactions,
          vtxos,
        });
        const mapOptions = { overrides, vtxos, offboardTxids };
        const mappedArk = history.map((tx) => {
          return mapArkTransactionToActivity(tx, mapOptions);
        });
        const skippedBoardingTxids = collectBoardingTxidsToSkip(
          history,
          settledBoardingTxids,
        );
        const nextBoardingItems = mapBoardingUtxosToActivity(
          boardingUtxos,
          skippedBoardingTxids,
        );

        setArkItems(mappedArk);
        setBoardingItems(nextBoardingItems);
        setSentTransactions(storedSentTransactions);
        setCachedItems([]);

        const mergedItems = mergeActivityItems(
          mappedArk,
          nextBoardingItems,
          failedItemsRef.current,
        ).items;

        const syncedAt = Date.now();

        await writeWalletViewCache({
          activityItems: mergedItems.slice(0, WALLET_VIEW_CACHE_LIMIT),
          syncedAt,
        });

        if (getWallet() !== wallet || activitySessionRef.current !== session) {
          await clearWalletViewCacheIfSyncedAt(syncedAt);
        }

        try {
          await syncInBackground();
        } catch {
          // Activity is already updated; Home can still pull to refresh balance.
        }
      } catch {
        if (getWallet() !== wallet || activitySessionRef.current !== session) {
          return;
        }

        setError(t("activity.loadFailed"));
      } finally {
        if (getWallet() === wallet && activitySessionRef.current === session) {
          setIsLoading(false);
        }
      }
    });
  }, [getWallet, syncInBackground, t]);

  useEffect(() => {
    if (!isReady) {
      clearActivity();
      return;
    }

    setIsLoading(true);

    const session = activitySessionRef.current;

    const loadCachedActivity = async () => {
      const [cached, storedSentTransactions] = await Promise.all([
        readWalletViewCache(),
        readSentTransactions(),
      ]);

      if (activitySessionRef.current !== session) {
        return;
      }

      if (cached != null && cached.activityItems.length > 0) {
        setCachedItems(cached.activityItems);
      }

      setSentTransactions(storedSentTransactions);
    };

    void loadCachedActivity();
  }, [clearActivity, isReady]);

  useEffect(() => {
    if (!isReady || initialActivityLoadDoneRef.current) {
      return;
    }

    initialActivityLoadDoneRef.current = true;
    void refresh();
  }, [isReady, refresh]);

  useEffect(() => {
    if (!isReady || boardingItems.length === 0) {
      return;
    }

    const intervalId = setInterval(() => {
      void refresh();
    }, PENDING_BOARDING_REFRESH_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [boardingItems.length, isReady, refresh]);

  const recordFailedPayment = useCallback(
    (item: Omit<ActivityItem, "id" | "status">) => {
      const failedItem: ActivityItem = {
        ...item,
        id: `failed-${item.timestamp}-${item.amountSats}`,
        status: "failed",
      };

      setFailedItems((current) => {
        return [failedItem, ...current];
      });
    },
    [],
  );

  const recordSentTx = useCallback(
    async (
      txid: string,
      options?: { amountSats?: number; offboard?: boolean },
    ) => {
      const updatedEntries = await recordSentTransaction(txid, options);
      setSentTransactions(updatedEntries);
    },
    [],
  );

  const liveItems = useMemo(() => {
    return mergeActivityItems(arkItems, boardingItems, failedItems).items;
  }, [arkItems, boardingItems, failedItems]);

  const items = useMemo(() => {
    if (liveItems.length > 0) {
      return liveItems;
    }

    return cachedItems;
  }, [cachedItems, liveItems]);

  const value = useMemo(() => {
    return {
      items,
      sentTransactions,
      isLoading,
      error,
      refresh,
      recordFailedPayment,
      recordSentTx,
      clearActivity,
    };
  }, [
    clearActivity,
    error,
    isLoading,
    items,
    recordFailedPayment,
    recordSentTx,
    refresh,
    sentTransactions,
  ]);

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
};
