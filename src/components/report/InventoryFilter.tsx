interface InventoryFilterProps {
  franchiseId: string;
  franchiseOptions: Array<{ id: string; name: string; code: string }>;
  franchiseLoading: boolean;
  warehouseId: number | null;
  warehouseOptions: Array<{ id: number; name: string }>;
  warehouseLoading: boolean;
  loading: boolean;
  onFranchiseChange: (value: string) => void;
  onWarehouseChange: (value: number | null) => void;
  onGenerate: () => void;
}

export const InventoryFilter = ({
  franchiseId,
  franchiseOptions,
  franchiseLoading,
  warehouseId,
  warehouseOptions,
  warehouseLoading,
  loading,
  onFranchiseChange,
  onWarehouseChange,
  onGenerate,
}: InventoryFilterProps) => (
  <div className="filter-container">
    <div className="filter-group">
      <label className="filter-label">
        Franchise (optional)
      </label>
      <select
        value={franchiseId}
        onChange={(e) => onFranchiseChange(e.target.value)}
        className="filter-input wide"
        disabled={franchiseLoading}
      >
        <option value="">
          {franchiseLoading ? "Loading franchises..." : "All active franchises"}
        </option>
        {franchiseOptions.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}{item.code ? ` (${item.code})` : ""}
          </option>
        ))}
      </select>
    </div>
    <div className="filter-group">
      <label className="filter-label">
        Warehouse (optional)
      </label>
      <select
        value={warehouseId ?? ""}
        onChange={(e) => {
          const rawValue = e.target.value;
          if (!rawValue) {
            onWarehouseChange(null);
            return;
          }

          const nextId = Number(rawValue);
          onWarehouseChange(Number.isFinite(nextId) ? nextId : null);
        }}
        className="filter-input wide"
        disabled={warehouseLoading}
      >
        <option value="">
          {warehouseLoading ? "Loading warehouses..." : "All warehouses"}
        </option>
        {warehouseOptions.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </div>
    <button
      onClick={onGenerate}
      disabled={loading}
      className="btn-generate"
    >
      {loading ? "Generating..." : "Generate Report"}
    </button>
  </div>
);
