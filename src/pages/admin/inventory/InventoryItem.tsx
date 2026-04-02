import { useEffect, useMemo, useRef, useState } from "react";
import InventoryTabs from "../../../components/inventory/InventoryTabs";
import type { InventoryItem as InventoryItemType, UnitOption } from "../../../types/inventory";
import {
  addInventoryStock,
  createInventoryItem,
  deductInventoryStock,
  getInventoryItems,
  setInventoryReorderThreshold,
  updateInventoryItem,
} from "../../../services/inventoryService";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import "@/assets/css/inventoryPage.css";

const UNIT_OPTIONS: UnitOption[] = ["GRAM", "KILOGRAM", "MILLILITER", "LITER", "PIECE"];
const STATUS_OPTIONS = ["ACTIVE", "INACTIVE"] as const;

const InventoryItem = () => {
  const [data, setData] = useState<InventoryItemType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [editingItem, setEditingItem] = useState<InventoryItemType | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSetThresholdModal, setShowSetThresholdModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showDeductModal, setShowDeductModal] = useState(false);

  const [isClosing, setIsClosing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const showSuccessModal = false;
  const successMessage = "";
  const closeSuccess = () => undefined;

  const [editForm, setEditForm] = useState({
    name: "",
    unit: "GRAM" as UnitOption,
    reorderThreshold: "",
    description: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  const [thresholdValue, setThresholdValue] = useState("");

  const [addStockForm, setAddStockForm] = useState({
    quantityToAdd: "",
    reason: "",
    performedBy: "",
  });

  const [deductForm, setDeductForm] = useState({
    quantityToDeduct: "",
    reason: "",
    performedBy: "",
  });

  const ANIMATION_DURATION = 280;
  const pageMountedRef = useRef(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getInventoryItems();
      setData(res?.data || []);
    } catch (err) {
      console.error("Fetch inventory item error:", err);
    } finally {
      if (pageMountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    pageMountedRef.current = true;
    fetchData();
    return () => {
      pageMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (errorMessage) {
      showErrorToast(errorMessage);
    }
  }, [errorMessage]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "ALL" || item.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [data, searchTerm, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const triggerClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowEditModal(false);
      setShowSetThresholdModal(false);
      setShowAddStockModal(false);
      setShowDeductModal(false);
      setEditingItem(null);
      setErrorMessage("");
      setIsClosing(false);
    }, ANIMATION_DURATION);
  };

  const openSuccess = (message: string) => {
    showSuccessToast(message);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setEditForm({ name: "", unit: "GRAM", reorderThreshold: "0", description: "", status: "ACTIVE" });
    setErrorMessage("");
    setShowEditModal(true);
  };

  const handleEdit = (item: InventoryItemType) => {
    setEditingItem(item);
    setEditForm({
      name: item.name,
      unit: item.unit,
      reorderThreshold: String(item.reorderThreshold ?? 0),
      description: item.description || "",
      status: item.status,
    });
    setErrorMessage("");
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const threshold = Number(editForm.reorderThreshold);
    if (!editForm.name.trim()) return setErrorMessage("Name is required.");
    if (Number.isNaN(threshold) || threshold < 0) {
      return setErrorMessage("Reorder threshold must be >= 0.");
    }

    if (editingItem) {
      await updateInventoryItem(editingItem.id, {
        name: editForm.name.trim(),
        unit: editForm.unit,
        reorderThreshold: threshold,
        description: editForm.description.trim(),
        status: editForm.status,
      });
      openSuccess("Ingredient updated successfully.");
    } else {
      await createInventoryItem({
        name: editForm.name.trim(),
        unit: editForm.unit,
        reorderThreshold: threshold,
        description: editForm.description.trim(),
        status: editForm.status,
        currentQuantity: 0,
      });
      openSuccess("Ingredient created successfully.");
    }

    await fetchData();
    triggerClose();
  };

  const handleOpenSetThreshold = (item: InventoryItemType) => {
    setEditingItem(item);
    setThresholdValue(String(item.reorderThreshold ?? 0));
    setErrorMessage("");
    setShowSetThresholdModal(true);
  };

  const handleSaveThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const threshold = Number(thresholdValue);
    if (Number.isNaN(threshold) || threshold < 0) {
      return setErrorMessage("Threshold must be >= 0.");
    }

    await setInventoryReorderThreshold(editingItem.id, threshold);
    openSuccess("Reorder threshold updated.");
    await fetchData();
    triggerClose();
  };

  const handleOpenAddStock = (item: InventoryItemType) => {
    setEditingItem(item);
    setAddStockForm({ quantityToAdd: "", reason: "", performedBy: "" });
    setErrorMessage("");
    setShowAddStockModal(true);
  };

  const handleSaveAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(""); 

    if (!editingItem) return;
    const qty = Number(addStockForm.quantityToAdd);
    if (Number.isNaN(qty) || qty <= 0) {
      return setErrorMessage("Quantity to add must be > 0.");
    }

    try {
      await addInventoryStock({
        ingredientId: editingItem.id,
        ingredientName: editingItem.name, 
        quantityToAdd: qty,
        unit: editingItem.unit, 
        reason: addStockForm.reason.trim() || undefined,
        performedBy: addStockForm.performedBy.trim() || undefined,
      });

      openSuccess("Stock added successfully.");
      await fetchData(); 
      triggerClose(); 

    } catch (error: any) {
      console.error("Add stock failed:", error);
      
      const backendMessage = error.response?.data?.metadata?.message || error.response?.data?.message;
      setErrorMessage(backendMessage || "Failed to add stock. Please check again.");
    }
  };

  const handleOpenDeduct = (item: InventoryItemType) => {
    setEditingItem(item);
    setDeductForm({ quantityToDeduct: "", reason: "", performedBy: "" });
    setErrorMessage("");
    setShowDeductModal(true);
  };

  const handleSaveDeduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const qty = Number(deductForm.quantityToDeduct);
    if (Number.isNaN(qty) || qty <= 0) {
      return setErrorMessage("Quantity to deduct must be > 0.");
    }
    if (qty > Number(editingItem.currentQuantity || 0)) {
      return setErrorMessage("Quantity to deduct cannot exceed current quantity.");
    }

    await deductInventoryStock(editingItem.id, {
      quantityToDeduct: qty,
      reason: deductForm.reason.trim() || undefined,
      performedBy: deductForm.performedBy.trim() || undefined,
    });

    openSuccess("Stock deducted successfully.");
    await fetchData();
    triggerClose();
  };



  const formatDateTime = (dateValue?: string) => {
    if (!dateValue) return { date: "N/A", time: "" };
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return { date: "N/A", time: "" };
    return {
      date: parsed.toLocaleDateString("vi-VN"),
      time: parsed.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
  };

  const actionTypeClass = (status: string) => (status === "ACTIVE" ? "active" : "inactive");

  return (
    <div className="inventory-page">
      <div className="inv-header">
        <div className="page-heading">
          <h1>Ingredient Management</h1>
          <p className="page-subtitle">Manage ingredients, stock movements, and threshold controls</p>
        </div>
        <div className="header-actions">
          <button className="btn-pri" onClick={handleOpenAdd}>+ Add Ingredient</button>
        </div>
      </div>

      <InventoryTabs active="list" />

      <div className="controls">
        <input
          type="text"
          placeholder="Search ingredient..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="ALL">ALL</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style={{ width: "50px" }}>#</th>
              <th style={{ width: "170px" }}>Name</th>
              <th>Description</th>
              <th style={{ width: "90px" }}>Unit</th>
              <th style={{ width: "110px" }} className="qty-col">Current Qty</th>
              <th style={{ width: "130px" }} className="qty-col">Reorder Threshold</th>
              <th style={{ width: "120px", textAlign: "center" }} className="status-col">Status</th>
              <th style={{ width: "140px" }}>Created Date</th>
              <th style={{ width: "130px", textAlign: "center" }}>Tools</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9}>Loading...</td></tr>
            ) : currentItems.length === 0 ? (
              <tr><td colSpan={9}>No ingredients found.</td></tr>
            ) : (
              currentItems.map((item, index) => {
                const created = formatDateTime(item.createdDate);

                return (
                  <tr key={item.id}>
                    <td>{indexOfFirstItem + index + 1}</td>
                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                    <td title={item.description || "N/A"}>{item.description || "N/A"}</td>
                    <td>{item.unit}</td>
                    <td className="qty-col-cell">{item.currentQuantity}</td>
                    <td className="qty-col-cell">{item.reorderThreshold}</td>
                    <td className="status-col-cell">
                      <span className={`status-badge status-badge-${actionTypeClass(item.status)}`}>
                        {item.status === "ACTIVE" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="date-time-cell">
                        <span className="date-main">{created.date}</span>
                        {created.time && <span className="time-sub">{created.time}</span>}
                      </div>
                    </td>
                    <td>
                      <div className="tool-grid">
                        <button type="button" className="tool-button tool-edit" onClick={() => handleEdit(item)}>
                          ✎<span className="tool-tooltip">Edit</span>
                        </button>
                        <button
                          type="button"
                          className="tool-button tool-threshold"
                          onClick={() => handleOpenSetThreshold(item)}
                          title="Threshold"
                        >
                          T<span className="tool-tooltip">Threshold</span>
                        </button>
                        <button
                          type="button"
                          className="tool-button tool-add-stock"
                          onClick={() => handleOpenAddStock(item)}
                          title="Add Stock"
                        >
                          +<span className="tool-tooltip">Add Stock</span>
                        </button>
                        <button
                          type="button"
                          className="tool-button tool-deduct"
                          onClick={() => handleOpenDeduct(item)}
                          title="Deduct"
                        >
                          −<span className="tool-tooltip">Deduct</span>
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-wrapper">
          <div className="pagination-info">
            Page {currentPage} of {totalPages} | Total Records: {filteredData.length}
          </div>
          <div className="pagination-controls">
            <button
              className="btn-pagination"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            <div className="page-numbers">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    className={`page-btn ${currentPage === pageNum ? "active" : ""}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              className="btn-pagination"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {(showEditModal || showSetThresholdModal || showAddStockModal || showDeductModal) && (
        <>
          <div className={`edit-ingredient-overlay ${isClosing ? "closing" : ""}`} onClick={triggerClose} />

          {showEditModal && (
            <div className={`edit-ingredient-modal ${isClosing ? "closing" : ""}`}>
              <h2 className="edit-ingredient-title">
                {editingItem ? "Ingredient Detail" : "Create Ingredient"}
              </h2>
              <form className="edit-ingredient-form" onSubmit={handleSaveEdit}>
                {editingItem && (
                  <div className="edit-form-row">
                    <label className="edit-label">ID</label>
                    <input type="text" value={editingItem.id} disabled className="edit-input read-only" />
                  </div>
                )}
                <div className="edit-form-row">
                  <label className="edit-label">Name <span className="required-asterisk">*</span></label>
                  <input
                    name="name"
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    className="edit-input"
                    required
                  />
                </div>
                <div className="edit-form-row">
                  <label className="edit-label">Unit <span className="required-asterisk">*</span></label>
                  <select
                    name="unit"
                    value={editForm.unit}
                    onChange={(e) => setEditForm((p) => ({ ...p, unit: e.target.value as UnitOption }))}
                    className="edit-select"
                    required
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div className="edit-form-row">
                  <label className="edit-label">Reorder Threshold <span className="required-asterisk">*</span></label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.reorderThreshold}
                    onChange={(e) => setEditForm((p) => ({ ...p, reorderThreshold: e.target.value }))}
                    className="edit-input"
                    required
                  />
                </div>
                {editingItem && (
                  <div className="edit-form-row">
                    <label className="edit-label">Current Quantity</label>
                    <input
                      type="text"
                      value={editingItem.currentQuantity}
                      disabled
                      className="edit-input read-only"
                    />
                  </div>
                )}
                <div className="edit-form-row">
                  <label className="edit-label">Status <span className="required-asterisk">*</span></label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, status: e.target.value as "ACTIVE" | "INACTIVE" }))
                    }
                    className="edit-select"
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="edit-form-row">
                  <label className="edit-label">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                    className="edit-textarea"
                    rows={3}
                  />
                </div>
                {errorMessage && <div className="edit-error">{errorMessage}</div>}
                <div className="edit-actions">
                  <button type="button" className="btn btn-secondary edit-btn" onClick={triggerClose}>Close</button>
                  <button type="submit" className="btn btn-primary edit-btn">
                    {editingItem ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {showSetThresholdModal && editingItem && (
            <div className={`edit-ingredient-modal ${isClosing ? "closing" : ""}`}>
              <h2 className="edit-ingredient-title">Set Reorder Threshold</h2>
              <form className="edit-ingredient-form" onSubmit={handleSaveThreshold}>
                <div className="edit-form-row">
                  <label className="edit-label">Ingredient</label>
                  <input type="text" value={editingItem.name} className="edit-input read-only" disabled />
                </div>
                <div className="edit-form-row">
                  <label className="edit-label">Threshold <span className="required-asterisk">*</span></label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={thresholdValue}
                    onChange={(e) => setThresholdValue(e.target.value)}
                    className="edit-input"
                    required
                  />
                </div>
                {errorMessage && <div className="edit-error">{errorMessage}</div>}
                <div className="edit-actions">
                  <button type="button" className="btn btn-secondary edit-btn" onClick={triggerClose}>Close</button>
                  <button type="submit" className="btn btn-primary edit-btn">Save</button>
                </div>
              </form>
            </div>
          )}

          {showAddStockModal && editingItem && (
            <div className={`edit-ingredient-modal ${isClosing ? "closing" : ""}`}>
              <h2 className="edit-ingredient-title">Add Ingredient Stock</h2>
              <form className="edit-ingredient-form" onSubmit={handleSaveAddStock}>
                <div className="edit-form-row">
                  <label className="edit-label">Ingredient</label>
                  <input type="text" value={editingItem.name} className="edit-input read-only" readOnly />
                </div>
                <div className="edit-form-row">
                  <label className="edit-label">Quantity to Add <span className="required-asterisk">*</span></label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={addStockForm.quantityToAdd}
                    onChange={(e) => setAddStockForm((p) => ({ ...p, quantityToAdd: e.target.value }))}
                    className="edit-input"
                    required
                  />
                </div>
                <div className="edit-form-row">
                  <label className="edit-label">Reason</label>
                  <input
                    value={addStockForm.reason}
                    onChange={(e) => setAddStockForm((p) => ({ ...p, reason: e.target.value }))}
                    className="edit-input"
                    placeholder="Optional"
                  />
                </div>
                <div className="edit-form-row">
                  <label className="edit-label">Performed By</label>
                  <input
                    value={addStockForm.performedBy}
                    onChange={(e) => setAddStockForm((p) => ({ ...p, performedBy: e.target.value }))}
                    className="edit-input"
                    placeholder="Optional"
                  />
                </div>
                {errorMessage && <div className="edit-error">{errorMessage}</div>}
                <div className="edit-actions">
                  <button type="button" className="btn btn-secondary edit-btn" onClick={triggerClose}>Close</button>
                  <button type="submit" className="btn btn-primary edit-btn">Add Stock</button>
                </div>
              </form>
            </div>
          )}

          {showDeductModal && editingItem && (
            <div className={`edit-ingredient-modal ${isClosing ? "closing" : ""}`}>
              <h2 className="edit-ingredient-title">Deduct Ingredient</h2>
              <form className="edit-ingredient-form" onSubmit={handleSaveDeduct}>
                <div className="edit-form-row">
                  <label className="edit-label">Ingredient</label>
                  <input type="text" value={editingItem.name} className="edit-input read-only" readOnly />
                </div>
                <div className="edit-form-row">
                  <label className="edit-label">Current Quantity</label>
                  <input type="text" value={editingItem.currentQuantity} className="edit-input read-only" readOnly />
                </div>
                <div className="edit-form-row">
                  <label className="edit-label">Quantity to Deduct <span className="required-asterisk">*</span></label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={deductForm.quantityToDeduct}
                    onChange={(e) => setDeductForm((p) => ({ ...p, quantityToDeduct: e.target.value }))}
                    className="edit-input"
                    required
                  />
                </div>
                <div className="edit-form-row">
                  <label className="edit-label">Reason</label>
                  <textarea
                    rows={2}
                    value={deductForm.reason}
                    onChange={(e) => setDeductForm((p) => ({ ...p, reason: e.target.value }))}
                    className="edit-textarea"
                    placeholder="Optional"
                  />
                </div>
                <div className="edit-form-row">
                  <label className="edit-label">Performed By</label>
                  <input
                    value={deductForm.performedBy}
                    onChange={(e) => setDeductForm((p) => ({ ...p, performedBy: e.target.value }))}
                    className="edit-input"
                    placeholder="Optional"
                  />
                </div>
                {errorMessage && <div className="edit-error">{errorMessage}</div>}
                <div className="edit-actions">
                  <button type="button" className="btn btn-secondary edit-btn" onClick={triggerClose}>Close</button>
                  <button type="submit" className="btn btn-primary edit-btn">Confirm Deduct</button>
                </div>
              </form>
            </div>
          )}
        </>
      )}

      {showSuccessModal && (
        <>
          <div className="edit-ingredient-overlay" onClick={closeSuccess} />
          <div className="edit-success-modal">
            <h3>Thành công</h3>
            <p>{successMessage}</p>
            <button className="btn btn-primary edit-btn" onClick={closeSuccess}>Đóng</button>
          </div>
        </>
      )}
    </div>
  );
};

export default InventoryItem;
