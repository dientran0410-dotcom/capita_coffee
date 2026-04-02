import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Edit, Ban, CheckCircle } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

async function getProducts(params = {}) {
  const query = new URLSearchParams();
  Object.keys(params).forEach((k) => { if (params[k] !== '' && params[k] != null) query.append(k, params[k]); });
  const res = await fetch(`/api/suppliers/products/search?${query.toString()}`);
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Unable to fetch products.'); }
  const data = await res.json();
  return data.result;
}

async function toggleProductStatus(supplierId, productId, body = {}) {
  const res = await fetch(`/api/suppliers/${supplierId}/products/${productId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Unable to update status.'); }
  const data = await res.json();
  return data.result;
}

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

export default function ProductManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [filters, setFilters] = useState({ query: "", minPrice: "", maxPrice: "", deliveryDateTimes: "", isActive: "" });

  const loadProducts = useCallback(async (pageNumber, currentFilters) => {
    setLoading(true);
    try {
      const { query } = currentFilters;
      const size = 10;

      if (query && query.trim() !== "") {
        const [listA, listB] = await Promise.all([
          getProducts({ productId: query.trim(), page: 0, size: 50 }),
          getProducts({ supplierId: query.trim(), page: 0, size: 50 }),
        ]);
        const map = new Map();
        (listA?.content || []).forEach((it) => { if (it?.id) map.set(it.id, it); });
        (listB?.content || []).forEach((it) => { if (it?.id) map.set(it.id, it); });
        const merged = Array.from(map.values());
        const total = merged.length;
        const pages = Math.max(1, Math.ceil(total / size));
        const start = pageNumber * size;
        setProducts(merged.slice(start, start + size));
        setTotalPages(pages);
        setPage(pageNumber);
      } else {
        const params = {
          minPrice: currentFilters.minPrice !== "" ? currentFilters.minPrice : undefined,
          maxPrice: currentFilters.maxPrice !== "" ? currentFilters.maxPrice : undefined,
          deliveryDateTimes: currentFilters.deliveryDateTimes !== "" ? currentFilters.deliveryDateTimes : undefined,
          isActive: currentFilters.isActive === "" ? undefined : String(currentFilters.isActive) === "true",
          page: pageNumber,
          size,
        };
        const result = await getProducts(params);
        setProducts(result?.content || []);
        setTotalPages(result?.totalPages || 0);
        setPage(pageNumber);
      }
    } catch (err) {
      console.error(err);
      setProducts([]);
      setTotalPages(0);
      setPage(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadProducts(0, filters); }, [loadProducts]);

  const handleSearch = () => loadProducts(0, filters);
  const handleReset = () => setFilters((prev) => ({ ...prev, minPrice: "", maxPrice: "", deliveryDateTimes: "", isActive: "" }));

  const handleToggleStatus = async (supplierId, productId, currentStatus) => {
    const actionText = currentStatus ? "Disable" : "Enable";
    if (!window.confirm(`Are you sure you want to ${actionText} this product?`)) return;
    try {
      await toggleProductStatus(supplierId, productId, { isActive: !currentStatus });
      alert("Status updated successfully!");
      loadProducts(page, filters);
    } catch (error) {
      alert(error.message || "Failed to update status");
    }
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Product Management</h1>
      </div>

      <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl shadow-sm border border-blue-200 mt-4">
        <input
          type="text"
          value={filters.query || ""}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          placeholder="Search by productId or supplierId..."
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button onClick={handleSearch} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">Search</button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-center">
          <input type="number" placeholder="Min Price" value={filters.minPrice} onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })} className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none" />
          <input type="number" placeholder="Max Price" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none" />
          <input type="number" placeholder="Delivery Days" value={filters.deliveryDateTimes} onChange={(e) => setFilters({ ...filters, deliveryDateTimes: e.target.value })} className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none" />
          <select value={filters.isActive} onChange={(e) => setFilters({ ...filters, isActive: e.target.value })} className="h-10 px-3 rounded-lg border border-gray-300 text-sm outline-none bg-white">
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <div className="flex justify-end gap-2">
            <button onClick={handleSearch} className="rounded-lg bg-blue-600 px-5 py-2 text-sm text-white">Search</button>
            <button onClick={handleReset} className="rounded-lg border border-gray-300 px-5 py-2 text-sm text-gray-700">Reset</button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm mt-4">
        <div className="overflow-x-auto">
          <table className="min-w-full whitespace-nowrap">
            <thead className="bg-gray-50 text-sm font-semibold text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left">ProductId</th>
                <th className="px-5 py-3 text-left">SupplierId</th>
                <th className="px-5 py-3 text-left">Price</th>
                <th className="px-5 py-3 text-left">Delivery Days</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">No products found</td></tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{p.productId}</td>
                    <td className="px-5 py-3 text-gray-600">{p.supplierId}</td>
                    <td className="px-5 py-3 text-gray-600">{formatPrice(p.price)}</td>
                    <td className="px-5 py-3 text-gray-600">{p.deliveryDateTimes ?? "-"}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => navigate(isAdmin ? `/admin/products/${p.productId}` : `/supplier/products/${p.productId}`)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50">
                          <Eye className="w-4 h-4" /> Detail
                        </button>
                        <button onClick={() => navigate(isAdmin ? `/admin/products/update/${p.productId}` : `/supplier/products/update/${p.productId}`)} className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700 hover:bg-amber-100">
                          <Edit className="w-4 h-4" /> Edit
                        </button>
                        <button onClick={() => handleToggleStatus(p.supplierId, p.productId, p.isActive)} className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-sm font-medium transition-colors ${p.isActive ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"}`}>
                          {p.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          {p.isActive ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between gap-3 p-4">
          <div />
          <div className="flex items-center gap-3">
            <button disabled={page === 0} onClick={() => { if (page > 0) loadProducts(page - 1, filters); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
            <span className="text-sm font-medium text-gray-600">Page {totalPages === 0 ? 0 : page + 1} / {totalPages}</span>
            <button disabled={page + 1 >= totalPages || totalPages === 0} onClick={() => { if (page + 1 < totalPages) loadProducts(page + 1, filters); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
