import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, DollarSign, Clock, CheckCircle, Ban } from "lucide-react";

async function getProductById(id) {
  const res = await fetch(`/api/suppliers/products/search?productId=${id}`);
  if (!res.ok) throw new Error('Unable to fetch product.');
  const data = await res.json();
  return data.result?.content?.length > 0 ? data.result.content[0] : null;
}

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id);
        setProduct(data);
      } catch (err) {
        setError(err.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading product data...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
  if (!product) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Product Detail</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Product ID</p>
              <p className="text-xl font-bold font-mono text-gray-900 mt-1">{product.productId}</p>
              <p className="text-sm text-gray-500 mt-1">Supplier: <span className="font-medium text-gray-700">{product.supplierId}</span></p>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${product.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {product.isActive ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
              {product.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <DollarSign className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-sm text-gray-500 font-medium">Unit Price</p>
                <p className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500 font-medium">Delivery Time (Estimated)</p>
                <p className="text-lg font-bold text-gray-900">{product.deliveryDateTimes ? `${product.deliveryDateTimes} days` : "Not set"}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 h-full">
              <p className="text-sm text-gray-500 font-medium mb-2">System Info</p>
              <div className="space-y-2 text-sm">
                <p className="flex justify-between"><span className="text-gray-500">System ID:</span> <span className="font-mono text-gray-900">{product.id}</span></p>
                <p className="flex justify-between"><span className="text-gray-500">Created:</span> <span className="font-medium text-gray-900">{product.createAt ? new Date(product.createAt).toLocaleDateString("vi-VN") : "-"}</span></p>
                <p className="flex justify-between"><span className="text-gray-500">Last Updated:</span> <span className="font-medium text-gray-900">{product.updateAt ? new Date(product.updateAt).toLocaleDateString("vi-VN") : "-"}</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={() => navigate(-1)} className="px-6 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-100 transition-colors">
            Close
          </button>
          <button onClick={() => navigate(`../update/${product.productId}`, { relative: "path" })} className="px-6 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors">
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
