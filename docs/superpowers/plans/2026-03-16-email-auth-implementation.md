# Email Auth Integration Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement SMTP-backed email verification (required before login) and forgot/reset password (1-hour token) using Better Auth native capabilities.

**Architecture:** Keep Better Auth as source of truth for auth/token lifecycle. Add a focused mailer utility for SMTP transport and template composition, wire auth callbacks to that utility, then add minimal UI pages for forgot/reset and localized error messaging.

**Tech Stack:** Next.js App Router, better-auth, nodemailer, react-i18next, TypeScript.

---

## Chunk 1: Auth + SMTP wiring

### Task 1: Add SMTP config and mailer utility

**Files:**
- Create: `lib/mailer.ts`
- Modify: `.env.example`
- Modify: `README.md`
- Test: `lib/mailer.test.ts`

- [ ] Step 1: Write failing tests for env parsing / from-address composition.
- [ ] Step 2: Run `pnpm test` and verify failure.
- [ ] Step 3: Implement `lib/mailer.ts` minimal helper.
- [ ] Step 4: Run `pnpm test` and verify pass.
- [ ] Step 5: Commit.

### Task 2: Wire Better Auth email verification + reset handlers

**Files:**
- Modify: `lib/auth.ts`
- Modify: `lib/auth-origin.ts` (if needed)
- Test: `lib/auth-origin.test.ts` (or new auth config unit test)

- [ ] Step 1: Add failing tests for trusted origin parsing with auth URL + custom origins.
- [ ] Step 2: Verify fail.
- [ ] Step 3: Configure Better Auth options for verification required before login, reset-password handler, and SMTP sender callbacks.
- [ ] Step 4: Verify tests pass.
- [ ] Step 5: Commit.

## Chunk 2: UI flows + i18n

### Task 3: Forgot password request page

**Files:**
- Create: `app/forgot-password/page.tsx`
- Modify: `app/login/page.tsx`
- Modify: `locales/en/common.json`
- Modify: `locales/id/common.json`

- [ ] Step 1: Add failing component-level expectation test (string key presence/unit helper where feasible).
- [ ] Step 2: Verify fail.
- [ ] Step 3: Implement page and link from login.
- [ ] Step 4: Verify lint/build/test pass.
- [ ] Step 5: Commit.

### Task 4: Reset password page + token submit

**Files:**
- Create: `app/reset-password/page.tsx`
- Modify: `locales/en/common.json`
- Modify: `locales/id/common.json`
- Modify: `lib/api-error-map.ts`

- [ ] Step 1: Add failing unit tests for error-key mapping for reset token cases.
- [ ] Step 2: Verify fail.
- [ ] Step 3: Implement reset page and API call.
- [ ] Step 4: Verify pass.
- [ ] Step 5: Commit.

## Chunk 3: Verification + docs

### Task 5: Verification checklist and runtime validation

**Files:**
- Modify: `README.md`
- Optional: `docs/superpowers/specs/2026-03-16-email-auth-design.md` (implementation notes)

- [ ] Step 1: Run `pnpm lint && pnpm test && pnpm build`.
- [ ] Step 2: Manually smoke: register→verify, blocked unverified login, forgot→reset.
- [ ] Step 3: Commit final changes.
- [ ] Step 4: Push to `main`.

Plan complete and saved to `docs/superpowers/plans/2026-03-16-email-auth-implementation.md`. Ready to execute.
