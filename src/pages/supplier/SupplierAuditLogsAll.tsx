import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAdminCustomerProfileByUserId,
  getAllSupplierAuditLogs,
  getSupplierById,
} from "../../services/supplierService";
import "./SupplierAuditLogsAll.css";

type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" | string;

type SupplierAuditLog = {
  id: string;
  action: AuditAction;
  oldData: unknown;
  newData: unknown;
  performedBy: string;
  performedAt: string;
};

type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  status: string;
};

type SupplierSnapshot = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: string;
  region: string;
  taxCode: string;
};

type SupplierAuditLogPage = {
  content: SupplierAuditLog[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
};

const PAGE_SIZE = 10;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HIDDEN_AUDIT_FIELDS = new Set(["rating"]);
const ACTOR_ID_FIELDS = new Set([
  "approvedby",
  "createby",
  "createdby",
  "updateby",
  "updatedby",
  "deleteby",
  "deletedby",
]);
const DATE_TIME_FIELDS = new Set([
  "approvedat",
  "createat",
  "createdat",
  "updateat",
  "updatedat",
  "deleteat",
  "deletedat",
  "performedat",
]);

const asNonEmptyString = (value: unknown): string => {
  const normalized = String(value ?? "").trim();
  return normalized || "-";
};

const isUuid = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  return UUID_REGEX.test(value.trim());
};

const toPrettyText = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const parseJsonSafe = (value: unknown): Record<string, unknown> | null => {
  if (!value) return null;

  if (typeof value === "object") {
    return value as Record<string, unknown>;
  }

  if (typeof value !== "string") return null;

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
};

const toDisplayValue = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const formatFieldLabel = (key: string): string =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (char) => char.toUpperCase());

const getComparablePayload = (value: unknown): Record<string, unknown> => {
  const parsed = parseJsonSafe(value);
  return parsed ?? {};
};

const formatTimestampParts = (value: string): { date: string; time: string } => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { date: value || "-", time: "-" };
  }

  const formattedDate = date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formattedTime = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return {
    date: formattedDate,
    time: formattedTime,
  };
};

const formatEnglishDateTime = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "-";

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return toDisplayValue(value);
  }

  const datePart = date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const timePart = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return `${datePart} ${timePart}`;
};

const actionTone = (action: AuditAction): "create" | "update" | "delete" | "other" => {
  const upper = String(action || "").toUpperCase();
  if (upper.includes("CREATE") || upper.includes("APPROVE")) return "create";
  if (upper.includes("UPDATE")) return "update";
  if (upper.includes("DELETE") || upper.includes("REJECT")) return "delete";
  return "other";
};

const extractSupplierSnapshot = (log: SupplierAuditLog): SupplierSnapshot => {
  const next = parseJsonSafe(log.newData);
  const previous = parseJsonSafe(log.oldData);
  const source = next ?? previous ?? {};

  return {
    id: asNonEmptyString((next?.id ?? previous?.id ?? source.id) as unknown),
    name: asNonEmptyString((next?.name ?? previous?.name ?? source.name) as unknown),
    email: asNonEmptyString((next?.contactEmail ?? next?.email ?? previous?.contactEmail ?? previous?.email ?? source.email) as unknown),
    phone: asNonEmptyString((next?.phone ?? previous?.phone ?? source.phone) as unknown),
    address: asNonEmptyString((next?.address ?? previous?.address ?? source.address) as unknown),
    status: asNonEmptyString((next?.status ?? previous?.status ?? source.status) as unknown),
    region: asNonEmptyString((next?.region ?? previous?.region ?? source.region) as unknown),
    taxCode: asNonEmptyString((next?.taxCode ?? previous?.taxCode ?? source.taxCode) as unknown),
  };
};

