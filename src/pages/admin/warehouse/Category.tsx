import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  getCategories,
  deleteCategory,
  createCategory,
  updateCategory,
  getItemsByWarehouse,
} from "@/services/warehouseService";
import "@/assets/css/warehouseCategory.css";

type CategoryStatus = "ACTIVE" | "INACTIVE";

type WarehouseCategory = {
  id: number;
  name: string;
  description?: string | null;
  displayOrder?: number;
  status?: string;
  warehouseId?: number;
  createdAt?: string;
  updatedAt?: string;
};

type CategoryFormState = {
  name: string;
  description: string;
  displayOrder: number;
  status: CategoryStatus;
};

const INITIAL_FORM_DATA: CategoryFormState = {
  name: "",
  description: "",
  displayOrder: 0,
  status: "ACTIVE",
};

const extractList = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: T[] }).data;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    (payload as { data?: unknown }).data &&
    typeof (payload as { data?: unknown }).data === "object" &&
    Array.isArray(
      ((payload as { data?: { data?: unknown } }).data as { data?: unknown })
        ?.data,
    )
  ) {
    return ((payload as { data: { data: T[] } }).data.data || []) as T[];
  }

  return [];
};

const normalizeCategoryStatus = (value: unknown): CategoryStatus =>
  String(value || "").trim().toUpperCase() === "INACTIVE" ? "INACTIVE" : "ACTIVE";

