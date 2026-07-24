import { RestIndexerProvider } from "@arkade-os/sdk";

import type { Env } from "./env.js";
import { installEventSourcePolyfill } from "./installEventSourcePolyfill.js";

export const createRestIndexerProvider = (env: Env): RestIndexerProvider => {
  installEventSourcePolyfill();

  return new RestIndexerProvider(env.arkIndexerUrl);
};
