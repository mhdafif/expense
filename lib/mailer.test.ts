import test from "node:test";
import assert from "node:assert/strict";

import { buildFromAddress } from "./mailer";

test("buildFromAddress uses env sender", () => {
  const prevName = process.env.SMTP_FROM_NAME;
  const prevEmail = process.env.SMTP_FROM_EMAIL;

  process.env.SMTP_FROM_NAME = "Expense Docs";
  process.env.SMTP_FROM_EMAIL = "no-reply@example.com";

  assert.equal(buildFromAddress(), '"Expense Docs" <no-reply@example.com>');

  process.env.SMTP_FROM_NAME = prevName;
  process.env.SMTP_FROM_EMAIL = prevEmail;
});
