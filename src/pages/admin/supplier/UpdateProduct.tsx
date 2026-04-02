import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Save, X } from "lucide-react";

async function getProductById(id) {
  const res = await fetch(`/api/suppliers/products/search?productId=${id}`);
  if (!res.ok) throw new Error('Unable to fetch product.');
  const data = await res.json();
  return data.result?.content?.length > 0 ? data.result.content[0] : null;
}

async function updateProduct(supplierId, productId, updateData) {
  const res = await fetch(`/api/suppliers/${supplierId}/products/${productId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.message || 'Kh�ng th? c?p nh?t s?n ph?m.'); }
  const data = await res.json();
  return data.result;
}

export default function UpdateProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [supplierId, setSupplierId] = useState(null);

  const [formData, setFormData] = useState({
    price: "",
    deliveryDateTimes: "",
    isActive: true,
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id);
        setSupplierId(data.supplierId);
        setFormData({
          price: data.price ?? "",
          deliveryDateTimes: data.deliveryDateTimes ?? "",
          isActive: data.isActive ?? true,
        });
      } catch (err) {
        setError(err.message || "Failed to load product data");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        price: formData.price,
        deliveryDateTimes: formData.deliveryDateTimes,
        isActive: formData.isActive,
      };
      await updateProduct(supplierId, id, payload);
      alert("Product updated successfully!");
      navigate(-1);
    } catch (err) {
      alert(err.message || "An error occurred while updating.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading product data...</div>;
  if (error) return <div className="p-10 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Update Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-amber-50 p-6 border-b border-gray-200">
          <p className="text-amber-800 font-medium">Editing product ID: <span className="font-bold text-amber-900">{id}</span></p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Unit Price (VND)</label>
            <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" placeholder="Enter product price..." className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery Time (Days)</label>
            <input type="number" name="deliveryDateTimes" value={formData.deliveryDateTimes} onChange={handleChange} required min="0" placeholder="e.g. 3" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" />
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <input type="checkbox" name="isActive" id="isActive" checked={formData.isActive} onChange={handleChange} className="w-5 h-5 text-amber-600 rounded border-gray-300 focus:ring-amber-500" />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-900 cursor-pointer">Allow for sale (Active)</label>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-100 flex items-center gap-2">
            <X className="w-4 h-4" /> Cancel
          </button>
          <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
