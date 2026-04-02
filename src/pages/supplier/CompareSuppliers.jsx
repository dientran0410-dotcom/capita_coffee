import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Medal, Package, Clock, DollarSign, Star } from 'lucide-react';
import { compareSuppliers } from '../../services/supplierService';

export default function CompareSuppliers() {
    const { productId } = useParams();
    const [rankingList, setRankingList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchComparison = async () => {
            try {
                setLoading(true);
                const data = await compareSuppliers(productId);
                setRankingList(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchComparison();
        }
    }, [productId]);

    // Hàm render icon huy chương theo thứ hạng
    const renderMedal = (index) => {
        if (index === 0) return <Trophy className="h-6 w-6 text-yellow-500" />; // Top 1: Cúp vàng
        if (index === 1) return <Medal className="h-6 w-6 text-gray-400" />;    // Top 2: Huy chương bạc
        if (index === 2) return <Medal className="h-6 w-6 text-amber-600" />;   // Top 3: Huy chương đồng
        return <span className="font-bold text-gray-400">#{index + 1}</span>;   // Các top sau
    };

    return (
        <div className="max-w-6xl space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => window.history.back()}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Compare Suppliers</h1>
                    <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                        <Package className="h-4 w-4" /> Product ID: <span className="font-semibold text-blue-600">{productId}</span>
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="p-10 text-center text-gray-500">Loading comparison data...</div>
            ) : error ? (
                <div className="p-10 text-center text-red-500">Error: {error}</div>
            ) : rankingList.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
                    No active suppliers found for this product.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-1">
                    {rankingList.map((item, index) => (
                        <div 
                            key={item.supplierId} 
                            className={`flex flex-col md:flex-row items-center justify-between rounded-xl border p-5 shadow-sm transition-all hover:shadow-md ${
                                index === 0 ? 'border-yellow-400 bg-yellow-50/30' : 'border-gray-200 bg-white'
                            }`}
                        >
                            <div className="flex w-full md:w-1/3 items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                                    {renderMedal(index)}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        <Link to={`/suppliers/${item.supplierId}`} className="hover:text-blue-600 hover:underline">
                                            {item.supplierName}
                                        </Link>
                                    </h3>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                        <span>{item.rating || 'N/A'} Rating</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex w-full md:mt-0 md:w-2/3 justify-around border-t border-gray-100 pt-4 md:border-none md:pt-0">
                                <div className="text-center">
                                    <p className="flex items-center justify-center gap-1 text-xs font-medium uppercase text-gray-500">
                                        <DollarSign className="h-4 w-4" /> Price
                                    </p>
                                    <p className="mt-1 text-lg font-bold text-gray-900">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="flex items-center justify-center gap-1 text-xs font-medium uppercase text-gray-500">
                                        <Clock className="h-4 w-4" /> Delivery
                                    </p>
                                    <p className="mt-1 text-lg font-bold text-gray-900">{item.deliveryDateTimes} days</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-medium uppercase text-gray-500">Rec. Score</p>
                                    <p className={`mt-1 text-2xl font-black ${
                                        item.recommendationScore >= 80 ? 'text-green-600' : 
                                        item.recommendationScore >= 50 ? 'text-amber-500' : 'text-red-500'
                                    }`}>
                                        {item.recommendationScore.toFixed(1)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}