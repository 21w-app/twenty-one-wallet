type TrailingAsyncQueue = {
  enqueue: (run: () => Promise<void>) => Promise<void>;
};

export const createTrailingAsyncQueue = (): TrailingAsyncQueue => {
  let inFlight: Promise<void> | null = null;
  let queued = false;
  let latestRun: (() => Promise<void>) | null = null;

  const enqueue = (run: () => Promise<void>): Promise<void> => {
    latestRun = run;
    queued = true;

    if (inFlight != null) {
      return inFlight;
    }

    inFlight = (async () => {
      try {
        do {
          queued = false;
          const currentRun = latestRun;

          if (currentRun != null) {
            await currentRun();
          }
        } while (queued);
      } finally {
        const shouldRestart = queued;
        inFlight = null;

        if (shouldRestart && latestRun != null) {
          await enqueue(latestRun);
        }
      }
    })();

    return inFlight;
  };

  return { enqueue };
};
