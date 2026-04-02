import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Clock,
  CheckCircle,
  Edit3,
  PlusCircle,
  AlertCircle,
} from "lucide-react";
import { getSupplierAuditLogs } from "../../services/supplierService";
import "./SupplierAuditLogs.css";

// Định nghĩa Interface cho dữ liệu Audit Log
interface AuditLog {
  id: string | number;
  action: string;
  performedBy: string;
  performedAt: string;
  oldData: unknown;
  newData: unknown;
}

// Định nghĩa Interface cho dữ liệu đã được parse
interface AuditDataPayload {
  name?: string;
  contactEmail?: string;
  phone?: string;
  status?: string;
  region?: string;
  taxCode?: string;
  rejectionReason?: string;
  [key: string]: unknown;
}

export default function SupplierAuditLogs() {
  const { id } = useParams<{ id: string }>();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!id) return;
      try {
        const data = await getSupplierAuditLogs(id);
        setLogs(data.content || []);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [id]);

  const supplierName = useMemo(() => {
    if (logs.length === 0 || !logs[0].newData) {
      return "Supplier";
    }

    const firstData = parseAuditPayload(logs[0].newData);
    return firstData?.name || "Supplier";
  }, [logs]);

  function parseAuditPayload(raw: unknown): AuditDataPayload | null {
    if (!raw) return null;

    if (typeof raw === "object") {
      return raw as AuditDataPayload;
    }

    if (typeof raw !== "string") return null;

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return parsed as AuditDataPayload;
      }
      return null;
    } catch {
      return null;
    }
  }

  function toDisplayText(raw: unknown): string {
    if (raw === null || raw === undefined || raw === "") return "N/A";
    if (typeof raw === "string") return raw;
    try {
      return JSON.stringify(raw, null, 2);
    } catch {
      return String(raw);
    }
  }

  const renderAuditData = (rawData: unknown, type: "old" | "new") => {
    if (!rawData) {
      return <p className="audit-data-empty">N/A</p>;
    }

    const data = parseAuditPayload(rawData);
    if (!data) {
      const blockClass =
        type === "old"
          ? "audit-data-block audit-data-block--old"
          : "audit-data-block audit-data-block--new";

      return (
        <div className={`${blockClass} audit-data-raw`}>
          {toDisplayText(rawData)}
        </div>
      );
    }

    const hasValue = (value: unknown): boolean =>
      !(value === null || value === undefined || value === "");

    const supplierSource =
      data.supplier && typeof data.supplier === "object"
        ? (data.supplier as AuditDataPayload)
        : data;

    const hasProductInfo =
      hasValue(data.unit) ||
      hasValue(data.description) ||
      hasValue(data.pricePerUnit) ||
      hasValue(data.minOrderQuantity) ||
      hasValue(data.leadTimeDays) ||
      hasValue(data.productNameSnapshot) ||
      hasValue(data.productId) ||
      Boolean(data.supplier);

    const fields: Array<{ label: string; value: unknown; alert?: boolean }> = [
      { label: "Supplier Name", value: supplierSource.name },
      { label: "Email", value: supplierSource.contactEmail },
      { label: "Phone", value: supplierSource.phone },
      { label: "Material Type", value: supplierSource.materialType },
      { label: "Status", value: supplierSource.status },
      { label: "Region", value: supplierSource.region },
      { label: "Tax Code", value: supplierSource.taxCode },
      { label: "Rejection Reason", value: supplierSource.rejectionReason, alert: true },
    ];

    if (hasProductInfo) {
      fields.push(
        { label: "Product Name", value: data.name ?? data.productNameSnapshot },
        { label: "Unit", value: data.unit ?? data.productUnitSnapshot },
        { label: "Description", value: data.description },
        { label: "Price Per Unit", value: data.pricePerUnit },
        { label: "Min Order Quantity", value: data.minOrderQuantity },
        { label: "Lead Time Days", value: data.leadTimeDays },
      );
    }

    const blockClass =
      type === "old"
        ? "audit-data-block audit-data-block--old"
        : "audit-data-block audit-data-block--new";

    return (
      <div className={blockClass}>
        <ul className="audit-data-list">
          {fields.map((field) => {
            if (!hasValue(field.value)) return null;
            return (
              <li key={field.label} className="audit-data-row">
                <span className="audit-data-label">{field.label}:</span>
                <span
                  className={
                    field.alert
                      ? "audit-data-value audit-data-value--alert"
                      : "audit-data-value"
                  }
                >
                  {String(field.value)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };


  const getActionStyle = (action: string) => {
    switch (action) {
      case "CREATE":
        return {
          tone: "create",
          icon: <PlusCircle size={14} />,
        };
      case "UPDATE":
        return {
          tone: "update",
          icon: <Edit3 size={14} />,
        };
      case "APPROVE":
        return {
          tone: "approve",
          icon: <CheckCircle size={14} />,
        };
      case "REJECT":
        return {
          tone: "reject",
          icon: <AlertCircle size={14} />,
        };
      default:
        return {
          tone: "default",
          icon: <AlertCircle size={14} />,
        };
    }
  };

  return (
    <div className="supplier-audit-page">
      <header className="supplier-audit-header">
        <Link to={`/admin/suppliers/${id}`} className="supplier-audit-back-btn" aria-label="Back to supplier detail">
          <ArrowLeft size={18} />
        </Link>

        <div className="supplier-audit-title-wrap">
          <h1 className="supplier-audit-title">Supplier Audit History</h1>
          <p className="supplier-audit-subtitle">Tracking all changes for: {supplierName}</p>
        </div>
      </header>

      <section className="supplier-audit-timeline">
        {loading ? (
          <div className="supplier-audit-state">Loading audit history...</div>
        ) : logs.length === 0 ? (
          <div className="supplier-audit-state">No history found for this supplier.</div>
        ) : (
          logs.map((log) => {
            const style = getActionStyle(log.action);
            return (
              <article key={log.id} className={`supplier-audit-item supplier-audit-item--${style.tone}`}>
                <span className={`supplier-audit-dot supplier-audit-dot--${style.tone}`}></span>

                <div className="supplier-audit-card">
                  <div className="supplier-audit-card-head">
                    <div className="supplier-audit-head-left">
                      <span className={`supplier-audit-badge supplier-audit-badge--${style.tone}`}>
                        {style.icon}
                        {log.action}
                      </span>

                      <span className="supplier-audit-actor">
                        <User size={14} />
                        {log.performedBy}
                      </span>
                    </div>

                    <span className="supplier-audit-time">
                      <Clock size={14} />
                      {new Date(log.performedAt).toLocaleString("en-GB")}
                    </span>
                  </div>

                  <div className="supplier-audit-card-body">
                    <div className="audit-column">
                      <p className="audit-column-title">Previous State</p>
                      {renderAuditData(log.oldData, "old")}
                    </div>

                    <div className="audit-column">
                      <p className="audit-column-title">Current State</p>
                      {renderAuditData(log.newData, "new")}
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}