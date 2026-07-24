import { createIpRateLimit } from "./createIpRateLimit.js";

export const authChallengeRateLimit = createIpRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many challenge requests",
});
