type StoredUser = {
  branchId?: string;
  raw?: {
    branchId?: string;
    user?: {
      branchId?: string;
    };
  };
};

const USER_STORAGE_KEYS = ['user', 'auth_user'] as const;

function readStoredUser(): StoredUser | null {
  for (const key of USER_STORAGE_KEYS) {
    const raw =
      globalThis.localStorage?.getItem(key) ??
      globalThis.sessionStorage?.getItem(key);

    if (!raw) continue;

    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      continue;
    }
  }

  return null;
}

export function getLoggedInBranchId(): string | undefined {
  const user = readStoredUser();
  if (!user) return undefined;

  return user.branchId || user.raw?.branchId || user.raw?.user?.branchId || undefined;
}
