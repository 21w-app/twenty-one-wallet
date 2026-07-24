import assert from "node:assert/strict";
import test from "node:test";

import express from "express";
import request from "supertest";

import { createIpRateLimit } from "../middleware/createIpRateLimit.js";

test("createIpRateLimit returns 429 with RATE_LIMITED after max requests", async () => {
  const app = express();
  const limit = createIpRateLimit({
    windowMs: 60_000,
    max: 2,
    message: "Too many device requests",
  });

  app.post("/probe", limit, (_request, response) => {
    response.status(200).json({ ok: true });
  });

  assert.equal((await request(app).post("/probe")).status, 200);
  assert.equal((await request(app).post("/probe")).status, 200);

  const limited = await request(app).post("/probe");
  assert.equal(limited.status, 429);
  assert.equal(limited.body.code, "RATE_LIMITED");
  assert.equal(limited.body.error, "Too many device requests");
});
