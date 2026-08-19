import { Router } from "express";

import type { Env } from "../../../lib/env.js";
import { getAppConfig } from "../../../services/getAppConfig.js";

export const createAppConfigRoute = (env: Env): Router => {
  const router = Router();

  router.get("/app/config", (_request, response) => {
    response.json(getAppConfig(env));
  });

  return router;
};
