import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useMemo } from "react";
import {
  getItemsByWarehouse,
  getCategories,
  updateItem,
  uploadItemImages,
  deleteItemImageByUrl,
  createItem,
  deleteItem,
} from "@/services/warehouseService";
import { UNIT_OPTIONS, normalizeWarehouseUnit } from "@/utils/unit";
import "@/assets/css/warehouseItemPage.css";

const Item = () => {
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

  const extractId = (payload: unknown): number | undefined => {
    if (payload && typeof payload === "object" && "id" in payload) {
      const directId = (payload as { id?: unknown }).id;
      if (typeof directId === "number") return directId;
    }
    if (payload && typeof payload === "object" && "data" in payload) {
      const nested = (payload as { data?: unknown }).data;
      if (nested && typeof nested === "object" && "id" in nested) {
        const nestedId = (nested as { id?: unknown }).id;
        if (typeof nestedId === "number") return nestedId;
      }
    }
    return undefined;
  };

  const location = useLocation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingImageUrl, setDeletingImageUrl] = useState("");
  const [saveError, setSaveError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    quantity: 0,
    unit: "GRAM",
    price: 0,
    supplierName: "",
    status: "ACTIVE",
    reorderLevel: 0,
    description: "",
  });

  const warehouseId = new URLSearchParams(location.search).get("warehouseId");

  useEffect(() => {
    if (warehouseId) {
      fetchItems();
      fetchCats();
    }
  }, [warehouseId]);

  const selectedFilePreviews = useMemo(
    () =>
      selectedFiles.map((file) => ({
        key: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        url: URL.createObjectURL(file),
      })),
    [selectedFiles],
  );

  useEffect(() => {
    return () => {
      selectedFilePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [selectedFilePreviews]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await getItemsByWarehouse(Number(warehouseId));
      // Giữ nguyên logic lọc Item ACTIVE của bạn
      // setItems(extractList<any>(res).filter((i: any) => i.status === "ACTIVE"));
      setItems(extractList<any>(res));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCats = async () => {
    try {
      const res = await getCategories(Number(warehouseId));
      const categoryData = extractList<any>(res);

      // FIX: Chỉ lấy những Category có status khác INACTIVE
      const activeCats = Array.isArray(categoryData)
        ? categoryData.filter((c: any) => c.status !== "INACTIVE")
        : [];

      setCategories(activeCats);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCat =
        selectedCategory === "All" || item.categoryName === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [items, searchTerm, selectedCategory]);

  const handleOpenModal = (item: any = null) => {
    setSelectedFiles([]);
    setSaveError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (item) {
      setEditingItem(item);
      setExistingImages(item.imageUrls || []);
      const cat = categories.find((c) => c.name === item.categoryName);
      setFormData({
        name: item.name,
        categoryId: cat?.id || "",
        quantity: item.quantity,
        unit: normalizeWarehouseUnit(item.unit, "GRAM"),
        price: item.price,
        supplierName: item.supplierName || "",
        status: item.status,
        reorderLevel: item.reorderLevel || 0,
        description: item.description || "",
      });
    } else {
      setEditingItem(null);
      setExistingImages([]);
      setFormData({
        name: "",
        categoryId: "",
        quantity: 0,
        unit: "GRAM",
        price: 0,
        supplierName: "",
        status: "ACTIVE",
        reorderLevel: 0,
        description: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setSaveError("");
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incomingFiles = Array.from(event.target.files || []).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (incomingFiles.length === 0) {
      event.target.value = "";
      return;
    }

    setSelectedFiles((current) => {
      const existingKeys = new Set(
        current.map((file) => `${file.name}-${file.size}-${file.lastModified}`),
      );

      const dedupedIncoming = incomingFiles.filter((file) => {
        const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
        if (existingKeys.has(fileKey)) return false;
        existingKeys.add(fileKey);
        return true;
      });

      return [...current, ...dedupedIncoming];
    });

    event.target.value = "";
  };

  const handleRemoveSelectedFile = (previewKey: string) => {
    if (isSaving) return;
    setSelectedFiles((current) =>
      current.filter(
        (file) => `${file.name}-${file.size}-${file.lastModified}` !== previewKey,
      ),
    );
  };

  const handleDeleteExistingImage = async (imageUrl: string) => {
    if (isSaving || deletingImageUrl) return;

    setDeletingImageUrl(imageUrl);
    setSaveError("");

    try {
      await deleteItemImageByUrl(imageUrl);
      setExistingImages((prev) => prev.filter((img) => img !== imageUrl));
      setItems((prev) =>
        prev.map((item) =>
          item.id === editingItem?.id
            ? {
                ...item,
                imageUrls: Array.isArray(item.imageUrls)
                  ? item.imageUrls.filter((img: string) => img !== imageUrl)
                  : [],
              }
            : item,
        ),
      );
      setEditingItem((current: any) =>
        current
          ? {
              ...current,
              imageUrls: Array.isArray(current.imageUrls)
                ? current.imageUrls.filter((img: string) => img !== imageUrl)
                : [],
            }
          : current,
      );
    } catch (err) {
      console.error("Delete warehouse item image failed:", err);
      setSaveError(
        err instanceof Error ? err.message : "Khong the xoa hinh anh.",
      );
    } finally {
      setDeletingImageUrl("");
    }
  };

  const handleDeleteItem = async (item: any) => {
    if (item.quantity > 0) {
      alert(
        `Không thể xóa! Vật tư "${item.name}" vẫn còn tồn kho (${item.quantity}).`,
      );
      return;
    }
    if (window.confirm(`Xóa vĩnh viễn vật tư: ${item.name}?`)) {
      try {
        await deleteItem(item.id);
        fetchItems();
      } catch (err) {
        alert("Lỗi khi xóa vật tư.");
      }
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setSaveError("");
    try {
      const payload = {
        ...formData,
        categoryId: Number(formData.categoryId),
        unit: normalizeWarehouseUnit(formData.unit, "GRAM"),
      };
      let itemId = editingItem?.id;
      if (editingItem) {
        await updateItem(itemId, payload);
      } else {
        const res = await createItem({
          ...payload,
          warehouseId: Number(warehouseId),
        });
        itemId = extractId(res);
      }
      if (!itemId) {
        throw new Error("Cannot resolve item id from create response");
      }
      if (selectedFiles.length > 0) {
        await uploadItemImages(itemId, selectedFiles);
      }
      setSelectedFiles([]);
      setIsModalOpen(false);
      await fetchItems();
    } catch (err) {
      console.error("Save warehouse item failed:", err);
      setSaveError(
        err instanceof Error
          ? err.message
          : "Khong the luu item hoac upload hinh anh.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="item-page-wrapper">
      <div className="top-nav-bar">
        <button
          className="btn-back-link"
          onClick={() => navigate("/admin/warehouse/list")}
        >
          ← Back to Warehouses
        </button>
      </div>

      <div className="item-tab-header">
        <button className="tab-btn active">Items</button>
        <button
          className="tab-btn"
          onClick={() =>
            navigate(`/admin/warehouse/category?warehouseId=${warehouseId}`)
          }
        >
          Categories
        </button>
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

      <div className="item-page-content">
        <div className="header-flex">
          <h1>Item Management</h1>
          <button className="btn-add-main" onClick={() => handleOpenModal()}>
            + Add Item
          </button>
        </div>

        <div className="filter-bar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="category-filter">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="items-grid">
          {loading ? (
            <div className="loading-state">Loading items...</div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state">No items found.</div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className={`item-card-ui ${item.quantity === 0 ? "out-of-stock" : ""}`}
              >
                <div className="card-thumb">
                  {item.quantity === 0 && (
                    <div className="oos-tag">OUT OF STOCK</div>
                  )}
                  <img
                    src={
                      item.imageUrls?.[0] ||
                      "https://placehold.co/300x200?text=No+Image"
                    }
                    alt=""
                  />
                </div>
                <div className="card-body">
                  <div className="cat-label">{item.catergoryName}</div>
                  <h3>{item.name}</h3>
                  <p className="stock-info">
                    Stock:{" "}
                    <span className={item.quantity === 0 ? "text-danger" : ""}>
                      {item.quantity}
                    </span>
                    <span>{" " + item.unit.toLowerCase()}</span>
                  </p>
                  <div className="card-footer-btns">
                    <button
                      className="text-btn edit"
                      onClick={() => handleOpenModal(item)}
                    >
                      Edit
                    </button>
                    <button
                      className={`text-btn delete ${item.quantity > 0 ? "disabled" : ""}`}
                      onClick={() => handleDeleteItem(item)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content item-modal-xl">
            <h2>{editingItem ? "Update Item" : "Create Item"}</h2>
            <div className="form-scroll-area">
              {saveError && <div className="error-message">{saveError}</div>}
              <label>Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <div className="form-row-2">
                <div>
                  <label>Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                  >
                    <option value="">Select...</option>
                    {categories.map((c) =>
                      formData.categoryId === c.id ? (
                        <option key={c.id} value={c.id} selected>
                          {c.name}
                        </option>
                      ) : (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ),
                    )}
                  </select>
                </div>
                <div>
                  <label>Price</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="form-row-2">
                <div>
                  <label>Quantity</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label>Reorder Level</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.reorderLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reorderLevel: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div className="form-row-2">
                <div>
                  <label>Supplier</label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) =>
                      setFormData({ ...formData, supplierName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label>Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unit: normalizeWarehouseUnit(e.target.value, "GRAM"),
                      })
                    }
                  >
                    {UNIT_OPTIONS.map(
                      (unit) =>
                        unit != "PIECE" &&
                        unit != "UNIT" && (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ),
                    )}
                  </select>
                </div>
              </div>
              <div className="form-row-2">
                <div>
                  <label>Description: </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      });
                    }}
                  ></textarea>
                </div>
              </div>

              <div className="image-edit-container">
                <label>Images</label>
                <div className="upload-grid">
                  {existingImages.map((url, i) => (
                    <div key={i} className="upload-box">
                      <img src={url} alt="" />
                      <button
                        className="btn-del-mini"
                        type="button"
                        onClick={() => handleDeleteExistingImage(url)}
                        disabled={isSaving || deletingImageUrl === url}
                      >
                        {deletingImageUrl === url ? "..." : "×"}
                      </button>
                    </div>
                  ))}
                  {selectedFilePreviews.map((preview) => (
                    <div key={preview.key} className="upload-box">
                      <img src={preview.url} alt={preview.file.name} />
                      <button
                        className="btn-del-mini"
                        type="button"
                        onClick={() => handleRemoveSelectedFile(preview.key)}
                        disabled={isSaving || !!deletingImageUrl}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <div
                    className="upload-box btn-plus"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <span>+</span>
                    <input
                      type="file"
                      hidden
                      multiple
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={handleCloseModal}
                disabled={isSaving || !!deletingImageUrl}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleSubmit}
                disabled={isSaving || !!deletingImageUrl}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Item;

