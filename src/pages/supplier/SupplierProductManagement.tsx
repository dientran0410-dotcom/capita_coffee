import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { searchSupplierProducts } from "../../services/supplierService";
import "./SupplierHeaderShared.css";

interface SupplierProductItem {
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
  createAt: string;
  updateAt: string;
}

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeRow = (row: unknown): SupplierProductItem => {
  const item = (row && typeof row === "object" ? row : {}) as Record<string, unknown>;

  return {
    id: String(item.id ?? ""),
    supplierId: String(item.supplierId ?? ""),
    supplierName: String(item.supplierName ?? ""),
    productId: item.productId ? String(item.productId) : "",
    productNameSnapshot: String(item.productNameSnapshot ?? ""),
    productUnitSnapshot: String(item.productUnitSnapshot ?? ""),
    name: String(item.name ?? item.productNameSnapshot ?? ""),
    unit: String(item.unit ?? item.productUnitSnapshot ?? ""),
    description: String(item.description ?? ""),
    pricePerUnit: toNumber(item.pricePerUnit),
    minOrderQuantity: toNumber(item.minOrderQuantity),
    leadTimeDays: toNumber(item.leadTimeDays),
    isDeleted: Boolean(item.isDeleted),
    createAt: String(item.createAt ?? ""),
    updateAt: String(item.updateAt ?? ""),
  };
};

const parseResponse = (payload: unknown): { content: SupplierProductItem[]; totalPages: number; number: number } => {
  if (!payload || typeof payload !== "object") {
    return { content: [], totalPages: 0, number: 0 };
  }

  const root = payload as Record<string, unknown>;
  const source =
    (root.result && typeof root.result === "object" ? root.result : null) ||
    (root.data && typeof root.data === "object" ? root.data : null) ||
    root;

  const pageData = source as Record<string, unknown>;
  const content = Array.isArray(pageData.content) ? pageData.content.map(normalizeRow) : [];

  return {
    content,
    totalPages: toNumber(pageData.totalPages),
    number: toNumber(pageData.number),
  };
};

const formatDateTime = (value: string): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("vi-VN");
};

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0);

export default function SupplierProductManagement() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<SupplierProductItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [size, setSize] = useState(10);
  const [sortBy, setSortBy] = useState("createAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [searchNameInput, setSearchNameInput] = useState("");
  const [searchName, setSearchName] = useState("");

  const fetchProducts = useCallback(
    async (
      currentName = searchName,
      nextPage = 0,
      nextSize = size,
      nextSortBy = sortBy,
      nextSortDir = sortDir
    ) => {
      try {
        setLoading(true);
        setErrorMessage("");

        const result = await searchSupplierProducts({
          name: currentName,
          page: nextPage,
          size: nextSize,
          sortBy: nextSortBy,
          sortDir: nextSortDir,
        });

        const parsed = parseResponse(result);
        setProducts(parsed.content);
        setTotalPages(parsed.totalPages);
        setPage(parsed.number);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to fetch supplier products.");
        setProducts([]);
        setTotalPages(0);
        setPage(0);
      } finally {
        setLoading(false);
      }
    },
    [size, sortBy, sortDir, searchName]
  );

  useEffect(() => {
    void fetchProducts(searchName, 0, size, sortBy, sortDir);
  }, [fetchProducts, size, sortBy, sortDir, searchName]);

  const handleSearch = () => {
    setSearchName(searchNameInput.trim());
  };

  const handleReset = () => {
    setSearchNameInput("");
    setSearchName("");
  };

  return (
    <div className="space-y-4">
      <div className="supplier-shared-header">
        <div>
          <h1 className="supplier-shared-title">Supplier Product Management</h1>
        </div>
        <div className="supplier-shared-header-actions">
          <Link
            to="/admin/suppliers"
            className="supplier-shared-nav-btn"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Supplier List
          </Link>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]">
          <label className="flex flex-col gap-1 text-sm text-gray-700">
            Search by product name
            <input
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Enter product name..."
              value={searchNameInput}
              onChange={(e) => setSearchNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
            />
          </label>

          <button
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 md:self-end"
            onClick={handleSearch}
          >
            Search
          </button>

          <button
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 md:self-end"
            onClick={handleReset}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Sort by
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="createAt">Created At</option>
            <option value="updateAt">Updated At</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Sort direction
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value === "asc" ? "asc" : "desc")}
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Page size
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={size}
            onChange={(e) => {
              const nextSize = Number(e.target.value) || 10;
              setSize(nextSize);
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Supplier Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Minimum Order Quantity</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Lead Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created / Updated</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    Loading supplier products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{item.name || item.productNameSnapshot || "-"}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{item.supplierName || "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{item.description || "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{formatMoney(item.pricePerUnit)}</td>
                    <td className="px-4 py-3 text-gray-700">{item.minOrderQuantity}</td>
                    <td className="px-4 py-3 text-gray-700">{item.unit || item.productUnitSnapshot || "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{item.leadTimeDays} days</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.isDeleted ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {item.isDeleted ? "Deleted" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="flex flex-col">
                        <span>C: {formatDateTime(item.createAt)}</span>
                        <span>U: {formatDateTime(item.updateAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                        onClick={() => navigate(`/admin/suppliers/${item.supplierId}`)}
                        disabled={!item.supplierId}
                      >
                        Supplier Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
          <div className="text-sm text-gray-600">Page {totalPages === 0 ? 0 : page + 1} / {totalPages}</div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading || page === 0}
              onClick={() => {
                void fetchProducts(searchName, page - 1, size, sortBy, sortDir);
              }}
            >
              Previous
            </button>
            <button
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading || totalPages === 0 || page + 1 >= totalPages}
              onClick={() => {
                void fetchProducts(searchName, page + 1, size, sortBy, sortDir);
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
