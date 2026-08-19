import type { RestIndexerProvider } from "@arkade-os/sdk";

import { createRestIndexerProvider } from "../lib/createRestIndexerProvider.js";
import type { Env } from "../lib/env.js";
import { isStaleIndexerSubscriptionError } from "../lib/isStaleIndexerSubscriptionError.js";
import { mapIndexerSubscriptionVtxo } from "../lib/mapIndexerSubscriptionVtxo.js";
import { handleSubscriptionNewVtxos } from "./handleSubscriptionNewVtxos.js";
import { loadActiveWalletScripts } from "./loadActiveWalletScripts.js";

const INITIAL_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

type SubscriptionManagerState = {
  env: Env | null;
  indexer: RestIndexerProvider | null;
  subscriptionId: string | undefined;
  isRunning: boolean;
  listenInFlight: boolean;
  reconnectAttempts: number;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  refreshTimer: ReturnType<typeof setTimeout> | null;
  abortController: AbortController | null;
};

const state: SubscriptionManagerState = {
  env: null,
  indexer: null,
  subscriptionId: undefined,
  isRunning: false,
  listenInFlight: false,
  reconnectAttempts: 0,
  reconnectTimer: null,
  refreshTimer: null,
  abortController: null,
};

const clearReconnectTimer = (): void => {
  if (state.reconnectTimer != null) {
    clearTimeout(state.reconnectTimer);
    state.reconnectTimer = null;
  }
};

const clearRefreshTimer = (): void => {
  if (state.refreshTimer != null) {
    clearTimeout(state.refreshTimer);
    state.refreshTimer = null;
  }
};

const stopListenLoop = (): void => {
  if (state.abortController != null) {
    state.abortController.abort();
    state.abortController = null;
  }
};

const scheduleReconnect = (): void => {
  if (!state.isRunning) {
    return;
  }

  clearReconnectTimer();

  state.reconnectAttempts += 1;
  const delay = Math.min(
    INITIAL_RECONNECT_DELAY_MS * 2 ** (state.reconnectAttempts - 1),
    MAX_RECONNECT_DELAY_MS,
  );

  state.reconnectTimer = setTimeout(() => {
    state.reconnectTimer = null;
    void connectListenLoop();
  }, delay);
};

const updateSubscription = async (): Promise<boolean> => {
  if (state.env == null || state.indexer == null) {
    return false;
  }

  const scripts = await loadActiveWalletScripts();

  if (scripts.length === 0) {
    if (state.subscriptionId != null) {
      try {
        await state.indexer.unsubscribeForScripts(state.subscriptionId, []);
      } catch {
        // Best-effort teardown when the last wallet is removed.
      }
    }

    state.subscriptionId = undefined;
    stopListenLoop();
    return false;
  }

  try {
    state.subscriptionId = await state.indexer.subscribeForScripts(
      scripts,
      state.subscriptionId,
    );
  } catch (error) {
    if (
      state.subscriptionId != null &&
      isStaleIndexerSubscriptionError(error)
    ) {
      console.warn(
        "indexer subscription id stale; creating a fresh subscription",
      );
      state.subscriptionId = undefined;
      state.subscriptionId = await state.indexer.subscribeForScripts(scripts);
    } else {
      throw error;
    }
  }

  return true;
};

const listenLoop = async (): Promise<void> => {
  if (
    state.env == null ||
    state.indexer == null ||
    state.subscriptionId == null ||
    !state.isRunning ||
    state.listenInFlight
  ) {
    return;
  }

  state.listenInFlight = true;
  stopListenLoop();

  const abortController = new AbortController();
  state.abortController = abortController;

  try {
    const subscription = state.indexer.getSubscription(
      state.subscriptionId,
      abortController.signal,
    );

    state.reconnectAttempts = 0;

    for await (const update of subscription) {
      if (!state.isRunning || abortController.signal.aborted) {
        break;
      }

      const rawNewVtxos = update.newVtxos ?? [];

      const newVtxos = rawNewVtxos.map((vtxo) => {
        const mapped = mapIndexerSubscriptionVtxo(vtxo);

        return {
          script: mapped.script,
          txid: mapped.txid,
          vout: mapped.vout,
          arkTxId: mapped.arkTxId,
        };
      });

      if (newVtxos.length > 0 && state.env != null) {
        await handleSubscriptionNewVtxos(state.env, newVtxos, {
          subscriptionTxid: update.txid,
        });
      }
    }
  } catch (error) {
    if (abortController.signal.aborted || !state.isRunning) {
      return;
    }

    const message = error instanceof Error ? error.message : "unknown error";
    console.warn(`indexer subscription listen failed: ${message}`);

    if (isStaleIndexerSubscriptionError(error)) {
      state.subscriptionId = undefined;
    }
  } finally {
    state.listenInFlight = false;

    if (state.abortController === abortController) {
      state.abortController = null;
    }
  }

  if (state.isRunning) {
    scheduleReconnect();
  }
};

const connectListenLoop = async (): Promise<void> => {
  if (!state.isRunning || state.env == null || state.indexer == null) {
    return;
  }

  try {
    const hasSubscription = await updateSubscription();

    if (!hasSubscription) {
      return;
    }

    await listenLoop();
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.warn(`indexer subscription connect failed: ${message}`);

    if (isStaleIndexerSubscriptionError(error)) {
      state.subscriptionId = undefined;
    }

    scheduleReconnect();
  }
};

export const startIndexerSubscriptionManager = (env: Env): void => {
  if (state.isRunning) {
    return;
  }

  state.env = env;
  state.indexer = createRestIndexerProvider(env);
  state.isRunning = true;

  void connectListenLoop();

  console.log("Indexer subscription worker started for incoming funds");
};

export const stopIndexerSubscriptionManager = (): void => {
  state.isRunning = false;
  clearReconnectTimer();
  clearRefreshTimer();
  stopListenLoop();
};

export const refreshIndexerSubscription = (): void => {
  if (!state.isRunning) {
    return;
  }

  clearRefreshTimer();

  state.refreshTimer = setTimeout(() => {
    state.refreshTimer = null;
    void connectListenLoop();
  }, 250);
};
