import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById } from "../../services/productService";
import { ArrowLeft, Package, CheckCircle, Ban, DollarSign, Clock } from "lucide-react";

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const data = await getProductById(id);
                if (!data) throw new Error("Không tìm thấy sản phẩm!");
                setProduct(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const formatPrice = (value) => 
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);

    if (loading) return <div className="p-10 text-center text-gray-500">Đang tải thông tin sản phẩm...</div>;
    if (error) return <div className="p-10 text-center text-red-500">Lỗi: {error}</div>;
    if (!product) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Chi tiết sản phẩm</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-3 rounded-lg text-white">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Mã SP: {product.productId}</h2>
                            <p className="text-sm text-gray-500">Thuộc Nhà cung cấp: <span className="font-semibold">{product.supplierId}</span></p>
                        </div>
                    </div>
                    <div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${
                            product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                            {product.isActive ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                            {product.isActive ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}
                        </span>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <DollarSign className="w-5 h-5 text-amber-500" />
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Đơn giá</p>
                                <p className="text-lg font-bold text-gray-900">{formatPrice(product.price)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                            <Clock className="w-5 h-5 text-blue-500" />
                            <div>
                                <p className="text-sm text-gray-500 font-medium">Thời gian giao hàng (Dự kiến)</p>
                                <p className="text-lg font-bold text-gray-900">{product.deliveryDateTimes ? `${product.deliveryDateTimes} ngày` : 'Chưa cập nhật'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 h-full">
                            <p className="text-sm text-gray-500 font-medium mb-2">Thông tin hệ thống</p>
                            <div className="space-y-2 text-sm">
                                <p className="flex justify-between"><span className="text-gray-500">ID Hệ thống:</span> <span className="font-mono text-gray-900">{product.id}</span></p>
                                <p className="flex justify-between"><span className="text-gray-500">Ngày tạo:</span> <span className="font-medium text-gray-900">{product.createAt ? new Date(product.createAt).toLocaleDateString("vi-VN") : '-'}</span></p>
                                <p className="flex justify-between"><span className="text-gray-500">Cập nhật lần cuối:</span> <span className="font-medium text-gray-900">{product.updateAt ? new Date(product.updateAt).toLocaleDateString("vi-VN") : '-'}</span></p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <button 
                        onClick={() => navigate(-1)}
                        className="px-6 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                    >
                        Đóng
                    </button>
                    {/* Chuyển hướng sang trang Edit tương ứng theo quyền đang đứng trên URL */}
                    <button 
                        onClick={() => navigate(`../update/${product.productId}`, { relative: "path" })}
                        className="px-6 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors"
                    >
                        Chỉnh sửa
                    </button>
                </div>
            </div>
        </div>
    );
}