const Category = () => {
  const [categories, setCategories] = useState<WarehouseCategory[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCat, setEditCat] = useState<WarehouseCategory | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CategoryFormState>(INITIAL_FORM_DATA);

  const navigate = useNavigate();
  const location = useLocation();
  const warehouseId = new URLSearchParams(location.search).get("warehouseId");

  useEffect(() => {
    if (warehouseId) {
      void loadData();
    }
  }, [warehouseId]);

  const loadData = async () => {
    try {
      const [resCats, resItems] = await Promise.all([
        getCategories(Number(warehouseId)),
        getItemsByWarehouse(Number(warehouseId)),
      ]);

      const categoryArray = extractList<WarehouseCategory>(resCats);
      const itemArray = extractList<any>(resItems);

      setCategories(Array.isArray(categoryArray) ? categoryArray : []);
      setItems(Array.isArray(itemArray) ? itemArray : []);
    } catch (error) {
      console.error("Load category data failed:", error);
    }
  };

  const handleOpenCreate = () => {
    setEditCat(null);
    setFormData(INITIAL_FORM_DATA);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: WarehouseCategory) => {
    setEditCat(category);
    setFormData({
      name: category.name || "",
      description: category.description || "",
      displayOrder: Number(category.displayOrder) || 0,
      status: normalizeCategoryStatus(category.status),
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditCat(null);
    setFormData(INITIAL_FORM_DATA);
  };

  const handleSave = async () => {
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      alert("Category name is required.");
      return;
    }

    setIsSaving(true);
    try {
      if (editCat) {
        const updatePayload = {
          name: trimmedName,
          description: formData.description.trim(),
          displayOrder: Number(formData.displayOrder) || 0,
          status: formData.status,
        };
        await updateCategory(editCat.id, updatePayload);
      } else {
        const createPayload = {
          name: trimmedName,
          description: formData.description.trim(),
          displayOrder: Number(formData.displayOrder) || 0,
          warehouseId: Number(warehouseId),
        };
        await createCategory(createPayload);
      }

      setIsModalOpen(false);
      setEditCat(null);
      setFormData(INITIAL_FORM_DATA);
      await loadData();
    } catch (err: any) {
      console.error("Save category error:", err);
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Loi khi luu danh muc. Vui long kiem tra lai du lieu.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (category: WarehouseCategory) => {
    if (normalizeCategoryStatus(category.status) === "INACTIVE") {
      return;
    }

    if (
      !window.confirm(
        `Ban co chac chan muon delete category "${category.name}"? Category se chuyen ve INACTIVE.`,
      )
    ) {
      return;
    }

    setDeletingCategoryId(category.id);
    try {
      await deleteCategory(category.id);
      await loadData();
    } catch (err: any) {
      console.error("Delete category error:", err);
      alert(err?.response?.data?.message || err?.message || "Loi khi delete danh muc.");
    } finally {
      setDeletingCategoryId(null);
    }
  };

  return (
    <div className="category-page-wrapper">
      <div className="top-nav-bar">
        <button
          className="btn-back-link"
          onClick={() => navigate("/admin/warehouse/list")}
        >
          ← Back to Warehouses
        </button>
      </div>

      <div className="item-tab-header">
        <button
          className="tab-btn"
          onClick={() => navigate(`/admin/warehouse/item?warehouseId=${warehouseId}`)}
        >
          Items
        </button>
        <button className="tab-btn active">Categories</button>
        <button
          className="tab-btn"
          onClick={() =>
            navigate(
              `/admin/warehouse/request?warehouseId=${warehouseId}&tab=franchise`,
            )
          }
        >
          Request Franchies
        </button>
        <button
          className="tab-btn"
          onClick={() =>
            navigate(
              `/admin/warehouse/request?warehouseId=${warehouseId}&tab=supplier`,
            )
          }
        >
          Request Supplier
        </button>
      </div>

      <div className="category-page-content">
        <div className="header-flex">
          <div>
            <h1>Category Management</h1>
            <p className="category-subtitle">
              Hien thi day du category ACTIVE va INACTIVE. Delete se dua category ve
              INACTIVE, va ban co the vao Edit de doi lai ACTIVE.
            </p>
          </div>

          <button className="btn-add-main" onClick={handleOpenCreate}>
            + Add Category
          </button>
        </div>

        <div className="table-container">
          <table className="category-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Description</th>
                <th>Display Order</th>
                <th>Status</th>
                <th style={{ width: "160px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories.map((category) => {
                  const normalizedStatus = normalizeCategoryStatus(category.status);
                  const isInactive = normalizedStatus === "INACTIVE";
                  const isDeleting = deletingCategoryId === category.id;
                  const linkedItemsCount = items.filter(
                    (item) =>
                      item.categoryName === category.name ||
                      item.catergoryName === category.name,
                  ).length;

                  return (
                    <tr
                      key={category.id}
                      className={isInactive ? "row-inactive" : undefined}
                    >
                      <td>
                        <strong>{category.name}</strong>
                      </td>
                      <td>{category.description || "—"}</td>
                      <td>{Number(category.displayOrder) || 0}</td>
                      <td>
                        <span
                          className={`status-pill ${normalizedStatus.toLowerCase()}`}
                        >
                          {normalizedStatus}
                        </span>
                        {linkedItemsCount > 0 && (
                          <p className="linked-items-note">
                            {linkedItemsCount} item linked
                          </p>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-edit-sm"
                            onClick={() => handleOpenEdit(category)}
                          >
                            Edit
                          </button>
                          <button
                            className={`btn-delete-sm ${isInactive ? "disabled" : ""}`}
                            onClick={() => !isInactive && void handleDeleteCategory(category)}
                            disabled={isInactive || isDeleting}
                            title={
                              isInactive
                                ? "Category dang INACTIVE, hay vao Edit de doi status thanh ACTIVE."
                                : "Delete category"
                            }
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
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
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content item-modal-xl">
            <h2>{editCat ? "Update Category" : "New Category"}</h2>
            <div className="form-scroll-area">
              <label>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(event) =>
                  setFormData((current) => ({ ...current, name: event.target.value }))
                }
              />

              <label>Description</label>
              <textarea
                rows={3}
                className="custom-textarea"
                value={formData.description}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />

              <label>Display Order</label>
              <input
                type="number"
                value={formData.displayOrder}
                onChange={(event) =>
                  setFormData((current) => ({
                    ...current,
                    displayOrder: Number(event.target.value),
                  }))
                }
              />

              {editCat && (
                <>
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        status: event.target.value as CategoryStatus,
                      }))
                    }
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                  <p className="status-helper-text">
                    Neu category da delete va dang INACTIVE, ban co the doi lai ACTIVE
                    tai day.
                  </p>
                </>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={handleCloseModal} disabled={isSaving}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Category;
