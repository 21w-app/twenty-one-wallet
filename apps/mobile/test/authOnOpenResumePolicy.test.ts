import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AUTH_ON_OPEN_RESUME_LOCK_MS,
  shouldLockAuthOnResume,
  shouldRecordAuthBackgroundTimestamp,
} from "@/lib/authOnOpenResumePolicy";

describe("authOnOpenResumePolicy", () => {
  it("records a timestamp only when the app enters background", () => {
    assert.equal(shouldRecordAuthBackgroundTimestamp("background"), true);
    assert.equal(shouldRecordAuthBackgroundTimestamp("active"), false);
    assert.equal(shouldRecordAuthBackgroundTimestamp("inactive"), false);
  });

  it("does not lock on resume when background duration is under the threshold", () => {
    const backgroundedAt = 1_000_000;
    const now = backgroundedAt + AUTH_ON_OPEN_RESUME_LOCK_MS - 1;

    assert.equal(shouldLockAuthOnResume({ backgroundedAt, now }), false);
  });

  it("locks on resume when background duration meets the threshold", () => {
    const backgroundedAt = 1_000_000;
    const now = backgroundedAt + AUTH_ON_OPEN_RESUME_LOCK_MS;

    assert.equal(shouldLockAuthOnResume({ backgroundedAt, now }), true);
  });

  it("does not lock on resume without a recorded background timestamp", () => {
    assert.equal(
      shouldLockAuthOnResume({ backgroundedAt: null, now: Date.now() }),
      false,
    );
  });
});
