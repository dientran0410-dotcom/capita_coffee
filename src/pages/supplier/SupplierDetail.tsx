import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Edit,
  Package,
  Filter,
  History,
} from "lucide-react";

import {
  getSupplierById,
  getAllProductsWithAllStatusesBySupplierId,
  updateSupplierProduct,
  deleteSupplierProduct,
} from "../../services/supplierService";
import "./SupplierDetail.css";

// Định nghĩa Interface cho Supplier
interface Supplier {
  id: string | number;
  name: string;
  status: string;
  contactEmail?: string;
  phone?: string;
  materialType?: string;
  taxCode?: string;
  address?: string;
  region?: string;
  approvedBy?: string;
  approvedAt?: string;
  createAt?: string;
  updateAt?: string;
  [key: string]: unknown;
}

// Định nghĩa Interface cho Product của Supplier
interface SupplierProduct {
  id: string;
  supplierId: string;
  supplierName: string;
  productId: string | null;
  productNameSnapshot: string | null;
  productUnitSnapshot: string | null;
  name: string;
  unit: string;
  description: string;
  pricePerUnit: number;
  minOrderQuantity: number;
  leadTimeDays: number;
  isDeleted: boolean;
  createBy: string;
  createAt: string;
  updateAt: string;
}

// Định nghĩa interface cho filter params
interface FetchProductParams {
  page: number;
  size: number;
  isActive: boolean | null;
}

