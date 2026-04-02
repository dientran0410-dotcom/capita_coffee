import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { deleteSupplierProduct, getProductsBySupplierId, updateSupplierProduct } from "../../services/supplierService";
import { useAuth } from "../../context/AuthContext";
import "./ProductManagement.css";

const PAGE_SIZE = 5;

interface ProductFilterState {
  keyword: string;
  sort: string;
}

interface ProductItem {
  id: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productNameSnapshot: string;
  productUnitSnapshot: string;
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

interface ProductPageResult {
  content: ProductItem[];
  totalPages: number;
  number: number;
}

const DEFAULT_FILTERS: ProductFilterState = {
  keyword: "",
  sort: "updateAt,desc",
};

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeProduct = (row: unknown): ProductItem => {
  const item = (row && typeof row === "object" ? row : {}) as Record<string, unknown>;

  return {
    id: String(item.id ?? item.productId ?? ""),
    supplierId: String(item.supplierId ?? ""),
    supplierName: String(item.supplierName ?? ""),
    productId: String(item.productId ?? ""),
    productNameSnapshot: String(item.productNameSnapshot ?? ""),
    productUnitSnapshot: String(item.productUnitSnapshot ?? ""),
    name: String(item.name ?? item.productNameSnapshot ?? ""),
    unit: String(item.unit ?? item.productUnitSnapshot ?? ""),
    description: String(item.description ?? ""),
    pricePerUnit: toNumber(item.pricePerUnit),
    minOrderQuantity: toNumber(item.minOrderQuantity),
    leadTimeDays: toNumber(item.leadTimeDays),
    isDeleted: Boolean(item.isDeleted),
    createBy: String(item.createBy ?? ""),
    createAt: String(item.createAt ?? ""),
    updateAt: String(item.updateAt ?? ""),
  };
};

const parseProductPage = (payload: unknown): ProductPageResult => {
  if (!payload || typeof payload !== "object") {
    return { content: [], totalPages: 0, number: 0 };
  }

  const level1 = payload as Record<string, unknown>;
  const source =
    (level1.result && typeof level1.result === "object" ? level1.result : null) ||
    (level1.data && typeof level1.data === "object" ? level1.data : null) ||
    level1;

  const page = source as Record<string, unknown>;
  const rawContent = Array.isArray(page.content) ? page.content : [];

  return {
    content: rawContent.map(normalizeProduct),
    totalPages: toNumber(page.totalPages),
    number: toNumber(page.number),
  };
};

const formatDateTime = (value: string): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
};

