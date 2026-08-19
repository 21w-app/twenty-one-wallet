import { Router } from "express";

import { getHealthStatus } from "../../services/getHealthStatus.js";

export const healthRoute = Router();

healthRoute.get("/health", async (_request, response, next) => {
  try {
    const health = await getHealthStatus();
    const statusCode = health.status === "ok" ? 200 : 503;
    response.status(statusCode).json(health);
  } catch (error) {
    next(error);
  }
});
