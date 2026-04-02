import { useEffect, useState } from "react";
import { Activity, Loader } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getSupplierAccountByAccountId,
  getSupplierById,
} from "../../services/supplierService";
import "./SupplierForm.css";

interface SupplierAccountFormData {
  name: string;
  contactEmail: string;
  phone: string;
  region: string;
  materialType: string;
  taxCode: string;
  address: string;
  status: string;
}

const defaultFormData: SupplierAccountFormData = {
  name: "",
  contactEmail: "",
  phone: "",
  region: "",
  materialType: "",
  taxCode: "",
  address: "",
  status: "",
};

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const pickString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === "number") {
      return String(value);
    }
  }
  return "";
};

const extractSupplierIdFromLookup = (payload: unknown): string => {
  const root = toRecord(payload);
  const nested = toRecord(root.data);
  const result = toRecord(nested.result || nested.data || root.result || root.data || payload);
  return pickString(result.id, result.supplierId);
};

const toSupplierFormData = (payload: unknown): SupplierAccountFormData => {
  const root = toRecord(payload);
  const nested = toRecord(root.data);
  const result = toRecord(nested.result || nested.data || root.result || root.data || payload);

  return {
    name: pickString(result.name),
    contactEmail: pickString(result.contactEmail),
    phone: pickString(result.phone),
    region: pickString(result.region),
    materialType: pickString(result.materialType),
    taxCode: pickString(result.taxCode),
    address: pickString(result.address),
    status: pickString(result.status),
  };
};

export default function SupplierAccountManagement() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState<SupplierAccountFormData>(defaultFormData);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        let resolvedSupplierId = pickString(currentUser?.supplierId, currentUser?.id);
        if (!resolvedSupplierId) {
          const accountId = pickString(currentUser?.userId, currentUser?.id);
          if (!accountId) {
            throw new Error("Unable to identify the signed-in account.");
          }
          const lookupResponse = await getSupplierAccountByAccountId(accountId);
          resolvedSupplierId = extractSupplierIdFromLookup(lookupResponse);
        }

        if (!resolvedSupplierId) {
          throw new Error("Unable to resolve supplierId for the current account.");
        }

        const supplierResponse = await getSupplierById(resolvedSupplierId);
        setFormData(toSupplierFormData(supplierResponse));
      } catch (error) {
        setErrorMsg(error instanceof Error ? error.message : "Unable to load supplier account data.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="supplier-form-loading">
        <Loader size={30} className="supplier-spin" />
        <p>Loading supplier profile...</p>
      </div>
    );
  }

  const statusClass =
    formData.status === "APPROVED"
      ? "status-approved"
      : formData.status === "PENDING"
        ? "status-pending"
        : formData.status === "SUSPENDED"
          ? "status-suspended"
          : formData.status === "REJECTED"
            ? "status-rejected"
            : "status-default";

  return (
    <div className="supplier-form-page">
      <div className="supplier-form-header">
        <div className="supplier-form-title-wrap">
          <h1 className="supplier-form-title">Account Management</h1>
          <p className="supplier-form-subtitle">View your supplier account information</p>
        </div>
      </div>

      {errorMsg && <div className="supplier-alert supplier-alert-error">{errorMsg}</div>}

      <div className="supplier-form-card">
        <div className="supplier-form-body">
          <div className="supplier-form-section">
            <h3 className="supplier-form-section-title">Basic Information</h3>
            <div className="supplier-form-grid supplier-form-grid-two">
              <div className="supplier-form-col-span-2">
                <label className="supplier-form-label">Supplier Name</label>
                <input
                  name="name"
                  value={formData.name}
                  readOnly
                  className="supplier-input supplier-input-readonly"
                />
              </div>

              <div>
                <label className="supplier-form-label">Email</label>
                <input
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  readOnly
                  className="supplier-input supplier-input-readonly"
                />
              </div>

              <div>
                <label className="supplier-form-label">Phone</label>
                <input
                  name="phone"
                  value={formData.phone}
                  readOnly
                  className="supplier-input supplier-input-readonly"
                />
              </div>
            </div>
          </div>

          <div className="supplier-form-section">
            <h3 className="supplier-form-section-title">Business Information</h3>
            <div className="supplier-form-grid supplier-form-grid-two">
              <div>
                <label className="supplier-form-label">Region</label>
                <input
                  name="region"
                  value={formData.region}
                  readOnly
                  className="supplier-input supplier-input-readonly"
                />
              </div>

              <div>
                <label className="supplier-form-label">Material Type</label>
                <input
                  name="materialType"
                  value={formData.materialType}
                  readOnly
                  className="supplier-input supplier-input-readonly"
                />
              </div>

              <div>
                <label className="supplier-form-label">Tax Code</label>
                <input
                  name="taxCode"
                  value={formData.taxCode}
                  readOnly
                  className="supplier-input supplier-input-readonly"
                />
              </div>

              <div className="supplier-form-col-span-2">
                <label className="supplier-form-label">Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  rows={3}
                  readOnly
                  className="supplier-textarea supplier-input-readonly"
                />
              </div>
            </div>
          </div>

          <div className="supplier-form-section">
            <h3 className="supplier-form-section-title">Account Status</h3>
            <div className="supplier-status-wrap">
              <Activity size={16} className="supplier-status-icon" />
              <input
                value={formData.status}
                readOnly
                className={`supplier-input supplier-input-readonly supplier-status-input ${statusClass}`}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
