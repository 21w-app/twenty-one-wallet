import { setLogger } from "@arkade-os/boltz-swap";

let boltzWebSocketWarningLogged = false;

const BOLTZ_LOG_PREFIX = "[21W:boltz-swap]";

export const configureBoltzSwapLogging = (): void => {
  if (!__DEV__) {
    return;
  }

  setLogger({
    log: (...args: unknown[]) => {
      console.log(BOLTZ_LOG_PREFIX, ...args);
    },
    warn: (...args: unknown[]) => {
      console.warn(BOLTZ_LOG_PREFIX, ...args);
    },
    error: (...args: unknown[]) => {
      console.error(BOLTZ_LOG_PREFIX, ...args);
    },
  });

  const originalError = console.error;

  console.error = (...args: unknown[]) => {
    const message = args[0];

    if (
      typeof message === "string" &&
      (message === "WebSocket error:" ||
        message === "WebSocket connection timeout")
    ) {
      if (!boltzWebSocketWarningLogged) {
        boltzWebSocketWarningLogged = true;
        console.warn(
          "[21W] Boltz WebSocket is unavailable; swap updates will use HTTP polling instead.",
        );
      }
      return;
    }

    originalError(...args);
  };
};

configureBoltzSwapLogging();
