import type { ArkadeSwaps } from "@arkade-os/boltz-swap";
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
import { createArkadeSwaps } from "@/lib/createArkadeSwaps";
import { getWalletNetworkInfo } from "@/lib/getWalletNetworkInfo";
import {
  logLightningFundDebug,
  logLightningFundError,
} from "@/lib/logLightningFundDebug";
import {
  ensureSwapManagerStarted,
  startSwapManagerIfNeeded,
} from "@/lib/startSwapManagerIfNeeded";

type SwapsStatus = "idle" | "loading" | "ready" | "error";

type SwapsContextValue = {
  status: SwapsStatus;
  swaps: ArkadeSwaps | null;
  error: string | null;
  resetSwaps: () => void;
  ensureSwapManagerStarted: () => Promise<void>;
};

export const SwapsContext = createContext<SwapsContextValue | null>(null);

type SwapsProviderProps = {
  children: ReactNode;
};

export const SwapsProvider = ({ children }: SwapsProviderProps) => {
  const { t } = useI18n();
  const { isReady, getWallet } = useWallet();
  const [status, setStatus] = useState<SwapsStatus>("idle");
  const [swaps, setSwaps] = useState<ArkadeSwaps | null>(null);
  const [error, setError] = useState<string | null>(null);
  const swapsRef = useRef<ArkadeSwaps | null>(null);

  const resetSwaps = useCallback(() => {
    swapsRef.current = null;
    setSwaps(null);
    setStatus("idle");
    setError(null);
  }, []);

  const ensureSwapManager = useCallback(async () => {
    const instance = swapsRef.current;

    if (instance == null) {
      return;
    }

    await ensureSwapManagerStarted(instance);
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      if (!isReady) {
        resetSwaps();
        return;
      }

      const wallet = getWallet();

      if (wallet == null) {
        resetSwaps();
        return;
      }

      const existing = swapsRef.current;

      if (existing != null && existing.wallet === wallet) {
        return;
      }

      if (existing != null && existing.wallet !== wallet) {
        try {
          await existing.reset();
        } catch {
          // Best-effort cleanup before rebinding to the reloaded wallet.
        }

        swapsRef.current = null;
        setSwaps(null);
      }

      if (status === "loading" || status === "error") {
        return;
      }

      setStatus("loading");
      setError(null);

      logLightningFundDebug("swaps-bootstrap", "creating ArkadeSwaps", {
        network: getWalletNetworkInfo(),
      });

      try {
        const instance = await createArkadeSwaps(wallet);
        await startSwapManagerIfNeeded(instance);
        swapsRef.current = instance;
        setSwaps(instance);
        setStatus("ready");
        logLightningFundDebug("swaps-bootstrap", "ArkadeSwaps ready", {
          hasSwapManager: instance.getSwapManager() != null,
        });
      } catch (bootstrapError) {
        logLightningFundError(
          "swaps-bootstrap",
          "failed to create ArkadeSwaps",
          bootstrapError,
          { network: getWalletNetworkInfo() },
        );
        swapsRef.current = null;
        setSwaps(null);
        setStatus("error");
        setError(t("lightning.servicesStartFailed"));
      }
    };

    void bootstrap();
  }, [getWallet, isReady, resetSwaps, status, t]);

  const value = useMemo(() => {
    return {
      status,
      swaps,
      error,
      resetSwaps,
      ensureSwapManagerStarted: ensureSwapManager,
    };
  }, [ensureSwapManager, error, resetSwaps, status, swaps]);

  return (
    <SwapsContext.Provider value={value}>{children}</SwapsContext.Provider>
  );
};
