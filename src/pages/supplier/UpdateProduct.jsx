import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById } from "../../services/productService";
import { updateSupplierProduct } from "../../services/supplierService";
import { ArrowLeft, Save, X } from "lucide-react";

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
        isActive: true
    });

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const data = await getProductById(id);
                if (!data) throw new Error("Không tìm thấy sản phẩm!");
                
                setSupplierId(data.supplierId);
                setFormData({
                    price: data.price || "",
                    deliveryDateTimes: data.deliveryDateTimes || "",
                    isActive: data.isActive
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const payload = {
                price: Number(formData.price),
                deliveryDateTimes: Number(formData.deliveryDateTimes),
                isActive: formData.isActive
            };

            await updateSupplierProduct(supplierId, id, payload);
            
            alert("Cập nhật sản phẩm thành công!");
            navigate(-1); 
        } catch (err) {
            alert(err.message || "Đã xảy ra lỗi khi cập nhật.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Đang tải dữ liệu...</div>;
    if (error) return <div className="p-10 text-center text-red-500">Lỗi: {error}</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Cập nhật Sản Phẩm</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-amber-50 p-6 border-b border-gray-200">
                    <p className="text-amber-800 font-medium">Đang chỉnh sửa mã SP: <span className="font-bold text-amber-900">{id}</span></p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Input Giá */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Đơn giá (VND)</label>
                        <input
                            type="number"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            required
                            min="0"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                            placeholder="Nhập giá sản phẩm..."
                        />
                    </div>

                    {/* Input Ngày giao hàng */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian giao hàng dự kiến (Ngày)</label>
                        <input
                            type="number"
                            name="deliveryDateTimes"
                            value={formData.deliveryDateTimes}
                            onChange={handleChange}
                            required
                            min="0"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                            placeholder="Ví dụ: 3"
                        />
                    </div>

                    {/* Checkbox Trạng thái */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <input
                            type="checkbox"
                            name="isActive"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                            className="w-5 h-5 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-900 cursor-pointer">
                            Cho phép kinh doanh (Active)
                        </label>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <button 
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-6 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                        <X className="w-4 h-4" /> Hủy bỏ
                    </button>
                    <button 
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" /> 
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </div>
            </form>
        </div>
    );
}