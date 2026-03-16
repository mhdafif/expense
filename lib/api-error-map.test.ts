import test from "node:test";
import assert from "node:assert/strict";

import { mapApiErrorKey } from "./api-error-map";

test("maps known backend error messages to translation keys", () => {
  assert.equal(mapApiErrorKey("Workspace access denied", "fallback"), "errors.workspaceAccessDenied");
  assert.equal(mapApiErrorKey("Unauthorized", "fallback"), "errors.unauthorized");
  assert.equal(mapApiErrorKey("Invite expired", "fallback"), "join.inviteExpired");
});

test("returns fallback key for unknown/empty message", () => {
  assert.equal(mapApiErrorKey("", "auth.loginFailed"), "auth.loginFailed");
  assert.equal(mapApiErrorKey("something else", "auth.loginFailed"), "auth.loginFailed");
});
