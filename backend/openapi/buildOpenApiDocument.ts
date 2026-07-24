import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import {
  apiErrorBodySchema,
  appConfigSchema,
  authChallengeResponseSchema,
  healthStatusSchema,
  revokeDeviceRequestSchema,
  syncDeviceRequestSchema,
  syncDeviceResponseSchema,
} from "./schemas.js";

const deviceIdParamsSchema = z.object({
  deviceId: z.string().uuid(),
});

const registry = new OpenAPIRegistry();

const errorResponse = (description: string) => {
  return {
    description,
    content: {
      "application/json": {
        schema: apiErrorBodySchema,
      },
    },
  };
};

registry.registerPath({
  method: "get",
  path: "/health",
  operationId: "getHealth",
  tags: ["Health"],
  responses: {
    200: {
      description: "Service is healthy",
      content: {
        "application/json": {
          schema: healthStatusSchema,
        },
      },
    },
    503: {
      description: "Service is degraded",
      content: {
        "application/json": {
          schema: healthStatusSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/v1/app/config",
  operationId: "getAppConfig",
  tags: ["App"],
  responses: {
    200: {
      description: "Minimum supported app version policy",
      content: {
        "application/json": {
          schema: appConfigSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/v1/auth/challenges",
  operationId: "createAuthChallenge",
  tags: ["Auth"],
  responses: {
    201: {
      description: "Wallet-signed registration challenge",
      content: {
        "application/json": {
          schema: authChallengeResponseSchema,
        },
      },
    },
    429: errorResponse("Too many challenge requests"),
    500: errorResponse("Internal server error"),
  },
});

registry.registerPath({
  method: "post",
  path: "/v1/devices/sync",
  operationId: "syncDevice",
  tags: ["Devices"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: syncDeviceRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Device registered or updated",
      content: {
        "application/json": {
          schema: syncDeviceResponseSchema,
        },
      },
    },
    400: errorResponse("Invalid request body"),
    401: errorResponse("Authentication failed"),
    429: errorResponse("Too many device requests"),
    500: errorResponse("Internal server error"),
  },
});

registry.registerPath({
  method: "delete",
  path: "/v1/devices/{deviceId}",
  operationId: "revokeDevice",
  tags: ["Devices"],
  request: {
    params: deviceIdParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: revokeDeviceRequestSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: "Device revoked",
    },
    400: errorResponse("Invalid request body"),
    401: errorResponse("Authentication failed"),
    429: errorResponse("Too many device requests"),
    500: errorResponse("Internal server error"),
  },
});

export const buildOpenApiDocument = () => {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: "21W API",
      version: "1.0.0",
      description: "Non-custodial backend for Twenty One Wallet",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development",
      },
      {
        url: "https://your-api.example.com",
        description: "Deployed API (replace with your host)",
      },
    ],
  });
};
