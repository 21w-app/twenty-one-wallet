import { createIpRateLimit } from "./createIpRateLimit.js";

/** Per-IP limit for wallet-signed device sync/revoke (TASK-151). */
export const deviceMutationRateLimit = createIpRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: "Too many device requests",
});