export default function ProductManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const { supplierId: supplierIdParam } = useParams<{ supplierId: string }>();
  const { currentUser } = useAuth();

  const supplierId = supplierIdParam || currentUser?.supplierId || currentUser?.id;

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [page, setPage] = useState(0);

  const [filters, setFilters] = useState<ProductFilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<ProductFilterState>(DEFAULT_FILTERS);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editUnit, setEditUnit] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPricePerUnit, setEditPricePerUnit] = useState("0");
  const [editMinOrderQuantity, setEditMinOrderQuantity] = useState("1");
  const [editLeadTimeDays, setEditLeadTimeDays] = useState("1");
  const [editIsDeleted, setEditIsDeleted] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const formatPrice = (value: number | string | null | undefined) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(value) || 0);

  const filteredProducts = useMemo(() => {
    const keyword = appliedFilters.keyword.trim().toLowerCase();
    if (!keyword) return products;

    return products.filter((item) => {
      const productName = String(item.name || item.productNameSnapshot || "").toLowerCase();
      return productName.includes(keyword);
    });
  }, [products, appliedFilters.keyword]);

  const totalPages = useMemo(() => {
    if (filteredProducts.length === 0) return 0;
    return Math.ceil(filteredProducts.length / PAGE_SIZE);
  }, [filteredProducts]);

  const paginatedProducts = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, page]);

  const loadProducts = useCallback(
    async (selectedFilters: ProductFilterState = DEFAULT_FILTERS) => {
      if (!supplierId) {
        setErrorMessage("Missing supplierId. Please open this page with /supplier/products/:supplierId");
        setProducts([]);
        setPage(0);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const [sortBy = "updateAt", sortDirRaw = "desc"] = selectedFilters.sort.split(",");
        const sortDir = String(sortDirRaw).toLowerCase() === "asc" ? "asc" : "desc";

        const result = await getProductsBySupplierId(supplierId, {
          page: 0,
          size: 1000,
        });

        const parsedPage = parseProductPage(result);
        const sorted = [...parsedPage.content].sort((left, right) => {
          const leftValue = (() => {
            switch (sortBy) {
              case "name":
                return left.name.toLowerCase();
              case "pricePerUnit":
                return left.pricePerUnit;
              case "minOrderQuantity":
                return left.minOrderQuantity;
              case "leadTimeDays":
                return left.leadTimeDays;
              case "createAt":
                return new Date(left.createAt).getTime() || 0;
              default:
                return new Date(left.updateAt).getTime() || 0;
            }
          })();

          const rightValue = (() => {
            switch (sortBy) {
              case "name":
                return right.name.toLowerCase();
              case "pricePerUnit":
                return right.pricePerUnit;
              case "minOrderQuantity":
                return right.minOrderQuantity;
              case "leadTimeDays":
                return right.leadTimeDays;
              case "createAt":
                return new Date(right.createAt).getTime() || 0;
              default:
                return new Date(right.updateAt).getTime() || 0;
            }
          })();

          if (leftValue < rightValue) return sortDir === "asc" ? -1 : 1;
          if (leftValue > rightValue) return sortDir === "asc" ? 1 : -1;
          return 0;
        });

        setProducts(sorted);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to fetch supplier products."
        );
        setProducts([]);
        setPage(0);
      } finally {
        setLoading(false);
      }
    },
    [supplierId]
  );

  useEffect(() => {
    void loadProducts(DEFAULT_FILTERS);
  }, [loadProducts]);

  useEffect(() => {
    if (totalPages > 0 && page >= totalPages) {
      setPage(totalPages - 1);
      return;
    }

    if (totalPages === 0 && page !== 0) {
      setPage(0);
    }
  }, [page, totalPages]);

  const handleSearch = () => {
    const nextFilters = { ...filters };
    setAppliedFilters(nextFilters);
    setPage(0);
    void loadProducts(nextFilters);
  };

  const handlePageChange = (nextPage: number) => {
    if (nextPage < 0 || nextPage >= totalPages || loading) {
      return;
    }

    setPage(nextPage);
  };

  const handleToggleStatus = async (product: ProductItem) => {
    if (!supplierId) return;

    if (product.isDeleted) {
      return;
    }

    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await deleteSupplierProduct(supplierId, product.id);

      await loadProducts(appliedFilters);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Delete product failed.");
    }
  };

  const openEditModal = (product: ProductItem) => {
    setEditingProduct(product);
    setEditName(String(product.name ?? ""));
    setEditUnit(String(product.unit ?? ""));
    setEditDescription(String(product.description ?? ""));
    setEditPricePerUnit(String(product.pricePerUnit ?? 0));
    setEditMinOrderQuantity(String(product.minOrderQuantity ?? 1));
    setEditLeadTimeDays(String(product.leadTimeDays ?? 1));
    setEditIsDeleted(Boolean(product.isDeleted));
  };

  const closeEditModal = () => {
    setEditingProduct(null);
    setSavingEdit(false);
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supplierId || !editingProduct) {
      return;
    }

    const nextPricePerUnit = Number(editPricePerUnit);
    const nextMinOrderQuantity = Number(editMinOrderQuantity);
    const nextLeadTimeDays = Number(editLeadTimeDays);

    if (!editName.trim()) {
      setErrorMessage("Product name is required.");
      return;
    }

    if (!editUnit.trim()) {
      setErrorMessage("Unit is required.");
      return;
    }

    if (!Number.isFinite(nextPricePerUnit) || nextPricePerUnit < 0) {
      setErrorMessage("Price per unit must be a valid number and >= 0.");
      return;
    }

    if (!Number.isFinite(nextMinOrderQuantity) || nextMinOrderQuantity < 1) {
      setErrorMessage("Min order quantity must be >= 1.");
      return;
    }

    if (!Number.isFinite(nextLeadTimeDays) || nextLeadTimeDays < 1) {
      setErrorMessage("Lead time days must be >= 1.");
      return;
    }

    try {
      setSavingEdit(true);
      setErrorMessage("");

      await updateSupplierProduct(supplierId, editingProduct.id, {
        name: editName.trim(),
        unit: editUnit.trim(),
        description: editDescription.trim(),
        pricePerUnit: nextPricePerUnit,
        minOrderQuantity: nextMinOrderQuantity,
        leadTimeDays: nextLeadTimeDays,
        isDeleted: editIsDeleted,
      });

      closeEditModal();
      await loadProducts(appliedFilters);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Update product failed.");
      setSavingEdit(false);
    }
  };

  const handleEditNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEditName(event.target.value);
  };

  const handleEditUnitChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEditUnit(event.target.value);
  };

  const handleEditDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setEditDescription(event.target.value);
  };

  const handleEditPriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEditPricePerUnit(event.target.value);
  };

  const handleEditMinOrderChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEditMinOrderQuantity(event.target.value);
  };

  const handleEditLeadTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setEditLeadTimeDays(event.target.value);
  };

  const handleAddProduct = () => {
    if (!supplierId) {
      setErrorMessage("Missing supplierId. Please open this page with /supplier/:supplierId/products");
      return;
    }

    const createPath = location.pathname.startsWith("/admin/")
      ? `/admin/suppliers/${supplierId}/products/create`
      : `/supplier/${supplierId}/products/create`;

    navigate(createPath);
  };

  return (
    <div className="spm-layout">
      <section className="spm-main">
        <main className="spm-content">
          <div className="spm-title-row">
            <h1 className="spm-title">Product Management</h1>
            <button type="button" className="spm-add-btn" onClick={handleAddProduct}>
              <Plus size={15} />
              Add Product
            </button>
          </div>

          {errorMessage ? <div className="spm-error">{errorMessage}</div> : null}

          <section className="spm-search-card">
            <input
              type="text"
              value={filters.keyword}
              onChange={(event) => setFilters({ ...filters, keyword: event.target.value })}
              placeholder="Search by product name..."
            />
            <button type="button" onClick={handleSearch}>Search</button>
          </section>

          <section className="spm-table-card">
            <div className="spm-table-wrap">
              <table>
                <thead>
                  <tr>
                    {/* <th>ProductId</th> */}
                    <th>Name</th>
                    <th>Unit</th>
                    <th>Price/Unit</th>
                    <th>Min Qty</th>
                    <th>Lead Days</th>
                    <th>Status</th>
                    <th>Updated At</th>
                    <th className="actions">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="empty">Loading...</td>
                    </tr>
                  ) : paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="empty">No products found</td>
                    </tr>
                  ) : (
                    paginatedProducts.map((item) => (
                      <tr key={item.id ?? item.productId}>
                        {/* <td>{item.productId}</td> */}
                        <td>{item.name || item.productNameSnapshot || "-"}</td>
                        <td>{item.unit || item.productUnitSnapshot || "-"}</td>
                        <td>{formatPrice(item.pricePerUnit)}</td>
                        <td>{item.minOrderQuantity}</td>
                        <td>{item.leadTimeDays}</td>
                        <td>
                          <span className={`spm-status ${item.isDeleted ? "inactive" : "active"}`}>
                            {item.isDeleted ? "Deleted" : "Active"}
                          </span>
                        </td>
                        <td>{formatDateTime(item.updateAt)}</td>
                        <td className="actions">
                          <div className="spm-actions-inline">
                            <button
                              type="button"
                              className="spm-action-btn edit"
                              onClick={() => openEditModal(item)}
                              disabled={loading || savingEdit}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className={`spm-action-btn ${item.isDeleted ? "safe" : "danger"}`}
                              onClick={() => {
                                void handleToggleStatus(item);
                              }}
                              disabled={loading || savingEdit || item.isDeleted}
                              title={item.isDeleted ? "This product is already deleted" : "Delete this product"}
                            >
                              {item.isDeleted ? "Deleted" : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="spm-pagination">
              <button
                type="button"
                disabled={page === 0 || loading}
                onClick={() => handlePageChange(page - 1)}
              >
                Previous
              </button>

              <span>Page {totalPages === 0 ? 0 : page + 1} / {totalPages}</span>

              <button
                type="button"
                disabled={loading || totalPages === 0 || page + 1 >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Next
              </button>
            </div>
          </section>

          {editingProduct ? (
            <div className="spm-modal-overlay" role="dialog" aria-modal="true">
              <div className="spm-modal-card">
                <div className="spm-modal-head">
                  <h3>Edit Product</h3>
                </div>

                <form className="spm-modal-form" onSubmit={handleEditSubmit}>
                  <label className="spm-modal-field spm-modal-field-full">
                    <span>Name</span>
                    <input
                      type="text"
                      value={editName}
                      onChange={handleEditNameChange}
                      required
                    />
                  </label>

                  <label className="spm-modal-field">
                    <span>Unit</span>
                    <input
                      type="text"
                      value={editUnit}
                      onChange={handleEditUnitChange}
                      required
                    />
                  </label>

                  <label className="spm-modal-field spm-modal-field-full">
                    <span>Description</span>
                    <textarea
                      value={editDescription}
                      onChange={handleEditDescriptionChange}
                      rows={3}
                    />
                  </label>

                  <label className="spm-modal-field">
                    <span>Price/Unit</span>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={editPricePerUnit}
                      onChange={handleEditPriceChange}
                      required
                    />
                  </label>

                  <label className="spm-modal-field">
                    <span>Min Order Quantity</span>
                    <input
                      type="number"
                      min={1}
                      step="1"
                      value={editMinOrderQuantity}
                      onChange={handleEditMinOrderChange}
                      required
                    />
                  </label>

                  <label className="spm-modal-field spm-modal-field-full">
                    <span>Lead Time Days</span>
                    <input
                      type="number"
                      min={1}
                      step="1"
                      value={editLeadTimeDays}
                      onChange={handleEditLeadTimeChange}
                      required
                    />
                  </label>

                  <div className="spm-modal-actions">
                    <button
                      type="button"
                      className="spm-modal-btn ghost"
                      onClick={closeEditModal}
                      disabled={savingEdit}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="spm-modal-btn primary" disabled={savingEdit}>
                      {savingEdit ? "Saving..." : "Save"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}
        </main>
      </section>
    </div>
  );
}
