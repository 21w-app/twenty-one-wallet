import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const apiErrorBodySchema = z
  .object({
    error: z.string(),
    code: z.string().optional(),
  })
  .openapi("ApiErrorBody");

export const healthStatusSchema = z
  .object({
    status: z.enum(["ok", "degraded"]),
    timestamp: z.string().datetime(),
    database: z.enum(["up", "down"]),
  })
  .openapi("HealthStatus");

export const appConfigSchema = z
  .object({
    minimumAppVersion: z.string(),
    minimumIosBuild: z.string().nullable(),
    minimumAndroidBuild: z.string().nullable(),
    iosStoreUrl: z.string().nullable(),
    androidStoreUrl: z.string().nullable(),
    updateMessage: z.string().nullable(),
  })
  .openapi("AppConfig");

export const authChallengeResponseSchema = z
  .object({
    challengeId: z.string().uuid(),
    message: z.string(),
    expiresAtSeconds: z.number().int(),
  })
  .openapi("AuthChallengeResponse");

export const platformSchema = z.enum(["ios", "android"]).openapi("Platform");

export const syncDeviceRequestSchema = z
  .object({
    challengeId: z.string().uuid(),
    signature: z.string().min(1),
    signature_version: z.literal("device-auth-v1"),
    vtxo_script_hex: z.string().min(1),
    ark_static_address: z.string().min(1),
    signer_taproot_address: z.string().min(1),
    signer_xonly_public_key: z.string().regex(/^[0-9a-fA-F]{64}$/),
    deviceId: z.string().uuid().optional(),
    expo_push_token: z.string().min(1),
    platform: platformSchema,
    app_version: z.string().optional(),
    native_build: z.string().optional(),
  })
  .openapi("SyncDeviceRequest");

export const syncDeviceResponseSchema = z
  .object({
    deviceId: z.string().uuid(),
  })
  .openapi("SyncDeviceResponse");

export const revokeDeviceRequestSchema = z
  .object({
    challengeId: z.string().uuid(),
    signature: z.string().min(1),
    signature_version: z.literal("device-auth-v1"),
    vtxo_script_hex: z.string().min(1),
    ark_static_address: z.string().min(1),
  })
  .openapi("RevokeDeviceRequest");

export type AppConfig = z.infer<typeof appConfigSchema>;
export type AuthChallengeResponse = z.infer<typeof authChallengeResponseSchema>;
export type SyncDeviceRequest = z.infer<typeof syncDeviceRequestSchema>;
export type SyncDeviceResponse = z.infer<typeof syncDeviceResponseSchema>;
export type RevokeDeviceRequest = z.infer<typeof revokeDeviceRequestSchema>;