const collectActorIdsFromPayload = (payload: unknown): string[] => {
  const obj = parseJsonSafe(payload);
  if (!obj) return [];

  const ids: string[] = [];
  Object.entries(obj).forEach(([key, rawValue]) => {
    const normalizedKey = key.trim().toLowerCase();
    if (!ACTOR_ID_FIELDS.has(normalizedKey)) return;

    const candidate = String(rawValue ?? "").trim();
    if (isUuid(candidate)) {
      ids.push(candidate);
    }
  });

  return ids;
};

export default function SupplierAuditLogsAll() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [logsPage, setLogsPage] = useState<SupplierAuditLogPage>({
    content: [],
    totalPages: 0,
    totalElements: 0,
    number: 0,
    size: PAGE_SIZE,
    first: true,
    last: true,
    empty: true,
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [performerProfileMap, setPerformerProfileMap] = useState<Record<string, UserProfile>>({});
  const [supplierDetailMap, setSupplierDetailMap] = useState<Record<string, SupplierSnapshot>>({});

  const mergeUserProfile = useCallback((profilePayload: unknown, fallbackId: string): UserProfile => {
    const response = profilePayload && typeof profilePayload === "object"
      ? (profilePayload as Record<string, unknown>)
      : {};
    const data = response.data && typeof response.data === "object"
      ? (response.data as Record<string, unknown>)
      : response;

    return {
      id: asNonEmptyString(data.id ?? fallbackId),
      name: asNonEmptyString(data.name),
      email: asNonEmptyString(data.email),
      phone: asNonEmptyString(data.phone),
      address: asNonEmptyString(data.address),
      role: asNonEmptyString(data.role),
      status: asNonEmptyString(data.status),
    };
  }, []);

  const hydratePerformerProfiles = useCallback(async (logs: SupplierAuditLog[]) => {
    const ids = Array.from(new Set(logs.flatMap((log) => {
      const performedById = String(log.performedBy || "").trim();
      const candidates: string[] = [];

      if (isUuid(performedById)) {
        candidates.push(performedById);
      }

      candidates.push(...collectActorIdsFromPayload(log.oldData));
      candidates.push(...collectActorIdsFromPayload(log.newData));

      return candidates;
    })));

    if (ids.length === 0) return;

    const updates: Record<string, UserProfile> = {};

    await Promise.all(
      ids.map(async (id) => {
        try {
          const profileResponse = await getAdminCustomerProfileByUserId(id);
          updates[id] = mergeUserProfile(profileResponse, id);
        } catch {
          updates[id] = {
            id,
            name: id,
            email: "-",
            phone: "-",
            address: "-",
            role: "-",
            status: "-",
          };
        }
      }),
    );

    if (Object.keys(updates).length > 0) {
      setPerformerProfileMap((prev) => ({ ...prev, ...updates }));
    }
  }, [mergeUserProfile]);

  const hydrateSupplierDetails = useCallback(async (logs: SupplierAuditLog[]) => {
    const snapshots = logs.map((log) => extractSupplierSnapshot(log));
    const ids = Array.from(
      new Set(
        snapshots
          .map((item) => item.id)
          .filter((id) => isUuid(id)),
      ),
    );

    if (ids.length === 0) return;

    const updates: Record<string, SupplierSnapshot> = {};

    await Promise.all(
      ids.map(async (id) => {
        try {
          const supplierResponse = await getSupplierById(id);
          const supplierObj = supplierResponse && typeof supplierResponse === "object"
            ? (supplierResponse as Record<string, unknown>)
            : {};

          updates[id] = {
            id: asNonEmptyString(supplierObj.id ?? id),
            name: asNonEmptyString(supplierObj.name),
            email: asNonEmptyString(supplierObj.contactEmail ?? supplierObj.email),
            phone: asNonEmptyString(supplierObj.phone),
            address: asNonEmptyString(supplierObj.address),
            status: asNonEmptyString(supplierObj.status),
            region: asNonEmptyString(supplierObj.region),
            taxCode: asNonEmptyString(supplierObj.taxCode),
          };
        } catch {
          // Keep using snapshot fallback if supplier detail API fails.
        }
      }),
    );

    if (Object.keys(updates).length > 0) {
      setSupplierDetailMap((prev) => ({ ...prev, ...updates }));
    }
  }, []);

  const getDisplayPerformerName = useCallback((log: SupplierAuditLog): string => {
    const rawId = String(log.performedBy || "").trim();
    if (!rawId) return "-";
    if (!isUuid(rawId)) return rawId;
    return performerProfileMap[rawId]?.name || rawId;
  }, [performerProfileMap]);

  const getDisplaySupplier = useCallback((log: SupplierAuditLog): SupplierSnapshot => {
    const snapshot = extractSupplierSnapshot(log);
    if (!isUuid(snapshot.id)) return snapshot;
    return supplierDetailMap[snapshot.id] || snapshot;
  }, [supplierDetailMap]);

  const renderPayloadFields = useCallback(
    (value: unknown, comparedValue: unknown) => {
      const payload = getComparablePayload(value);
      const comparedPayload = getComparablePayload(comparedValue);
      const keys = Object.keys(payload).filter(
        (key) => !HIDDEN_AUDIT_FIELDS.has(key.trim().toLowerCase()),
      );

      if (keys.length === 0) {
        return <p className="audit-all-no-structured">{toPrettyText(value)}</p>;
      }

      return (
        <div className="audit-all-field-list">
          {keys.map((key) => {
            const rawCurrent = payload[key];
            const normalizedKey = key.trim().toLowerCase();

            const actorProfileName =
              ACTOR_ID_FIELDS.has(normalizedKey) &&
              isUuid(String(rawCurrent ?? "").trim())
                ? performerProfileMap[String(rawCurrent).trim()]?.name
                : undefined;

            const current = actorProfileName
              || (DATE_TIME_FIELDS.has(normalizedKey)
                ? formatEnglishDateTime(rawCurrent)
                : toDisplayValue(rawCurrent));

            const compared = DATE_TIME_FIELDS.has(normalizedKey)
              ? formatEnglishDateTime(comparedPayload[key])
              : toDisplayValue(comparedPayload[key]);
            const changed = current !== compared;

            return (
              <div key={key} className={`audit-all-field-row ${changed ? "is-changed" : ""}`}>
                <span className="audit-all-field-label">{formatFieldLabel(key)}</span>
                <span className="audit-all-field-value">{current}</span>
              </div>
            );
          })}
        </div>
      );
    },
    [performerProfileMap],
  );

  const fetchLogs = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await getAllSupplierAuditLogs(page, PAGE_SIZE);

      setLogsPage({
        content: Array.isArray(response?.content) ? response.content : [],
        totalPages: Number(response?.totalPages ?? 0),
        totalElements: Number(response?.totalElements ?? 0),
        number: Number(response?.number ?? page),
        size: Number(response?.size ?? PAGE_SIZE),
        first: Boolean(response?.first),
        last: Boolean(response?.last),
        empty: Boolean(response?.empty),
      });

      const normalizedLogs = Array.isArray(response?.content) ? response.content : [];
      await Promise.all([
        hydratePerformerProfiles(normalizedLogs),
        hydrateSupplierDetails(normalizedLogs),
      ]);

      setExpandedId(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load supplier audit logs.");
      setLogsPage((prev) => ({
        ...prev,
        content: [],
        totalElements: 0,
        totalPages: 0,
        empty: true,
      }));
    } finally {
      setLoading(false);
    }
  }, [hydratePerformerProfiles, hydrateSupplierDetails]);

  useEffect(() => {
    void fetchLogs(0);
  }, [fetchLogs]);

  const currentPageLabel = useMemo(() => logsPage.number + 1, [logsPage.number]);
  const hasData = logsPage.content.length > 0;

  return (
    <div className="supplier-audit-all-page">
      <div className="supplier-audit-all-header">
        <div>
          <h1>Supplier Audit Logs</h1>
          <p>Admin view of all supplier change history across the system.</p>
        </div>
        <div className="supplier-audit-all-actions">
          <button className="btn-secondary" onClick={() => navigate("/admin/suppliers")}>Back to Suppliers</button>
          <button className="btn-primary" onClick={() => { void fetchLogs(logsPage.number); }} disabled={loading}>Refresh</button>
        </div>
      </div>

      {errorMessage ? <div className="audit-all-alert audit-all-alert-error">{errorMessage}</div> : null}

      <div className="audit-all-table-card">
        <div className="audit-all-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Action</th>
                <th>Performed By</th>
                <th>Supplier Name</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="audit-all-empty">Loading audit logs...</td>
                </tr>
              ) : !hasData ? (
                <tr>
                  <td colSpan={5} className="audit-all-empty">No audit log data found.</td>
                </tr>
              ) : (
                logsPage.content.map((log) => {
                  const tone = actionTone(log.action);
                  const isExpanded = expandedId === log.id;
                  const supplierDisplay = getDisplaySupplier(log);
                  const performerName = getDisplayPerformerName(log);
                  const performerId = String(log.performedBy || "").trim();
                  const performerProfile = performerId && isUuid(performerId)
                    ? performerProfileMap[performerId]
                    : null;
                  const timeParts = formatTimestampParts(log.performedAt);

                  return (
                    <Fragment key={log.id}>
                      <tr>
                        <td>
                          <div className="audit-all-time-wrap">
                            <span className="audit-all-time-date">{timeParts.date}</span>
                            <span className="audit-all-time-hour">{timeParts.time}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`audit-all-action audit-all-action-${tone}`}>{log.action}</span>
                        </td>
                        <td>{performerName}</td>
                        <td>{supplierDisplay.name}</td>
                        <td>
                          <button
                            className="audit-all-link-btn"
                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                          >
                            {isExpanded ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>
                      {isExpanded ? (
                        <tr className="audit-all-detail-row">
                          <td colSpan={5}>
                            <div className="audit-all-profile-grid">
                              <div className="audit-all-profile-card">
                                <h4>Performed By</h4>
                                <p><strong>Name:</strong> {performerProfile?.name || performerName || "-"}</p>
                                <p><strong>User ID:</strong> {performerId || "-"}</p>
                                <p><strong>Email:</strong> {performerProfile?.email || "-"}</p>
                                <p><strong>Phone:</strong> {performerProfile?.phone || "-"}</p>
                                <p><strong>Role:</strong> {performerProfile?.role || "-"}</p>
                                <p><strong>Status:</strong> {performerProfile?.status || "-"}</p>
                              </div>

                              <div className="audit-all-profile-card">
                                <h4>Supplier</h4>
                                <p><strong>Name:</strong> {supplierDisplay.name}</p>
                                <p><strong>Supplier ID:</strong> {supplierDisplay.id}</p>
                                <p><strong>Email:</strong> {supplierDisplay.email}</p>
                                <p><strong>Phone:</strong> {supplierDisplay.phone}</p>
                                <p><strong>Region:</strong> {supplierDisplay.region}</p>
                                <p><strong>Status:</strong> {supplierDisplay.status}</p>
                              </div>
                            </div>

                            <div className="audit-all-detail-grid">
                              <div>
                                <h4>Old Data</h4>
                                {renderPayloadFields(log.oldData, log.newData)}
                              </div>
                              <div>
                                <h4>New Data</h4>
                                {renderPayloadFields(log.newData, log.oldData)}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="audit-all-pagination">
        <button
          className="btn-pagination"
          disabled={loading || logsPage.first || logsPage.totalPages === 0}
          onClick={() => { void fetchLogs(Math.max(logsPage.number - 1, 0)); }}
        >
          Previous
        </button>
        <span className="audit-all-pagination-info">
          Page {logsPage.totalPages === 0 ? 0 : currentPageLabel} / {logsPage.totalPages}
        </span>
        <button
          className="btn-pagination"
          disabled={loading || logsPage.last || logsPage.totalPages === 0}
          onClick={() => { void fetchLogs(logsPage.number + 1); }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
