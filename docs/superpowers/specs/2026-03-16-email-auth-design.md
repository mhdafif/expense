# Email Auth Integration Design (Option 1 - Better Auth Native)

Date: 2026-03-16
Project: Expense Docs (`expense/app`)

## 1) Scope
Integrate SMTP-based email flows for:
1. Registration email verification (mandatory before login)
2. Forgot/reset password (token expiry: 1 hour)

Out of scope:
- Social login
- MFA/OTP
- Admin email tooling
- Resend verification UI (explicitly not requested)

## 2) Product Decisions (confirmed)
- Verification policy: **Block login until email verified**
- Reset token TTL: **1 hour**
- Unverified login UX: **generic rejection error only** (no resend, no auto-send)
- Sender identity from env:
  - `SMTP_FROM_NAME=Expense Docs`
  - `SMTP_FROM_EMAIL=no-reply@expense.aafif.space`

## 3) Architecture
Use Better Auth built-in email capabilities + SMTP transporter.

### 3.1 Config Layer
Add environment variables:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM_NAME`
- `SMTP_FROM_EMAIL`
- Existing: `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`

### 3.2 Auth Layer (`lib/auth.ts`)
- Keep Prisma adapter + next cookies plugin.
- Add trusted origins from current helper.
- Enable email verification and password reset with Better Auth handlers.
- Add send-email callbacks using SMTP transport.

### 3.3 Email Sending Layer (`lib/mailer.ts`)
- Central SMTP transporter creation.
- Helper to send:
  - verification email
  - reset password email
- Use simple HTML + text templates.

### 3.4 UI/API Integration
- Register page: submit as usual; show “check email” message when verification email is sent.
- Login page: show generic error for unverified users.
- Forgot password page: email field + success confirmation (generic).
- Reset password page: token + new password flow.

## 4) Security & Reliability
- Do not reveal account existence in forgot-password response.
- Enforce trusted origins (`INVALID_ORIGIN` mitigation remains active).
- Reset tokens expire in 1 hour.
- SMTP credentials read only from env.
- No secrets committed in repository files.

## 5) i18n
Add EN/ID keys for:
- verification email sent
- unverified login blocked
- forgot password submitted
- reset success
- token invalid/expired
- generic auth failures

## 6) Testing & Verification
### Automated
- lint
- build
- existing + added unit tests for env/config mapping where applicable

### Manual smoke (EN and ID)
1. Register new account -> verification email delivered
2. Login before verify -> blocked
3. Verify via email link -> login works
4. Forgot password -> reset email delivered
5. Reset with valid token -> password updated
6. Reuse/expired token -> rejected

## 7) Rollout Steps
1. Add mailer utility + env parsing
2. Wire Better Auth callbacks/config
3. Add forgot/reset UI routes
4. Update i18n keys and messages
5. Verify flows in EN/ID
6. Push to `main`
