import { Router } from "express";
import { z } from "zod";

import type { Env } from "../../../lib/env.js";
import { deviceMutationRateLimit } from "../../../middleware/deviceMutationRateLimit.js";
import { HttpError } from "../../../middleware/errorHandler.js";
import { validateRequest } from "../../../middleware/validateRequest.js";
import {
  revokeDeviceRequestSchema,
  syncDeviceRequestSchema,
} from "../../../openapi/schemas.js";
import { AuthError } from "../../../services/consumeAuthChallenge.js";
import { syncDevice, revokeDevice } from "../../../services/syncDevice.js";
import { mapAuthRouteError } from "./authChallengesRoute.js";

const deviceParamsSchema = z.object({
  deviceId: z.string().uuid(),
});

export const createDevicesRoute = (env: Env): Router => {
  const router = Router();

  router.post(
    "/sync",
    deviceMutationRateLimit,
    validateRequest(syncDeviceRequestSchema, "body"),
    async (request, response, next) => {
      try {
        const body = request.body as z.infer<typeof syncDeviceRequestSchema>;

        const result = await syncDevice({
          env,
          challengeId: body.challengeId,
          signature: body.signature,
          signatureVersion: body.signature_version,
          vtxoScriptHex: body.vtxo_script_hex,
          arkStaticAddress: body.ark_static_address,
          signerTaprootAddress: body.signer_taproot_address,
          signerXOnlyPublicKey: body.signer_xonly_public_key,
          deviceId: body.deviceId,
          expoPushToken: body.expo_push_token,
          platform: body.platform,
          appVersion: body.app_version ?? null,
          nativeBuild: body.native_build ?? null,
        });

        response.status(200).json(result);
      } catch (error) {
        const mapped = mapAuthRouteError(error);

        if (mapped != null) {
          next(mapped);
          return;
        }

        if (error instanceof AuthError) {
          next(new HttpError(401, error.message, "AUTH_FAILED"));
          return;
        }

        next(error);
      }
    },
  );

  router.delete(
    "/:deviceId",
    deviceMutationRateLimit,
    validateRequest(deviceParamsSchema, "params"),
    validateRequest(revokeDeviceRequestSchema, "body"),
    async (request, response, next) => {
      try {
        const body = request.body as z.infer<typeof revokeDeviceRequestSchema>;
        const deviceId = request.params.deviceId;

        if (typeof deviceId !== "string") {
          next(new HttpError(400, "Invalid deviceId", "INVALID_BODY"));
          return;
        }

        await revokeDevice({
          deviceId,
          challengeId: body.challengeId,
          signature: body.signature,
          signatureVersion: body.signature_version,
          vtxoScriptHex: body.vtxo_script_hex,
          arkStaticAddress: body.ark_static_address,
        });

        response.status(204).send();
      } catch (error) {
        const mapped = mapAuthRouteError(error);

        if (mapped != null) {
          next(mapped);
          return;
        }

        if (error instanceof AuthError) {
          next(new HttpError(401, error.message, "AUTH_FAILED"));
          return;
        }

        next(error);
      }
    },
  );

  return router;
};
