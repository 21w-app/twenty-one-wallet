import type { Wallet } from "@arkade-os/sdk";
import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { AppState, type AppStateStatus } from "react-native";

import { createArkWalletFromSecureStore } from "@/lib/createArkWalletFromSecureStore";
import { useI18n } from "@/hooks/useI18n";
import { getWalletAddress } from "@/lib/getWalletAddress";
import { getWalletBalance } from "@/lib/getWalletBalance";
import { hasWallet } from "@/lib/hasWallet";
import { rollbackWalletSeed } from "@/lib/rollbackWalletSeed";
import { syncWallet } from "@/lib/syncWallet";
import {
  clearWalletViewCacheIfSyncedAt,
  readWalletViewCache,
  writeWalletViewCache,
} from "@/lib/walletViewCache";
import { initialWalletViewState, walletReducer } from "@/lib/walletReducer";

type WalletContextValue = {
  status: typeof initialWalletViewState.status;
  balanceSats: number | null;
  address: string | null;
  error: string | null;
  isReady: boolean;
  sync: () => Promise<void>;
  syncInBackground: () => Promise<void>;
  reloadWallet: () => Promise<boolean>;
  resetWallet: () => void;
  releaseWallet: () => Promise<void>;
  getWallet: () => Wallet | null;
};

export const WalletContext = createContext<WalletContextValue | null>(null);

type WalletProviderProps = {
  children: ReactNode;
};

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const { t } = useI18n();
  const [state, dispatch] = useReducer(walletReducer, initialWalletViewState);
  const [walletUnlocked, setWalletUnlocked] = useState(false);
  const walletRef = useRef<Wallet | null>(null);
  const walletSessionRef = useRef(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const backgroundSyncPromiseRef = useRef<Promise<void> | null>(null);
  const backgroundSyncTokenRef = useRef<symbol | null>(null);

  const getWallet = useCallback(() => {
    return walletRef.current;
  }, []);

  const refreshWalletView = useCallback(
    async (wallet: Wallet, session: number) => {
      const balance = await getWalletBalance(wallet);
      const address = await getWalletAddress(wallet);

      if (
        walletRef.current !== wallet ||
        walletSessionRef.current !== session
      ) {
        return;
      }

      const syncedAt = Date.now();

      await writeWalletViewCache({
        balanceSats: balance.available,
        address,
        syncedAt,
      });

      if (
        walletRef.current !== wallet ||
        walletSessionRef.current !== session
      ) {
        await clearWalletViewCacheIfSyncedAt(syncedAt);
        return;
      }

      dispatch({
        type: "load_success",
        balanceSats: balance.available,
        address,
      });
    },
    [],
  );

  const sync = useCallback(async () => {
    const wallet = walletRef.current;
    const session = walletSessionRef.current;

    if (wallet == null) {
      return;
    }

    dispatch({ type: "load_start" });

    try {
      await syncWallet(wallet);
      await refreshWalletView(wallet, session);
    } catch {
      if (
        walletRef.current !== wallet ||
        walletSessionRef.current !== session
      ) {
        return;
      }

      dispatch({
        type: "load_error",
        error: t("wallet.syncUnavailable"),
      });
    }
  }, [refreshWalletView, t]);

  const syncInBackground = useCallback(async () => {
    if (backgroundSyncPromiseRef.current != null) {
      return backgroundSyncPromiseRef.current;
    }

    const wallet = walletRef.current;
    const session = walletSessionRef.current;

    if (wallet == null) {
      return;
    }

    const syncToken = Symbol("wallet-background-sync");

    const syncPromise = (async () => {
      try {
        await syncWallet(wallet);
        await refreshWalletView(wallet, session);
      } catch {
        if (
          walletRef.current !== wallet ||
          walletSessionRef.current !== session
        ) {
          return;
        }

        dispatch({
          type: "load_error",
          error: t("wallet.syncUnavailable"),
        });
      } finally {
        if (backgroundSyncTokenRef.current === syncToken) {
          backgroundSyncPromiseRef.current = null;
          backgroundSyncTokenRef.current = null;
        }
      }
    })();

    backgroundSyncPromiseRef.current = syncPromise;
    backgroundSyncTokenRef.current = syncToken;
    return syncPromise;
  }, [refreshWalletView, t]);

  const resetWallet = useCallback(() => {
    walletSessionRef.current += 1;
    walletRef.current = null;
    backgroundSyncPromiseRef.current = null;
    backgroundSyncTokenRef.current = null;
    setWalletUnlocked(false);
    dispatch({ type: "reset" });
  }, []);

  const releaseWallet = useCallback(async () => {
    const wallet = walletRef.current;

    resetWallet();

    if (wallet == null) {
      return;
    }

    try {
      await wallet.dispose();
    } catch {
      // Best-effort SDK teardown before SQLite is deleted.
    }
  }, [resetWallet]);

  const initializeWallet = useCallback(async (): Promise<boolean> => {
    const session = walletSessionRef.current + 1;
    walletSessionRef.current = session;
    backgroundSyncPromiseRef.current = null;
    backgroundSyncTokenRef.current = null;
    dispatch({ type: "load_start" });

    const cached = await readWalletViewCache();

    if (walletSessionRef.current !== session) {
      return false;
    }

    if (cached != null) {
      dispatch({
        type: "hydrate_cache",
        balanceSats: cached.balanceSats,
        address: cached.address,
      });
    }

    const result = await createArkWalletFromSecureStore();

    if (walletSessionRef.current !== session) {
      return false;
    }

    if (result.wallet == null) {
      setWalletUnlocked(false);
      dispatch({
        type: "unlock_error",
        error: t("wallet.unlockFailed"),
      });
      return false;
    }

    walletRef.current = result.wallet;
    setWalletUnlocked(true);

    try {
      await syncWallet(result.wallet);
      await refreshWalletView(result.wallet, session);
    } catch {
      if (
        walletRef.current !== result.wallet ||
        walletSessionRef.current !== session
      ) {
        return false;
      }

      dispatch({
        type: "load_error",
        error: t("wallet.syncUnavailable"),
      });
    }

    return true;
  }, [refreshWalletView, t]);

  useEffect(() => {
    const bootstrap = async () => {
      const walletConfigured = await hasWallet();

      if (!walletConfigured) {
        await rollbackWalletSeed();
        resetWallet();
        return;
      }

      await initializeWallet();
    };

    void bootstrap();
  }, [initializeWallet, resetWallet]);

  useEffect(() => {
    if (!walletUnlocked) {
      return;
    }

    const handleAppStateChange = (nextState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (
        nextState === "active" &&
        (previousState === "background" || previousState === "inactive")
      ) {
        void syncInBackground();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [syncInBackground, walletUnlocked]);

  const value = useMemo(() => {
    return {
      status: state.status,
      balanceSats: state.balanceSats,
      address: state.address,
      error: state.error,
      isReady: walletUnlocked,
      sync,
      syncInBackground,
      reloadWallet: initializeWallet,
      resetWallet,
      releaseWallet,
      getWallet,
    };
  }, [
    getWallet,
    initializeWallet,
    releaseWallet,
    resetWallet,
    state,
    sync,
    syncInBackground,
    walletUnlocked,
  ]);

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
