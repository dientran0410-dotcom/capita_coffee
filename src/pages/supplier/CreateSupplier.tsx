import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Factory,
  Loader,
} from "lucide-react";
import { createSupplier } from "../../services/supplierService";
import { useAuth } from "../../context/AuthContext";
import "./SupplierForm.css";

// Định nghĩa kiểu dữ liệu cho form
interface SupplierFormData {
  name: string;
  contactEmail: string;
  phone: string;
  region: string;
  taxCode: string;
  address: string;
  materialType: string;
}

// Định nghĩa kiểu dữ liệu cho lỗi các field
type FieldErrors = Partial<Record<keyof SupplierFormData, string>>;

type CreateSupplierError = Error & {
  errors?: FieldErrors;
};

export default function CreateSupplier() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const actionUser = String(
    currentUser?.id ??
    currentUser?.raw?.userId ??
    currentUser?.raw?.id ??
    currentUser?.username ??
    "admin_user"
  ).trim();
  
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    contactEmail: "",
    name: "",
    taxCode: "",
    phone: "",
  });

  const [formData, setFormData] = useState<SupplierFormData>({
    name: "",
    contactEmail: "",
    phone: "",
    region: "NORTH",
    taxCode: "",
    address: "",
    materialType: "",
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      await createSupplier(formData, actionUser);
      setSuccessMessage("Supplier created successfully!");
      
      // Giữ trạng thái isSubmitting = true để nút luôn mờ cho đến khi chuyển trang
      setTimeout(() => {
        navigate("/admin/suppliers");
      }, 2000);
    } catch (err) {
      setIsSubmitting(false); // Mở lại nút nếu có lỗi để người dùng sửa
      const error = err as CreateSupplierError;
      if (error.errors && typeof error.errors === "object") {
        setFieldErrors(error.errors);
      } else {
        alert("System error: " + (error.message || "Unknown error"));
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="supplier-form-page">
      {/* Header: Nút Back và Tiêu đề */}
      <div className="supplier-form-header">
        <Link
          to="/admin/suppliers"
          className="supplier-form-back-btn"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="supplier-form-title-wrap">
          <h1 className="supplier-form-title">Add New Supplier</h1>
          <p className="supplier-form-subtitle">
            Enter the details of the new supply chain partner.
          </p>
        </div>
      </div>

      {/* Khung Form Container */}
      <form
        onSubmit={handleSubmit}
        className="supplier-form-card"
      >
        <div className="supplier-form-body">
          {/* Phần 1: Thông tin cơ bản */}
          <div className="supplier-form-section">
            <h3 className="supplier-form-section-title">
              Basic Information
            </h3>
            <div className="supplier-form-grid supplier-form-grid-two">
              <div className="supplier-form-col-span-2">
                <label className="supplier-form-label">
                  Supplier Name *
                </label>
                <div className="supplier-input-wrap">
                  <Building2 size={18} className="supplier-input-icon" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Fresh Farms Inc."
                    className="supplier-input with-icon"
                  />
                </div>
                {fieldErrors.name && (
                  <p className="supplier-field-error">{fieldErrors.name}</p>
                )}
              </div>

              <div>
                <label className="supplier-form-label">
                  Email Address *
                </label>
                <div className="supplier-input-wrap">
                  <Mail size={18} className="supplier-input-icon" />
                  <input
                    type="email"
                    name="contactEmail"
                    required
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder="contact@company.com"
                    className="supplier-input with-icon"
                  />
                </div>
                {fieldErrors.contactEmail && (
                  <p className="supplier-field-error">{fieldErrors.contactEmail}</p>
                )}
              </div>

              <div>
                <label className="supplier-form-label">
                  Phone Number *
                </label>
                <div className="supplier-input-wrap">
                  <Phone size={18} className="supplier-input-icon" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+1 (555) 000-0000"
                    className="supplier-input with-icon"
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="supplier-field-error">{fieldErrors.phone}</p>
                )}
              </div>

              <div className="supplier-form-col-span-2">
                <label className="supplier-form-label">
                  Supplier Type *
                </label>
                <div className="supplier-input-wrap">
                  <Factory size={18} className="supplier-input-icon" />
                  <input
                    type="text"
                    name="materialType"
                    required
                    value={formData.materialType}
                    onChange={handleChange}
                    className="supplier-input with-icon"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Phần 2: Khu vực và Pháp lý */}
          <div className="supplier-form-section">
            <h3 className="supplier-form-section-title">
              Location & Legal
            </h3>
            <div className="supplier-form-grid supplier-form-grid-two">
              <div>
                <label className="supplier-form-label">
                  Operating Region
                </label>
                <div className="supplier-input-wrap">
                  <MapPin size={18} className="supplier-input-icon" />
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    className="supplier-input supplier-select with-icon"
                  >
                    <option value="NORTH">North Vietnam</option>
                    <option value="CENTRAL">Central Vietnam</option>
                    <option value="SOUTH">South Vietnam</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="supplier-form-label">
                  Tax ID / Registration No. *
                </label>
                <div className="supplier-input-wrap">
                  <FileText size={18} className="supplier-input-icon" />
                  <input
                    type="text"
                    name="taxCode"
                    value={formData.taxCode}
                    onChange={handleChange}
                    required
                    placeholder="e.g. 12-3456789"
                    className="supplier-input with-icon"
                  />
                </div>
                {fieldErrors.taxCode && (
                  <p className="supplier-field-error">{fieldErrors.taxCode}</p>
                )}
              </div>

              <div className="supplier-form-col-span-2">
                <label className="supplier-form-label">
                  Full Address *
                </label>
                <textarea
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  required
                  placeholder="Enter complete address..."
                  className="supplier-textarea"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Thông báo và Nút Hành động */}
        <div className="supplier-form-footer">
          {successMessage && (
            <div className="supplier-success-message">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {successMessage}
            </div>
          )}
          
          <div className="supplier-form-actions">
            <button
              type="button"
              onClick={() => navigate("/admin/suppliers")}
              className="supplier-btn supplier-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="supplier-btn supplier-btn-primary"
            >
              {isSubmitting ? (
                <Loader size={16} className="supplier-spin" />
              ) : (
                <Save size={16} />
              )}
              {isSubmitting ? "Saving..." : "Save Supplier"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}