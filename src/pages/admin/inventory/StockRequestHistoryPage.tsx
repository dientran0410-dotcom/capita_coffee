import { useCallback, useEffect, useState } from "react";
import type { InventoryLog } from "../../../types/inventory";
import { getInventoryLogs } from "../../../services/inventoryService";
import InventoryTabs from "../../../components/inventory/InventoryTabs";
import "@/assets/css/inventoryPage.css";

const StockRequestHistoryPage = () => {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [filters, setFilters] = useState({
    ingredientId: "",
    actionType: "",
    performedBy: "",
    startDate: "",
    endDate: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getInventoryLogs({
        ingredientId: filters.ingredientId || undefined,
        actionType: filters.actionType || undefined,
        performedBy: filters.performedBy || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        page: currentPage,
        size: pageSize,
      });

      setLogs(response?.data?.content || []);
      setTotalPages(response?.data?.totalPages || 0);
      setTotalElements(response?.data?.totalElements || 0);
    } catch (err) {
      console.error("Fetch inventory logs error:", err);
      setError("Failed to load logs.");
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(0);
  };

  const handleStartDateChange = (date: Date | null) => {
    setFilters((prev) => ({
      ...prev,
      startDate: date ? date.toLocaleDateString("en-CA") : "",
    }));
    setCurrentPage(0);
  };

  const handleEndDateChange = (date: Date | null) => {
    setFilters((prev) => ({
      ...prev,
      endDate: date ? `${date.toLocaleDateString("en-CA")}T23:59:59` : "",
    }));
    setCurrentPage(0);
  };

  const handleReset = () => {
    setFilters({
      ingredientId: "",
      actionType: "",
      performedBy: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(0);
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getActionTypeClass = (actionType: string) => {
    if (actionType === "ADD") return "status-badge-active";
    if (actionType === "DEDUCT") return "status-badge-inactive";
    return "status-badge-active";
  };

  return (
    <div className="inventory-page">
      <div className="inv-header">
        <h1>Inventory Logs</h1>
      </div>

      <InventoryTabs active="history" />

      <div className="controls" style={{ gridTemplateColumns: "repeat(5, minmax(150px, 1fr))" }}>
        <input
          type="number"
          name="ingredientId"
          value={filters.ingredientId}
          onChange={handleFilterChange}
          placeholder="Ingredient ID"
        />
        <select name="actionType" value={filters.actionType} onChange={handleFilterChange}>
          <option value="">All Actions</option>
          <option value="ADD">ADD</option>
          <option value="DEDUCT">DEDUCT</option>
          <option value="EDIT">EDIT</option>
          <option value="TRANSFER">TRANSFER</option>
        </select>
        <input
          type="text"
          name="performedBy"
          value={filters.performedBy}
          onChange={handleFilterChange}
          placeholder="Performed By"
        />
        <input
          type="date"
          className="date-picker-input"
          value={filters.startDate ? filters.startDate.slice(0, 10) : ""}
          onChange={(e) => handleStartDateChange(e.target.value ? new Date(e.target.value) : null)}
        />
        <input
          type="date"
          className="date-picker-input"
          value={filters.endDate ? filters.endDate.slice(0, 10) : ""}
          onChange={(e) => handleEndDateChange(e.target.value ? new Date(e.target.value) : null)}
        />
      </div>

      <div className="header-actions" style={{ marginBottom: 12 }}>
        <button className="btn-pri" onClick={fetchData}>Search</button>
        <button className="btn-sec" onClick={handleReset}>Reset</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Ingredient Name</th>
              <th>Action</th>
              <th>Quantity</th>
              <th>Performed By</th>
              <th>Timestamp</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}>Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={7}>No logs found.</td></tr>
            ) : (
              logs.map((log, idx) => (
                <tr key={log.id}>
                  <td>{currentPage * pageSize + idx + 1}</td>
                  <td>{log.ingredientName}</td>
                  <td>
                    <span className={`status-badge ${getActionTypeClass(log.actionType)}`}>
                      {log.actionType}
                    </span>
                  </td>
                  <td>{log.actionType === "DEDUCT" ? "-" : "+"}{Math.abs(Number(log.quantityChanged || 0))}</td>
                  <td>{log.performedBy || "System"}</td>
                  <td>{formatDateTime(log.timestamp)}</td>
                  <td>{log.reason || "N/A"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 0 && (
        <div className="pagination-wrapper">
          <div className="pagination-info">
            Page {currentPage + 1} of {Math.max(1, totalPages)} | Total Records: {totalElements}
          </div>
          <div className="pagination-controls">
            <button
              className="btn-pagination"
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              Previous
            </button>

            <div className="page-numbers">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = totalPages <= 5 ? i : Math.max(0, currentPage - 2) + i;
                if (pageNum >= totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    className={`page-btn ${currentPage === pageNum ? "active" : ""}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>

            <button
              className="btn-pagination"
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
            >
              Next
            </button>

            <select
              className="page-size-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(0);
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockRequestHistoryPage;
