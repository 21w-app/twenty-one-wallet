import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useSwaps } from "@/hooks/useSwaps";
import { useI18n } from "@/hooks/useI18n";
import { useWallet } from "@/hooks/useWallet";
import type { ActivityItem } from "@/lib/activityTypes";
import { readArkSentAmountOverridesMap } from "@/lib/arkSentAmountOverrides";
import { mapArkTransactionToActivity } from "@/lib/mapArkTransaction";
import { mapSwapToActivity } from "@/lib/mapSwapToActivity";
import { mergeActivityItems } from "@/lib/mergeActivityItems";
import { loadSwapHistoryForActivity } from "@/lib/loadSwapHistoryForActivity";
import { readFundedChainSwapIds } from "@/lib/fundedChainSwaps";
import {
  readSentTransactions,
  recordSentTransaction,
  type SentTransaction,
} from "@/lib/sentArkTransactions";
import { syncWallet } from "@/lib/syncWallet";
import {
  clearWalletViewCacheIfSyncedAt,
  readWalletViewCache,
  WALLET_VIEW_CACHE_LIMIT,
  writeWalletViewCache,
} from "@/lib/walletViewCache";

type ActivityContextValue = {
  items: ActivityItem[];
  sentTransactions: SentTransaction[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  recordFailedPayment: (item: Omit<ActivityItem, "id" | "status">) => void;
  recordSentTx: (txid: string) => Promise<void>;
  clearActivity: () => void;
};

export const ActivityContext = createContext<ActivityContextValue | null>(null);

type ActivityProviderProps = {
  children: ReactNode;
};

export const ActivityProvider = ({ children }: ActivityProviderProps) => {
  const { t } = useI18n();
  const { isReady, getWallet } = useWallet();
  const { swaps, status: swapsStatus } = useSwaps();
  const [arkItems, setArkItems] = useState<ActivityItem[]>([]);
  const [rampItems, setRampItems] = useState<ActivityItem[]>([]);
  const [failedItems, setFailedItems] = useState<ActivityItem[]>([]);
  const [sentTransactions, setSentTransactions] = useState<SentTransaction[]>(
    [],
  );
  const [cachedItems, setCachedItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const failedItemsRef = useRef<ActivityItem[]>([]);
  const swapsRef = useRef(swaps);
  const refreshInFlightRef = useRef(0);
  const initialActivityLoadDoneRef = useRef(false);
  const activitySessionRef = useRef(0);

  failedItemsRef.current = failedItems;
  swapsRef.current = swaps;

  const clearActivity = useCallback(() => {
    activitySessionRef.current += 1;
    setArkItems([]);
    setRampItems([]);
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

    const session = activitySessionRef.current;
    refreshInFlightRef.current += 1;

    setIsLoading(true);
    setError(null);

    const swapsInstance = swapsRef.current;

    try {
      try {
        await syncWallet(wallet);
      } catch {
        // Best-effort — still load history when sync fails.
      }

      if (swapsInstance != null) {
        await swapsInstance.refreshSwapsStatus();
      }

      const swapHistoryPromise =
        swapsInstance == null
          ? Promise.resolve([])
          : readFundedChainSwapIds().then((fundedChainSwapIds) => {
              return loadSwapHistoryForActivity(swapsInstance, {
                fundedChainSwapIds,
              });
            });

      const [history, swapHistory, vtxos, overrides] = await Promise.all([
        wallet.getTransactionHistory(),
        swapHistoryPromise,
        wallet.getVtxos({ withRecoverable: false }),
        readArkSentAmountOverridesMap(),
      ]);

      if (getWallet() !== wallet || activitySessionRef.current !== session) {
        return;
      }

      const mapOptions = { overrides, vtxos };
      const mappedArk = history.map((tx) => {
        return mapArkTransactionToActivity(tx, mapOptions);
      });
      const mappedRamp = swapHistory.map(mapSwapToActivity);

      setArkItems(mappedArk);
      setRampItems(mappedRamp);
      setCachedItems([]);

      const mergedItems = mergeActivityItems(
        mappedArk,
        mappedRamp,
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
    } catch {
      if (getWallet() !== wallet || activitySessionRef.current !== session) {
        return;
      }

      setError(t("activity.loadFailed"));
    } finally {
      refreshInFlightRef.current -= 1;

      if (
        refreshInFlightRef.current === 0 &&
        getWallet() === wallet &&
        activitySessionRef.current === session
      ) {
        setIsLoading(false);
      }
    }
  }, [getWallet, t]);

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
    if (swapsStatus === "idle") {
      initialActivityLoadDoneRef.current = false;
    }
  }, [swapsStatus]);

  useEffect(() => {
    const swapsReadyForActivity =
      swapsStatus === "ready" || swapsStatus === "error";

    if (
      !isReady ||
      !swapsReadyForActivity ||
      initialActivityLoadDoneRef.current
    ) {
      return;
    }

    initialActivityLoadDoneRef.current = true;
    void refresh();
  }, [isReady, refresh, swapsStatus]);

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

  const recordSentTx = useCallback(async (txid: string) => {
    const updatedEntries = await recordSentTransaction(txid);
    setSentTransactions(updatedEntries);
  }, []);

  const liveItems = useMemo(() => {
    return mergeActivityItems(arkItems, rampItems, failedItems).items;
  }, [arkItems, failedItems, rampItems]);

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
