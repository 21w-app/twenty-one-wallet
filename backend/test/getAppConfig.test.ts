import test from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../lib/env.js";
import { getAppConfig } from "../services/getAppConfig.js";

const testEnv: Env = {
  databaseUrl: "postgresql://test",
  port: 3000,
  nodeEnv: "test",
  minSupportedAppVersion: "1.0.0",
  minIosBuild: "10",
  minAndroidBuild: null,
  iosStoreUrl: "https://apps.apple.com/app/example",
  androidStoreUrl: null,
  updateMessage: "Please update",
  arkIndexerUrl: "https://arkade.computer",
  expoAccessToken: null,
  vtxoExpiryPollIntervalMs: 3_600_000,
  vtxoReminderCooldownMs: 86_400_000,
  challengeTtlSeconds: 300,
  workersEnabled: false,
  vtxoExpiryWorkerEnabled: false,
};

test("getAppConfig returns env-driven policy", () => {
  const config = getAppConfig(testEnv);

  assert.equal(config.minimumAppVersion, "1.0.0");
  assert.equal(config.minimumIosBuild, "10");
  assert.equal(config.minimumAndroidBuild, null);
  assert.equal(config.iosStoreUrl, "https://apps.apple.com/app/example");
  assert.equal(config.updateMessage, "Please update");
});
