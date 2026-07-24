import type { Env } from "../lib/env.js";
import { startIndexerSubscriptionManager } from "../services/indexerSubscriptionManager.js";
import { pollVtxoExpiryReminders } from "./vtxoExpiryWorker.js";

let expiryTimer: ReturnType<typeof setInterval> | null = null;

export const startWorkers = (env: Env): void => {
  if (!env.workersEnabled) {
    console.log("Backend workers disabled (WORKERS_ENABLED=false)");
    return;
  }

  startIndexerSubscriptionManager(env);

  if (!env.vtxoExpiryWorkerEnabled) {
    return;
  }

  if (expiryTimer != null) {
    return;
  }

  void pollVtxoExpiryReminders(env);

  expiryTimer = setInterval(() => {
    void pollVtxoExpiryReminders(env);
  }, env.vtxoExpiryPollIntervalMs);

  console.log(
    `VTXO expiry worker started (poll every ${env.vtxoExpiryPollIntervalMs}ms)`,
  );
};
