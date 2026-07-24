import { readFileSync } from "node:fs";
import { join } from "node:path";

import express from "express";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";

import type { Env } from "../lib/env.js";
import { logger } from "../lib/logger.js";
import { errorHandler } from "../middleware/errorHandler.js";
import { notFoundHandler } from "../middleware/notFoundHandler.js";
import { buildOpenApiDocument } from "../openapi/buildOpenApiDocument.js";
import { healthRoute } from "./routes/healthRoute.js";
import { createV1Router } from "./routes/v1/v1Router.js";

const readOpenApiDocument = () => {
  const candidates = [
    join(process.cwd(), "openapi/openapi.json"),
    join(process.cwd(), "../openapi/openapi.json"),
  ];

  for (const candidate of candidates) {
    try {
      const raw = readFileSync(candidate, "utf8");

      return JSON.parse(raw) as ReturnType<typeof buildOpenApiDocument>;
    } catch {
      // Try the next candidate path.
    }
  }

  return buildOpenApiDocument();
};

export const createApp = (env: Env) => {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (request) => {
          return request.url === "/health";
        },
      },
    }),
  );
  app.use(express.json({ limit: "64kb" }));

  app.use(healthRoute);
  app.use("/v1", createV1Router(env));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(readOpenApiDocument()));
  app.get("/openapi.json", (_request, response) => {
    response.json(readOpenApiDocument());
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
