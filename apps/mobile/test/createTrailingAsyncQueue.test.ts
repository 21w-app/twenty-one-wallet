import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { createTrailingAsyncQueue } from "@/lib/createTrailingAsyncQueue";

const createDeferred = () => {
  let resolveDeferred = () => {};
  const promise = new Promise<void>((resolve) => {
    resolveDeferred = resolve;
  });

  return {
    promise,
    resolve: () => {
      resolveDeferred();
    },
  };
};

describe("createTrailingAsyncQueue", () => {
  test("runs a trailing call after the in-flight work finishes", async () => {
    const queue = createTrailingAsyncQueue();
    const runs: number[] = [];
    const firstGate = createDeferred();

    const first = queue.enqueue(async () => {
      runs.push(1);
      await firstGate.promise;
    });
    const second = queue.enqueue(async () => {
      runs.push(2);
    });

    assert.equal(runs.length, 1);
    firstGate.resolve();
    await Promise.all([first, second]);

    assert.deepEqual(runs, [1, 2]);
  });

  test("coalesces overlapping trailing calls into one extra run", async () => {
    const queue = createTrailingAsyncQueue();
    const runs: number[] = [];
    const firstGate = createDeferred();

    const first = queue.enqueue(async () => {
      runs.push(1);
      await firstGate.promise;
    });
    const second = queue.enqueue(async () => {
      runs.push(2);
    });
    const third = queue.enqueue(async () => {
      runs.push(2);
    });

    firstGate.resolve();
    await Promise.all([first, second, third]);

    assert.deepEqual(runs, [1, 2]);
  });
});
