import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Edit, Package, Filter, History } from "lucide-react";

async function getSupplierById(id) {
  const res = await fetch(`/api/suppliers/${id}`);
  if (!res.ok) throw new Error('Unable to fetch supplier details.');
  const data = await res.json();
  return data.result;
}

async function getProductsBySupplierId(supplierId, params = { page: 0, size: 10 }) {
  const query = new URLSearchParams();
  Object.keys(params).forEach((k) => { if (params[k] !== '' && params[k] != null) query.append(k, params[k]); });
  const res = await fetch(`/api/suppliers/${supplierId}/products?${query.toString()}`);
  if (!res.ok) throw new Error('Unable to fetch supplier products.');
  const data = await res.json();
  return data.result;
}

async function updateSupplierProduct(supplierId, productId, dataBody) {
  const res = await fetch(`/api/suppliers/${supplierId}/products/${productId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', USER: 'admin_user' },
    body: JSON.stringify(dataBody),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Update product failed.');
  return data.result;
}

export default function SupplierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filterActive, setFilterActive] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    const fetchSupplierAndProducts = async () => {
      try {
        const supplierData = await getSupplierById(id);
        setSupplier(supplierData);
        fetchProducts({ page: 0, size: 10, isActive: filterActive });
      } catch (err) {
        console.error("Fetch data failed:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSupplierAndProducts();
  }, [id]);

  const fetchProducts = async (params) => {
    try {
      const data = await getProductsBySupplierId(id, params);
      setProducts(data.content || []);
    } catch (error) {
      console.error("Fetch products failed:", error);
    }
  };

  const handleFilterChange = (e) => {
    const val = e.target.value;
    setFilterActive(val);
    fetchProducts({ page: 0, size: 10, isActive: val === "" ? null : val === "true" });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        price: editingProduct.price,
        deliveryDateTimes: editingProduct.deliveryDateTimes,
        isActive: editingProduct.isActive,
      };
      await updateSupplierProduct(id, editingProduct.id, updateData);
      fetchProducts({ page: 0, size: 10, isActive: filterActive });
      setIsEditModalOpen(false);
      alert("Update product successfully!");
    } catch (error) {
      alert(error.message);
    }
  };

  const renderStatus = (status) => {
    if (status === "APPROVED") return "bg-green-100 text-green-700";
    if (status === "PENDING") return "bg-amber-100 text-amber-700";
    if (status === "SUSPENDED") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  if (loading) return <div className="p-10 text-gray-500">Loading supplier detail...</div>;
  if (!supplier) return <div className="p-10 text-red-500">Supplier not found</div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/suppliers" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{supplier.name}</h1>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${renderStatus(supplier.status)}`}>
                {supplier.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">Supplier ID: {supplier.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/admin/suppliers/update/${supplier.id}`)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm">
            <Edit className="h-4 w-4" /> Edit Supplier
          </button>
          <button onClick={() => navigate(`/admin/suppliers/${id}/audit`)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 shadow-sm">
            <History className="h-4 w-4" /> View History
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">Product Quotations</h3>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select value={filterActive} onChange={handleFilterChange} className="rounded-lg border-gray-300 bg-gray-50 p-2 text-sm text-gray-700 outline-none focus:border-blue-500">
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-4 py-3 font-medium">Product ID</th>
                <th className="px-4 py-3 font-medium">Price (VND)</th>
                <th className="px-4 py-3 font-medium">Delivery</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/admin/suppliers/compare/${item.productId}`} className="flex items-center gap-2 text-blue-600 hover:underline">
                      {item.productId}{" "}
                      <span className="rounded bg-blue-50 px-1 py-0.5 text-[10px]">Compare</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.price)}
                  </td>
                  <td className="px-4 py-3">{item.deliveryDateTimes} days</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => { setEditingProduct(item); setIsEditModalOpen(true); }} className="text-gray-400 hover:text-blue-600">
                      <Edit className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold">Update Quotation</h3>
            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Price (VND)</label>
                <input type="number" className="mt-1 w-full rounded-lg border p-2" value={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium">Delivery (Days)</label>
                <input type="number" className="mt-1 w-full rounded-lg border p-2" value={editingProduct.deliveryDateTimes} onChange={(e) => setEditingProduct({ ...editingProduct, deliveryDateTimes: e.target.value })} required />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={editingProduct.isActive} onChange={(e) => setEditingProduct({ ...editingProduct, isActive: e.target.checked })} />
                <label htmlFor="isActive">Active for sale</label>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
