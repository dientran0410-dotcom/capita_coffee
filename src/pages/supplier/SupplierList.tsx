import { useCallback, useEffect, useState, type MouseEvent as ReactMouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  getAllSuppliers,
  filterSuppliers,
  searchSuppliersByKeyword,
  toggleSuspend,
  deleteSupplier,
} from "../../services/supplierService";
import { useAuth } from "../../context/AuthContext";
import "./SupplierList.css";

interface Supplier {
  id: string | number;
  name: string;
  contactEmail: string;
  region?: string;
  rating: number;
  updateAt?: string | null;
  status: string;
}

interface SupplierFilterState {
  status: string;
  region: string;
  updatedAfter: string;
  sort: string;
}

interface SupplierListApiResponse {
  content?: Supplier[];
  totalPages?: number;
}

type SupplierListMode = "all" | "keyword" | "filter";

const PAGE_SIZE = 5;

const DEFAULT_FILTERS: SupplierFilterState = {
  status: "",
  region: "",
  updatedAfter: "",
  sort: "updateAt,desc",
};

export default function SupplierList() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [openActionId, setOpenActionId] = useState<Supplier["id"] | null>(null);
  const [actionMenuPosition, setActionMenuPosition] = useState({ top: 0, left: 0 });
  const [actionLoadingId, setActionLoadingId] = useState<Supplier["id"] | null>(null);
  const [keyword, setKeyword] = useState("");
  const [filters, setFilters] = useState<SupplierFilterState>(DEFAULT_FILTERS);
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<SupplierFilterState>(DEFAULT_FILTERS);
  const [listMode, setListMode] = useState<SupplierListMode>("all");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const actionUser = currentUser?.username ?? "admin_user";

  const applySupplierResponse = useCallback((response: SupplierListApiResponse, pageNumber: number) => {
    setSuppliers(Array.isArray(response?.content) ? response.content : []);
    setTotalPages(typeof response?.totalPages === "number" ? response.totalPages : 0);
    setPage(pageNumber);
    setOpenActionId(null);
  }, []);

  const fetchAllSuppliers = useCallback(async (pageNumber: number = 0) => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const res = await getAllSuppliers(pageNumber, PAGE_SIZE);
      applySupplierResponse(res, pageNumber);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to fetch supplier list."
      );
      setSuppliers([]);
      setTotalPages(0);
      setPage(0);
    } finally {
      setIsLoading(false);
    }
  }, [applySupplierResponse]);

  const fetchFilteredSuppliers = useCallback(
    async (
      pageNumber: number = 0,
      currentFilters: SupplierFilterState = appliedFilters
    ) => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const res = await filterSuppliers({
          ...currentFilters,
          page: pageNumber,
          size: PAGE_SIZE,
        });
        applySupplierResponse(res, pageNumber);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Filter failed.");
        setSuppliers([]);
        setTotalPages(0);
        setPage(0);
      } finally {
        setIsLoading(false);
      }
    },
    [appliedFilters, applySupplierResponse]
  );

  const fetchKeywordSuppliers = useCallback(
    async (pageNumber: number = 0, currentKeyword: string = appliedKeyword) => {
      const normalizedKeyword = currentKeyword.trim();
      if (!normalizedKeyword) {
        await fetchAllSuppliers(pageNumber);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const res = await searchSuppliersByKeyword(normalizedKeyword, pageNumber, PAGE_SIZE);
        applySupplierResponse(res, pageNumber);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Search failed.");
        setSuppliers([]);
        setTotalPages(0);
        setPage(0);
      } finally {
        setIsLoading(false);
      }
    },
    [appliedKeyword, applySupplierResponse, fetchAllSuppliers]
  );

  useEffect(() => {
    void fetchAllSuppliers(0);
  }, [fetchAllSuppliers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (!target.closest(".action-menu-wrapper") && !target.closest(".action-menu")) {
        setOpenActionId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (openActionId === null) {
      return;
    }

    const closeMenu = () => setOpenActionId(null);
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);

    return () => {
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, [openActionId]);

  useEffect(() => {
    if (openActionId === null) {
      return;
    }

    const isStillVisible = suppliers.some((item) => item.id === openActionId);
    if (!isStillVisible) {
      setOpenActionId(null);
    }
  }, [suppliers, openActionId]);

  const formatDateTime = (value?: string | null) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSearchByKeyword = async () => {
    const nextKeyword = keyword.trim();

    setSuccessMessage("");
    setAppliedKeyword(nextKeyword);
    setAppliedFilters(DEFAULT_FILTERS);

    if (!nextKeyword) {
      setListMode("all");
      await fetchAllSuppliers(0);
      return;
    }

    setListMode("keyword");
    await fetchKeywordSuppliers(0, nextKeyword);
  };

  const handleSearchByFilters = async () => {
    const nextFilters = { ...filters };

    setSuccessMessage("");
    setAppliedFilters(nextFilters);
    setListMode("filter");

    await fetchFilteredSuppliers(0, nextFilters);
  };

  const handlePageChange = useCallback(
    async (nextPage: number) => {
      if (nextPage < 0 || isLoading) {
        return;
      }

      if (totalPages > 0 && nextPage >= totalPages) {
        return;
      }

      if (listMode === "filter") {
        await fetchFilteredSuppliers(nextPage, appliedFilters);
        return;
      }

      if (listMode === "keyword") {
        await fetchKeywordSuppliers(nextPage, appliedKeyword);
        return;
      }

      await fetchAllSuppliers(nextPage);
    },
    [
      isLoading,
      totalPages,
      listMode,
      fetchFilteredSuppliers,
      fetchKeywordSuppliers,
      appliedFilters,
      appliedKeyword,
      fetchAllSuppliers,
    ]
  );

  const handleSupplierAction = async (
    supplier: Supplier,
    action: "toggleSuspend" | "delete"
  ) => {
    let confirmMessage = "";
    let successText = "";

    if (action === "toggleSuspend") {
      const isSuspended = supplier.status === "SUSPENDED";
      confirmMessage = `${isSuspended ? "Unsuspend" : "Suspend"} supplier ${supplier.name}?`;
      successText = `Supplier ${supplier.name} ${isSuspended ? "unsuspended" : "suspended"}.`;
    }

    if (action === "delete") {
      confirmMessage = `Delete supplier ${supplier.name}? This action cannot be undone.`;
      successText = `Supplier ${supplier.name} deleted.`;
    }

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setOpenActionId(null);
    setActionLoadingId(supplier.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (action === "toggleSuspend") {
        await toggleSuspend(supplier.id, actionUser);
      }

      if (action === "delete") {
        await deleteSupplier(supplier.id, actionUser);
      }

      setSuccessMessage(successText);
      if (listMode === "filter") {
        await fetchFilteredSuppliers(page, appliedFilters);
      } else if (listMode === "keyword") {
        await fetchKeywordSuppliers(page, appliedKeyword);
      } else {
        await fetchAllSuppliers(page);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Supplier action failed."
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleActionMenu = (
    event: ReactMouseEvent<HTMLButtonElement>,
    supplierId: Supplier["id"]
  ) => {
    if (openActionId === supplierId) {
      setOpenActionId(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    setActionMenuPosition({
      top: rect.top - 6,
      left: rect.right,
    });
    setOpenActionId(supplierId);
  };

  const activeActionSupplier =
    openActionId === null
      ? null
      : suppliers.find((item) => item.id === openActionId) ?? null;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Supplier Management</h1>
        <div className="page-header-actions">
          <button
            className="btn-dashboard"
            onClick={() => navigate("/admin/suppliers/dashboard")}
          >
            Dashboard
          </button>
          <div className="supplier-shortcuts-row">
            <button
              className="btn-dashboard"
              onClick={() => navigate("/admin/suppliers/products")}
            >
              Supplier Products
            </button>
            <button
              className="btn-dashboard"
              onClick={() => navigate("/admin/suppliers/audit-logs/all")}
            >
              Audit Logs
            </button>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate("/admin/suppliers/create")}
          >
            + Add Supplier
          </button>
        </div>
      </div>

      {successMessage ? (
        <div className="alert alert-success">{successMessage}</div>
      ) : null}

      {errorMessage ? <div className="alert alert-error">{errorMessage}</div> : null}

      {/* SEARCH */}
      <div className="card search-card">
        <input
          placeholder="Search by name or email..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              void handleSearchByKeyword();
            }
          }}
          className="input"
        />
        <button className="btn-primary" onClick={() => { void handleSearchByKeyword(); }}>
          Search
        </button>
      </div>

      {/* FILTER */}
      <div className="card filter-card">
        <input
          type="datetime-local"
          value={filters.updatedAfter}
          onChange={(e) =>
            setFilters({ ...filters, updatedAfter: e.target.value })
          }
          className="input small"
        />

        <select
          value={filters.region}
          onChange={(e) =>
            setFilters({ ...filters, region: e.target.value })
          }
          className="input small"
        >
          <option value="">All Region</option>
          <option value="NORTH">North Vietnam</option>
          <option value="CENTRAL">Central Vietnam</option>
          <option value="SOUTH">South Vietnam</option>
        </select>

        <select
          value={filters.status}
          onChange={(e) =>
            setFilters({ ...filters, status: e.target.value })
          }
          className="input small"
        >
          <option value="">All Status</option>
          <option value="APPROVED">Approved</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="DELETED">Deleted</option>
        </select>

        <button className="btn-primary" onClick={() => { void handleSearchByFilters(); }}>
          Search
        </button>

        <button
          className="btn-secondary"
          onClick={async () => {
            setKeyword("");
            setFilters(DEFAULT_FILTERS);
            setAppliedKeyword("");
            setAppliedFilters(DEFAULT_FILTERS);
            setListMode("all");
            setSuccessMessage("");
            await fetchAllSuppliers(0);
          }}
        >
          Reset
        </button>
      </div>

      {/* TABLE */}
      <div className="card table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Region</th>
                <th>Updated</th>
                <th>Status</th>
                <th className="table-actions-col">Actions</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="empty">
                    Loading suppliers...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty">
                    No suppliers found
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  (() => {
                    const isDeletedStatus = ["DELETE", "DELETED"].includes(String(s.status).toUpperCase());

                    return (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.contactEmail}</td>
                    <td>{s.region || "-"}</td>
                    <td>{formatDateTime(s.updateAt)}</td>
                    <td>
                      <span className={`status ${s.status.toLowerCase()}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn-table btn-detail"
                          onClick={() => navigate(`/admin/suppliers/${s.id}`)}
                          disabled={actionLoadingId === s.id}
                        >
                          Detail
                        </button>

                        <button
                          className="btn-table btn-edit"
                          onClick={() => navigate(`/admin/suppliers/update/${s.id}`)}
                          disabled={actionLoadingId === s.id}
                        >
                          Edit
                        </button>

                        <div className="action-menu-wrapper">
                          <button
                            className="btn-table btn-action"
                            onClick={(event) => handleToggleActionMenu(event, s.id)}
                            disabled={actionLoadingId === s.id || isDeletedStatus}
                          >
                            {actionLoadingId === s.id ? "Working..." : "Action"}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                    );
                  })()
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button
            className="btn-pagination"
            disabled={isLoading || page === 0}
            onClick={() => {
              void handlePageChange(page - 1);
            }}
          >
            Previous
          </button>

          <span className="pagination-info">
            Page {totalPages === 0 ? 0 : page + 1} / {totalPages}
          </span>

          <button
            className="btn-pagination"
            disabled={isLoading || totalPages === 0 || page + 1 >= totalPages}
            onClick={() => {
              void handlePageChange(page + 1);
            }}
          >
            Next
          </button>
        </div>
      </div>

      {openActionId !== null &&
      activeActionSupplier &&
      !["DELETE", "DELETED"].includes(String(activeActionSupplier.status).toUpperCase())
        ? createPortal(
            <div
              className="action-menu"
              style={{
                top: `${actionMenuPosition.top}px`,
                left: `${actionMenuPosition.left}px`,
              }}
            >
              <button
                className="action-item"
                onClick={() => {
                  void handleSupplierAction(activeActionSupplier, "toggleSuspend");
                }}
              >
                {activeActionSupplier.status === "SUSPENDED" ? "Unsuspend" : "Suspend"}
              </button>

              <button
                className="action-item danger"
                onClick={() => {
                  void handleSupplierAction(activeActionSupplier, "delete");
                }}
              >
                Delete
              </button>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}