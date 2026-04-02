import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCurrentStaffProfile, getStaffById } from "../services/staffService";
import { resolveStaffIdCandidates } from "../utils/staffIdentity";

type AnyRecord = Record<string, unknown>;

const toRecord = (value: unknown): AnyRecord =>
  value && typeof value === "object" ? (value as AnyRecord) : {};

const pickString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return "";
};

const pushUnique = (target: string[], value: unknown) => {
  const normalized = pickString(value);
  if (!normalized) return;
  if (!target.includes(normalized)) {
    target.push(normalized);
  }
};

export function useResolvedStaffIdentity() {
  const { user } = useAuth();
  const fallbackStaffIds = useMemo(() => resolveStaffIdCandidates(user), [user]);

  const [staffRecord, setStaffRecord] = useState<AnyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getCurrentStaffProfile();
      setStaffRecord(toRecord(response));
    } catch (err) {
      let resolvedFallback: AnyRecord | null = null;

      for (const candidateId of fallbackStaffIds) {
        try {
          const response = await getStaffById(candidateId);
          resolvedFallback = toRecord(response);
          break;
        } catch {
          // Ignore invalid candidates and keep trying the next one.
        }
      }

      setStaffRecord(resolvedFallback);
      if (!resolvedFallback) {
        setError(err instanceof Error ? err.message : "Unable to resolve current staff profile.");
      }
    } finally {
      setLoading(false);
    }
  }, [fallbackStaffIds]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const staffIds = useMemo(() => {
    const ids: string[] = [];
    pushUnique(ids, staffRecord?.id);
    pushUnique(ids, staffRecord?.staffId);
    pushUnique(ids, staffRecord?.userId);
    fallbackStaffIds.forEach((candidate) => pushUnique(ids, candidate));
    return ids;
  }, [fallbackStaffIds, staffRecord]);

  const resolvedStaffId = useMemo(() => pickString(staffRecord?.id), [staffRecord]);
  const resolvedBranchId = useMemo(
    () =>
      pickString(
        staffRecord?.branchId,
        staffRecord?.franchiseId,
        toRecord(staffRecord?.raw).branchId,
        toRecord(staffRecord?.raw).franchiseId
      ),
    [staffRecord]
  );

  return {
    staff: staffRecord,
    staffIds,
    resolvedStaffId,
    resolvedBranchId,
    loading,
    error,
    refresh,
  };
}

export default useResolvedStaffIdentity;
