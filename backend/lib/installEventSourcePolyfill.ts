import { EventSource } from "eventsource";

export const installEventSourcePolyfill = (): void => {
  const globalScope = globalThis as Record<string, unknown>;

  if (globalScope.EventSource == null) {
    globalScope.EventSource = EventSource;
  }
};
