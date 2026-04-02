import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeDollarSign,
  Boxes,
  Package,
  Save,
  TimerReset,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { createSupplierProduct } from "../../services/supplierService";
import "./ProductManagement.css";
import "./CreateSupplierProduct.css";

interface CreateProductFormState {
  name: string;
  unit: string;
  description: string;
  pricePerUnit: string;
  minOrderQuantity: string;
  leadTimeDays: string;
}

const DEFAULT_FORM: CreateProductFormState = {
  name: "",
  unit: "",
  description: "",
  pricePerUnit: "",
  minOrderQuantity: "1",
  leadTimeDays: "1",
};

const UNIT_OPTIONS = ["GRAM", "KILOGRAM", "MILLILITER", "LITER", "PIECE"] as const;

export default function CreateSupplierProduct() {
  const navigate = useNavigate();
  const location = useLocation();
  const { supplierId } = useParams<{ supplierId: string }>();

  const [form, setForm] = useState<CreateProductFormState>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isAdminPath = location.pathname.startsWith("/admin/");

  const backPath = useMemo(() => {
    if (!supplierId) {
      return "/";
    }

    return isAdminPath
      ? `/admin/suppliers/${supplierId}/products`
      : `/supplier/${supplierId}/products`;
  }, [isAdminPath, supplierId]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supplierId) {
      setErrorMessage("Missing supplierId in URL.");
      return;
    }

    const pricePerUnit = Number(form.pricePerUnit);
    const minOrderQuantity = Number(form.minOrderQuantity);
    const leadTimeDays = Number(form.leadTimeDays);

    if (!form.name.trim()) {
      setErrorMessage("Name is required.");
      return;
    }

    if (!form.unit.trim()) {
      setErrorMessage("Unit is required.");
      return;
    }

    if (!Number.isFinite(pricePerUnit) || pricePerUnit <= 0) {
      setErrorMessage("Price per unit must be a valid number and > 0.");
      return;
    }

    if (!Number.isFinite(minOrderQuantity) || minOrderQuantity < 1) {
      setErrorMessage("Min order quantity must be >= 1.");
      return;
    }

    if (!Number.isFinite(leadTimeDays) || leadTimeDays < 1) {
      setErrorMessage("Lead time days must be >= 1.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");
      setSuccessMessage("");

      await createSupplierProduct(
        supplierId,
        {
          name: form.name.trim(),
          unit: form.unit.trim(),
          description: form.description.trim(),
          pricePerUnit,
          minOrderQuantity,
          leadTimeDays,
        }
      );

      setSuccessMessage("Product created successfully.");
      setTimeout(() => navigate(backPath), 900);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Create product failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="spm-layout">

      <section className="spm-main">
        <main className="spm-content">
          <div className="csp-page">
            <header className="csp-header">
              <button type="button" className="csp-back-btn" onClick={() => navigate(backPath)}>
                <ArrowLeft size={20} strokeWidth={2.8} color="#0f172a" className="csp-back-icon" />
              </button>

              <div className="csp-title-wrap">
                <h1 className="csp-title">Create Supplier Product</h1>
                <p className="csp-subtitle">Supplier ID: {supplierId ?? "-"}</p>
              </div>
            </header>

            <section className="csp-card">
              <div className="csp-card-head">
                <h2>Add New Product Quotation</h2>
                <p>Fill exactly the required fields to create supplier product mapping.</p>
              </div>

              {errorMessage ? <div className="csp-alert csp-alert-error">{errorMessage}</div> : null}
              {successMessage ? <div className="csp-alert csp-alert-success">{successMessage}</div> : null}

              <form className="csp-form" onSubmit={handleSubmit}>
                <label className="csp-field csp-field-full">
                  <span>Name</span>
                  <div className="csp-input-wrap">
                    <Package size={16} className="csp-input-icon" />
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleInputChange}
                      placeholder="E.g.: Premium Wheat Flour"
                      required
                    />
                  </div>
                </label>

                <label className="csp-field">
                  <span>Unit</span>
                  <div className="csp-input-wrap">
                    <Boxes size={16} className="csp-input-icon" />
                    <select
                      name="unit"
                      value={form.unit}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="" disabled>
                        Select unit
                      </option>
                      {UNIT_OPTIONS.map((unitOption) => (
                        <option key={unitOption} value={unitOption}>
                          {unitOption}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="csp-field">
                  <span>Price Per Unit</span>
                  <div className="csp-input-wrap">
                    <BadgeDollarSign size={16} className="csp-input-icon" />
                    <input
                      type="number"
                      name="pricePerUnit"
                      min={0.01}
                      step="0.01"
                      value={form.pricePerUnit}
                      onChange={handleInputChange}
                      placeholder="0.01"
                      required
                    />
                  </div>
                </label>

                <label className="csp-field">
                  <span>Min Order Quantity</span>
                  <div className="csp-input-wrap">
                    <TimerReset size={16} className="csp-input-icon" />
                    <input
                      type="number"
                      name="minOrderQuantity"
                      min={1}
                      step="1"
                      value={form.minOrderQuantity}
                      onChange={handleInputChange}
                      placeholder="1"
                      required
                    />
                  </div>
                </label>

                <label className="csp-field csp-field-full">
                  <span>Description</span>
                  <div className="csp-input-wrap">
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, description: event.target.value }))
                      }
                      placeholder="Product description"
                    />
                  </div>
                </label>

                <label className="csp-field csp-field-full">
                  <span>Lead Time Days</span>
                  <div className="csp-input-wrap">
                    <TimerReset size={16} className="csp-input-icon" />
                    <input
                      type="number"
                      name="leadTimeDays"
                      min={1}
                      step="1"
                      value={form.leadTimeDays}
                      onChange={handleInputChange}
                      placeholder="365"
                      required
                    />
                  </div>
                </label>

                <div className="csp-actions">
                  <button
                    type="button"
                    className="csp-btn csp-btn-ghost"
                    onClick={() => navigate(backPath)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="csp-btn csp-btn-primary" disabled={submitting}>
                    <Save size={15} />
                    {submitting ? "Creating..." : "Create Product"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </main>
      </section>
    </div>
  );
}
