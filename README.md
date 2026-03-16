# Expense Docs App

## Run

```bash
pnpm install
pnpm dev
```

## Required env (auth + email)

Set these in `.env`:

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_TRUSTED_ORIGINS`
- `DATABASE_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM_NAME`
- `SMTP_FROM_EMAIL`

## Auth flows

- Email/password signup
- Email verification required before login
- Forgot password via email link
- Reset password token expiry: 1 hour
