import { Router } from "express";

import type { Env } from "../../../lib/env.js";
import { createAppConfigRoute } from "./appConfigRoute.js";
import { createAuthChallengesRoute } from "./authChallengesRoute.js";
import { createDevicesRoute } from "./devicesRoute.js";

export const createV1Router = (env: Env): Router => {
  const router = Router();

  router.use(createAppConfigRoute(env));
  router.use("/auth", createAuthChallengesRoute(env));
  router.use("/devices", createDevicesRoute(env));

  return router;
};