export default function SupplierDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/admin/suppliers");
  };

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [allProducts, setAllProducts] = useState<SupplierProduct[]>([]);
  const [productLoading, setProductLoading] = useState<boolean>(false);
  const [filterActive, setFilterActive] = useState<string>("");

  // State cho Modal chỉnh sửa
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);

  const normalizeProduct = (row: unknown): SupplierProduct => {
    const item = (row && typeof row === "object" ? row : {}) as Record<string, unknown>;

    return {
      id: String(item.id ?? ""),
      supplierId: String(item.supplierId ?? ""),
      supplierName: String(item.supplierName ?? ""),
      productId: item.productId ? String(item.productId) : null,
      productNameSnapshot: item.productNameSnapshot ? String(item.productNameSnapshot) : null,
      productUnitSnapshot: item.productUnitSnapshot ? String(item.productUnitSnapshot) : null,
      name: String(item.name ?? ""),
      unit: String(item.unit ?? ""),
      description: String(item.description ?? ""),
      pricePerUnit: Number(item.pricePerUnit ?? 0),
      minOrderQuantity: Number(item.minOrderQuantity ?? 0),
      leadTimeDays: Number(item.leadTimeDays ?? 0),
      isDeleted: Boolean(item.isDeleted),
      createBy: String(item.createBy ?? ""),
      createAt: String(item.createAt ?? ""),
      updateAt: String(item.updateAt ?? ""),
    };
  };

  const fetchProducts = useCallback(async (params: FetchProductParams) => {
    if (!id) return;
    setProductLoading(true);
    try {
      const data = await getAllProductsWithAllStatusesBySupplierId(id, {
        page: params.page,
        size: params.size,
        sortBy: "createAt",
        sortDir: "desc",
      });
      const payload = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
      const rawContent =
        Array.isArray(payload.content)
          ? payload.content
          : Array.isArray((payload.result as Record<string, unknown> | undefined)?.content)
            ? ((payload.result as Record<string, unknown>).content as unknown[])
            : [];

      const normalized = rawContent.map(normalizeProduct);
      setAllProducts(normalized);

      if (params.isActive === null) {
        setProducts(normalized);
      } else {
        setProducts(normalized.filter((item) => !item.isDeleted === params.isActive));
      }
    } catch (error) {
      console.error("Fetch products failed:", error);
      setAllProducts([]);
      setProducts([]);
    } finally {
      setProductLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const fetchSupplierAndProducts = async () => {
      if (!id) return;
      try {
        const supplierData = await getSupplierById(id);
        setSupplier(supplierData);
        await fetchProducts({ page: 0, size: 10, isActive: null });
      } catch (err) {
        console.error("Fetch data failed:", err);
      } finally {
        setLoading(false);
      }
    };

    void fetchSupplierAndProducts();
  }, [id, fetchProducts]);

  const handleFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFilterActive(val);

    if (val === "") {
      setProducts(allProducts);
      return;
    }

    const isActive = val === "true";
    setProducts(allProducts.filter((item) => !item.isDeleted === isActive));
  };

  // Hàm xử lý cập nhật sản phẩm
  const handleUpdateProduct = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!id || !editingProduct) return;

    try {
      if (!editingProduct.id) {
        alert("Supplier product mapping ID is missing, cannot update this product.");
        return;
      }

      const updateData = {
        name: editingProduct.name,
        unit: editingProduct.unit,
        description: editingProduct.description,
        pricePerUnit: Number(editingProduct.pricePerUnit),
        minOrderQuantity: Number(editingProduct.minOrderQuantity),
        leadTimeDays: Number(editingProduct.leadTimeDays),
        isDeleted: editingProduct.isDeleted,
      };

      await updateSupplierProduct(id, editingProduct.id, updateData);

      void fetchProducts({ 
        page: 0, 
        size: 10, 
        isActive: filterActive === "" ? null : filterActive === "true" 
      });
      setIsEditModalOpen(false);
      alert("Update product successfully!");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to update product");
    }
  };

  const handleDeleteProduct = async (item: SupplierProduct) => {
    if (!id) return;

    const productName = item.name || item.productNameSnapshot || "this product";
    const isConfirmed = window.confirm(`Delete ${productName}?`);
    if (!isConfirmed) return;

    try {
      await deleteSupplierProduct(id, item.id);
      alert("Delete product successfully!");
      void fetchProducts({
        page: 0,
        size: 10,
        isActive: filterActive === "" ? null : filterActive === "true",
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete product");
    }
  };

  if (loading)
    return <div className="supplier-detail-state">Loading supplier detail...</div>;
  if (!supplier)
    return <div className="supplier-detail-state supplier-detail-error">Supplier not found</div>;

  const renderStatusClass = (status: string) => {
    if (status === "APPROVED") return "status-approved";
    if (status === "PENDING") return "status-pending";
    if (status === "SUSPENDED") return "status-suspended";
    if (status === "REJECTED") return "status-rejected";
    return "status-default";
  };

  const formatValue = (value: unknown) => {
    if (value === null || value === undefined) return "-";
    const text = String(value).trim();
    return text.length > 0 ? text : "-";
  };

  const formatDateTime = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("vi-VN");
  };

  const supplierInitials = String(supplier.name || "SP")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("") || "SP";

  return (
    <div className="supplier-detail-page">
      {/* Header và Thông tin Supplier */}
      <div className="supplier-detail-header">
        <div className="supplier-detail-header-left">
          <button
            type="button"
            onClick={handleBack}
            className="supplier-back-btn"
            aria-label="Back"
          >
            <span className="supplier-back-icon" aria-hidden="true">&larr;</span>
          </button>
          <div className="supplier-detail-title-wrap">
            <div className="supplier-detail-title-row">
              <h1 className="supplier-detail-title">{supplier.name}</h1>
              <span
                className={`supplier-status-badge ${renderStatusClass(supplier.status)}`}
              >
                {supplier.status}
              </span>
            </div>
            <p className="supplier-detail-subtitle">Supplier ID: {supplier.id}</p>
          </div>
        </div>
        <div className="supplier-detail-header-actions">
          <button
            onClick={() => navigate(`/admin/suppliers/update/${supplier.id}`)}
            className="supplier-btn supplier-btn-primary"
          >
            <Edit size={16} /> Edit Supplier
          </button>
          {/* Fix nhẹ lỗi chính tả adnin -> admin ở đường dẫn History */}
          <button
            onClick={() => navigate(`/admin/suppliers/${id}/audit`)}
            className="supplier-btn supplier-btn-secondary"
          >
            <History size={16} /> View History
          </button>
        </div>
      </div>

      <div className="supplier-info-card">
        <div className="supplier-profile-layout">
          <aside className="supplier-profile-sidebar">
            <div className="supplier-profile-avatar">{supplierInitials}</div>
            <h3 className="supplier-profile-name">{formatValue(supplier.name)}</h3>
            <p className="supplier-profile-role">Supplier Profile</p>
            <p className="supplier-profile-id">ID: {formatValue(supplier.id)}</p>
            <span className={`supplier-status-badge ${renderStatusClass(supplier.status)}`}>
              {formatValue(supplier.status)}
            </span>
          </aside>

          <div className="supplier-profile-main">
            <section className="supplier-profile-section">
              <h4>Contact Information</h4>
              <div className="supplier-profile-row">
                <span>Contact Email</span>
                <strong>{formatValue(supplier.contactEmail)}</strong>
              </div>
              <div className="supplier-profile-row">
                <span>Phone</span>
                <strong>{formatValue(supplier.phone)}</strong>
              </div>
              <div className="supplier-profile-row">
                <span>Address</span>
                <strong>{formatValue(supplier.address)}</strong>
              </div>
              <div className="supplier-profile-row">
                <span>Region</span>
                <strong>{formatValue(supplier.region)}</strong>
              </div>
            </section>

            <section className="supplier-profile-section">
              <h4>Business Information</h4>
              <div className="supplier-profile-row">
                <span>Material Type</span>
                <strong>{formatValue(supplier.materialType)}</strong>
              </div>
              <div className="supplier-profile-row">
                <span>Tax Code</span>
                <strong>{formatValue(supplier.taxCode)}</strong>
              </div>
            </section>

            <section className="supplier-profile-section">
              <h4>Approval & Audit</h4>
              <div className="supplier-profile-row">
                <span>Created At</span>
                <strong>{formatDateTime(supplier.createAt)}</strong>
              </div>
              <div className="supplier-profile-row">
                <span>Updated At</span>
                <strong>{formatDateTime(supplier.updateAt)}</strong>
              </div>
            </section>
          </div>
        </div>
      </div>
      
      {/* Bảng sản phẩm */}
      <div className="supplier-products-card">
        <div className="supplier-products-head">
          <div className="supplier-products-title">
            <Package size={18} />
            <h3>Product Quotations</h3>
          </div>
          <div className="supplier-products-filter">
            <Filter size={16} />
            <select
              value={filterActive}
              onChange={handleFilterChange}
              className="supplier-filter-select"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div className="supplier-products-table-wrap">
          {productLoading ? (
             <div className="supplier-products-loading">Loading products...</div>
          ) : (
            <table className="supplier-products-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>Description</th>
                  <th>Price Per Unit</th>
                  <th>Minimum Required Quantity</th>
                  <th>Unit</th>
                  <th>Lead Time (Days)</th>
                  <th>Created At / Updated At</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="supplier-products-empty">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((item) => (
                    <tr key={item.id}>
                      <td>{formatValue(item.name || item.productNameSnapshot)}</td>
                      <td className="supplier-cell-description">{formatValue(item.description)}</td>
                      <td>
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(Number(item.pricePerUnit))}
                      </td>
                      <td>{item.minOrderQuantity}</td>
                      <td>{formatValue(item.unit || item.productUnitSnapshot)}</td>
                      <td>{item.leadTimeDays} days</td>
                      <td>
                        <div className="supplier-audit-times">
                          <span>C: {formatDateTime(item.createAt)}</span>
                          <span>U: {formatDateTime(item.updateAt)}</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`supplier-product-status ${item.isDeleted ? "inactive" : "active"}`}
                        >
                          {item.isDeleted ? "Deleted" : "Active"}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="supplier-product-actions">
                          <button
                            disabled={!item.id}
                            onClick={() => {
                              setEditingProduct(item);
                              setIsEditModalOpen(true);
                            }}
                            className="supplier-edit-icon-btn"
                            title="Update product"
                            aria-label="Update product"
                          >
                            <span className="supplier-action-glyph" aria-hidden="true">✎</span>
                          </button>
                          <button
                            disabled={!item.id}
                            onClick={() => {
                              void handleDeleteProduct(item);
                            }}
                            className="supplier-edit-icon-btn supplier-delete-icon-btn"
                            title="Delete product"
                            aria-label="Delete product"
                          >
                            <span className="supplier-action-glyph" aria-hidden="true">🗑</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL CẬP NHẬT GIÁ */}
      {isEditModalOpen && editingProduct && (
        <div className="supplier-modal-overlay">
          <div className="supplier-modal">
            <h3>Update Product Mapping</h3>
            <form onSubmit={handleUpdateProduct} className="supplier-modal-form">
              <div className="supplier-form-group">
                <label>Name</label>
                <input
                  type="text"
                  className="supplier-input"
                  value={editingProduct.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditingProduct({
                      ...editingProduct,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="supplier-form-group">
                <label>Unit</label>
                <input
                  type="text"
                  className="supplier-input"
                  value={editingProduct.unit}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditingProduct({
                      ...editingProduct,
                      unit: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="supplier-form-group">
                <label>Description</label>
                <input
                  type="text"
                  className="supplier-input"
                  value={editingProduct.description}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditingProduct({
                      ...editingProduct,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="supplier-form-group">
                <label>Price Per Unit (VND)</label>
                <input
                  type="number"
                  className="supplier-input"
                  value={editingProduct.pricePerUnit}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditingProduct({
                      ...editingProduct,
                      pricePerUnit: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>
              <div className="supplier-form-group">
                <label>Min Order Quantity</label>
                <input
                  type="number"
                  className="supplier-input"
                  value={editingProduct.minOrderQuantity}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditingProduct({
                      ...editingProduct,
                      minOrderQuantity: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <div className="supplier-form-group">
                <label>Lead Time (Days)</label>
                <input
                  type="number"
                  className="supplier-input"
                  value={editingProduct.leadTimeDays}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditingProduct({
                      ...editingProduct,
                      leadTimeDays: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <div className="supplier-checkbox-row">
                <input
                  type="checkbox"
                  id="isDeleted"
                  checked={editingProduct.isDeleted}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setEditingProduct({
                      ...editingProduct,
                      isDeleted: e.target.checked,
                    })
                  }
                />
                <label htmlFor="isDeleted">Mark as deleted</label>
              </div>
              <div className="supplier-modal-actions">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="supplier-btn supplier-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="supplier-btn supplier-btn-primary"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}