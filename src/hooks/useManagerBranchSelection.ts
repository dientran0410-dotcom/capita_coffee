import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  resolveManagerBranchOptions,
  type ManagerBranchContext,
  type ManagerBranchDisplayMap,
} from "../services/managerBranchService";

const QUERY_KEY = "franchiseId";
const STORAGE_KEY = "manager:selectedFranchiseId";

const readStoredBranchId = (): string => {
  try {
    return String(globalThis.localStorage?.getItem(STORAGE_KEY) ?? "").trim();
  } catch {
    return "";
  }
};

const writeStoredBranchId = (branchId: string) => {
  try {
    const normalized = branchId.trim();
    if (normalized) {
      globalThis.localStorage?.setItem(STORAGE_KEY, normalized);
      return;
    }

    globalThis.localStorage?.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
};

export function useManagerBranchSelection(authFranchiseId?: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedBranchId = String(searchParams.get(QUERY_KEY) ?? "").trim();

  const [branches, setBranches] = useState<ManagerBranchContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadBranches = async () => {
      setLoading(true);
      setError("");

      try {
        const items = await resolveManagerBranchOptions(authFranchiseId);
        if (!mounted) return;
        setBranches(items);
      } catch (err) {
        if (!mounted) return;
        setBranches([]);
        setError(err instanceof Error ? err.message : "Failed to load franchises");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadBranches();
    return () => {
      mounted = false;
    };
  }, [authFranchiseId]);

  const selectedBranch = useMemo(() => {
    if (!branches.length) return null;

    const candidates = [
      requestedBranchId,
      readStoredBranchId(),
      String(authFranchiseId ?? "").trim(),
    ];

    for (const candidate of candidates) {
      if (!candidate) continue;
      const matched = branches.find((item) => item.branchId === candidate);
      if (matched) return matched;
    }

    return branches[0];
  }, [branches, requestedBranchId, authFranchiseId]);

  useEffect(() => {
    const selectedBranchId = selectedBranch?.branchId ?? "";
    if (!selectedBranchId) return;

    writeStoredBranchId(selectedBranchId);

    if (requestedBranchId === selectedBranchId) return;

    const next = new URLSearchParams(searchParams);
    next.set(QUERY_KEY, selectedBranchId);
    setSearchParams(next, { replace: true });
  }, [selectedBranch, requestedBranchId, searchParams, setSearchParams]);

  const setSelectedBranchId = useCallback(
    (branchId: string) => {
      const normalized = branchId.trim();
      const next = new URLSearchParams(searchParams);

      if (normalized) {
        next.set(QUERY_KEY, normalized);
      } else {
        next.delete(QUERY_KEY);
      }

      writeStoredBranchId(normalized);
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const branchDisplayMap = useMemo<ManagerBranchDisplayMap>(() => {
    return branches.reduce<ManagerBranchDisplayMap>((acc, item) => {
      acc[item.branchId] = item.displayName || item.branchId;
      return acc;
    }, {});
  }, [branches]);

  return {
    branches,
    selectedBranch,
    selectedBranchId: selectedBranch?.branchId ?? "",
    branchDisplayMap,
    loading,
    error,
    setSelectedBranchId,
  };
}
