import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { createApp } from "../api/createApp.js";
import type { Env } from "../lib/env.js";

const testEnv: Env = {
  databaseUrl: process.env.DATABASE_URL ?? "postgresql://test",
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

const app = createApp(testEnv);

test("GET /v1/app/config returns env-driven policy", async () => {
  const response = await request(app).get("/v1/app/config");

  assert.equal(response.status, 200);
  assert.equal(response.body.minimumAppVersion, "1.0.0");
  assert.equal(response.body.minimumIosBuild, "10");
  assert.equal(response.body.updateMessage, "Please update");
});

test("GET /openapi.json returns the API document", async () => {
  const response = await request(app).get("/openapi.json");

  assert.equal(response.status, 200);
  assert.equal(response.body.openapi, "3.0.3");
  assert.equal(response.body.info.title, "21W API");
});

test("POST /v1/devices/sync rejects invalid body", async () => {
  const response = await request(app)
    .post("/v1/devices/sync")
    .send({ platform: "ios" });

  assert.equal(response.status, 400);
  assert.equal(response.body.code, "INVALID_BODY");
});

const hasDatabaseUrl = (): boolean => {
  const databaseUrl = process.env.DATABASE_URL;

  return databaseUrl != null && databaseUrl.trim().length > 0;
};

test("POST /v1/auth/challenges creates a challenge when database is available", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is required for database integration tests");
    return;
  }

  const response = await request(app).post("/v1/auth/challenges");

  assert.equal(response.status, 201);
  assert.match(response.body.challengeId, /^[0-9a-f-]{36}$/i);
  assert.match(response.body.message, /21W device registration/);
  assert.equal(typeof response.body.expiresAtSeconds, "number");
});

test("GET /health reports database status when database is available", async (t) => {
  if (!hasDatabaseUrl()) {
    t.skip("DATABASE_URL is required for database integration tests");
    return;
  }

  const response = await request(app).get("/health");

  assert.ok(response.status === 200 || response.status === 503);
  assert.equal(typeof response.body.timestamp, "string");
  assert.ok(
    response.body.database === "up" || response.body.database === "down",
  );
});
