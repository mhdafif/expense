const MESSAGE_TO_KEY: Array<[pattern: RegExp, key: string]> = [
  [/invalid\s*(email|credential|password)|credential/i, "errors.invalidCredentials"],
  [/already\s*(exists|registered)|email.*already/i, "errors.emailExists"],
  [/email.*not\s*verified/i, "auth.emailNotVerified"],
  [/unauthorized/i, "errors.unauthorized"],
  [/workspace access denied/i, "errors.workspaceAccessDenied"],
  [/only owner can create invite/i, "errors.onlyOwnerCreateInvite"],
  [/only owner can revoke invite/i, "errors.onlyOwnerRevokeInvite"],
  [/invite not found/i, "join.invalidToken"],
  [/invite expired/i, "join.inviteExpired"],
  [/expense not found/i, "errors.expenseNotFound"],
  [/failed to switch workspace/i, "errors.switchWorkspaceFailed"],
  [/failed to (save|delete|update) expense/i, "errors.expenseMutationFailed"],
  [/failed to load expenses/i, "errors.loadExpensesFailed"],
  [/failed to load invites/i, "dashboard.loadInviteFailed"],
  [/failed to create invite/i, "dashboard.createInviteFailed"],
  [/failed to revoke invite/i, "dashboard.revokeInviteFailed"],
  [/failed to refresh report snapshot/i, "dashboard.snapshotFailed"],
];

export function mapApiErrorKey(message: string | undefined | null, fallbackKey: string): string {
  const normalized = String(message || "").trim();
  if (!normalized) return fallbackKey;

  for (const [pattern, key] of MESSAGE_TO_KEY) {
    if (pattern.test(normalized)) return key;
  }

  return fallbackKey;
}
