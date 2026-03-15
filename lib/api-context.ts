import { ensureDemoContext } from "@/lib/demo-context";

export async function getDemoWorkspaceContext() {
  const { workspace, user, memberships } = await ensureDemoContext();
  return { workspace, user, memberships };
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof Error && error.message === "UNAUTHORIZED";
}
