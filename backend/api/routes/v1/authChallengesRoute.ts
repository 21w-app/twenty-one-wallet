import { Router } from "express";

import type { Env } from "../../../lib/env.js";
import { authChallengeRateLimit } from "../../../middleware/authChallengeRateLimit.js";
import { HttpError } from "../../../middleware/errorHandler.js";
import { createAuthChallenge } from "../../../services/createAuthChallenge.js";

export const createAuthChallengesRoute = (env: Env): Router => {
  const router = Router();

  router.post(
    "/challenges",
    authChallengeRateLimit,
    async (_request, response, next) => {
      try {
        const challenge = await createAuthChallenge(env);
        response.status(201).json(challenge);
      } catch (error) {
        next(error);
      }
    },
  );

  return router;
};

export const mapAuthRouteError = (error: unknown): HttpError | null => {
  if (error instanceof Error && error.name === "AuthError") {
    return new HttpError(401, error.message, "AUTH_FAILED");
  }

  return null;
};
