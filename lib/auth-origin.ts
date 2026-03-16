const DEFAULT_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

function toOrigin(value?: string | null) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function getTrustedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const fromVars = [
    env.APP_URL,
    env.BETTER_AUTH_URL,
    env.PUBLIC_SHARE_BASE_URL,
    ...(env.BETTER_AUTH_TRUSTED_ORIGINS || "").split(",").map((v) => v.trim()),
  ]
    .map(toOrigin)
    .filter((v): v is string => Boolean(v));

  return Array.from(new Set([...DEFAULT_ORIGINS, ...fromVars]));
}
