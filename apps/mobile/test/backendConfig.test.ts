import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveBackendBaseUrl } from "@/lib/resolveBackendBaseUrl";

describe("resolveBackendBaseUrl", () => {
  it("prefers EXPO_PUBLIC_BACKEND_URL over extra.backendUrl", () => {
    const baseUrl = resolveBackendBaseUrl({
      envUrl: "https://env.example/",
      extraUrl: "https://extra.example",
      isDev: false,
    });

    assert.equal(baseUrl, "https://env.example");
  });

  it("uses extra.backendUrl when env is missing", () => {
    const baseUrl = resolveBackendBaseUrl({
      envUrl: null,
      extraUrl: "https://api.example.com/",
      isDev: false,
    });

    assert.equal(baseUrl, "https://api.example.com");
  });

  it("requires a configured URL in release builds", () => {
    assert.throws(
      () =>
        resolveBackendBaseUrl({
          envUrl: null,
          extraUrl: null,
          isDev: false,
        }),
      /EXPO_PUBLIC_BACKEND_URL is required/,
    );
  });

  it("falls back to localhost in dev builds", () => {
    const baseUrl = resolveBackendBaseUrl({
      envUrl: null,
      extraUrl: null,
      isDev: true,
    });

    assert.equal(baseUrl, "http://localhost:3000");
  });
});
