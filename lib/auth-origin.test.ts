import test from "node:test";
import assert from "node:assert/strict";

import { getTrustedOrigins } from "./auth-origin";

test("builds trusted origins from env vars", () => {
  const origins = getTrustedOrigins({
    APP_URL: "http://100.85.70.124:3000/path",
    BETTER_AUTH_URL: "http://localhost:3000",
    PUBLIC_SHARE_BASE_URL: "https://example.com/share",
    BETTER_AUTH_TRUSTED_ORIGINS: "https://a.com, https://b.com/foo, not-a-url",
  } as NodeJS.ProcessEnv);

  assert.ok(origins.includes("http://100.85.70.124:3000"));
  assert.ok(origins.includes("https://example.com"));
  assert.ok(origins.includes("https://a.com"));
  assert.ok(origins.includes("https://b.com"));
  assert.equal(origins.includes("not-a-url"), false);
});
