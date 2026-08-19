import { createApp } from "./api/createApp.js";
import { loadEnv } from "./lib/env.js";
import { logger } from "./lib/logger.js";
import { startWorkers } from "./workers/startWorkers.js";

const env = loadEnv();
const app = createApp(env);

app.listen(env.port, () => {
  logger.info({ port: env.port }, "21W backend listening");
  startWorkers(env);
});
