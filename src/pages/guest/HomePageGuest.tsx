import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Star, ShoppingCart } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './guestToastStyles.css';
import { getProducts, getProductById, getProductVariants, type Product, type ProductVariant } from '@/services/productService';
import { ProductsLoading } from '@/components/common/ProductsLoading';

// Mock products array removed - using API instead
const ALL_CATEGORY = 'Tất cả';
const categoryIcon = {
    'Cà phê': <span className="material-symbols-outlined text-sm">coffee</span>,
    'Trà': <span className="material-symbols-outlined text-sm">eco</span>,
    'Sinh tố': <span className="material-symbols-outlined text-sm">local_drink</span>,
    'Đá xay': <span className="material-symbols-outlined text-sm">ac_unit</span>,
};
const categoryColor = {
    'Cà phê': 'bg-emerald-50 text-emerald-700',
    'Trà': 'bg-green-50 text-green-700',
    'Sinh tố': 'bg-pink-50 text-pink-700',
    'Đá xay': 'bg-blue-50 text-blue-700',
};

const normalizedCategoryKeys = ['Cà phê', 'Trà', 'Sinh tố', 'Đá xay'];

const normalizeCategory = (rawCategory: any) => {
    if (!rawCategory) return normalizedCategoryKeys[0];
    if (normalizedCategoryKeys.includes(rawCategory)) return rawCategory;
    const lower = String(rawCategory).toLowerCase();
    if (lower.includes('tea') || lower.includes('tra')) return 'Trà';
    if (lower.includes('smoothie') || lower.includes('sinh')) return 'Sinh tố';
    if (lower.includes('ice') || lower.includes('blend') || lower.includes('xay')) return 'Đá xay';
    if (lower.includes('coffee') || lower.includes('ca phe')) return 'Cà phê';
    return normalizedCategoryKeys[0];
};
// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, onClick }) {
    const color = categoryColor[product.category];
    return (
        <button
            onClick={onClick}
            className="group text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
        >
            {/* Placeholder image area */}
            <div className="relative h-44 bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center overflow-hidden">
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                ) : (
                    <span className="material-symbols-outlined text-6xl text-emerald-300 group-hover:text-emerald-400 transition-colors">
                        coffee
                    </span>
                )}
                {product.tag && (
                    <span className="absolute top-3 left-3 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                        {product.tag}
                    </span>
                )}
                {product.hot && (
                    <span className="absolute top-3 right-3 flex items-center gap-0.5 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                        <span className="material-symbols-outlined text-sm">local_fire_department</span>
                        Hot
                    </span>
                )}
            </div>
            <div className="p-4">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
                    {categoryIcon[product.category]}
                    {product.category}
                </span>

                <h3 className="mt-2 text-base font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors font-headline">
                    {product.name}
                </h3>

                <p className="mt-1 text-sm text-gray-500 line-clamp-2 font-body">{product.description}</p>

                <div className="mt-3 flex items-center justify-between">
                    <div>
                        <span className="text-lg font-bold text-emerald-700 font-headline">
                            {product.price.toLocaleString('vi-VN')}đ
                        </span>
                        {!!product.originalPrice && (
                            <span className="ml-2 text-sm text-gray-400 line-through">
                                {product.originalPrice.toLocaleString('vi-VN')}đ
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-gray-700">{Number(product?.rating ?? 0) || '-'}</span>
                        <span>({Number(product?.reviews ?? 0).toLocaleString()})</span>
                    </div>
                </div>
            </div>
        </button>
    );
}
// ── Product Detail Modal ──────────────────────────────────────────────────────
function ProductModal({ product, onClose, onOrder, onAddToCart }) {
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [quantity, setQuantity] = useState(1);
    const currentPrice = (selectedVariant?.price ?? (product?.price ?? 0));
    const totalPrice = currentPrice;

    if (!product) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <button aria-label="Close modal" className="absolute inset-0 w-full h-full cursor-default" onClick={onClose} />
                <dialog open className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-0 border-0">
                    <div className="h-52 bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center relative overflow-hidden">
                        {product.imageUrl ? (
                            <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            />
                        ) : (
                            <span className="material-symbols-outlined text-8xl text-emerald-300">coffee</span>
                        )}
                        {(product as any).tag && (
                            <span className="absolute top-4 left-4 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                                {(product as any).tag}
                            </span>
                        )}
                        <button onClick={onClose} className="absolute top-4 right-4 rounded-full bg-white/80 p-1.5 hover:bg-white transition-colors">
                            <X className="w-5 h-5 text-gray-700" />
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColor[product.category]}`}>
                                    {categoryIcon[product.category]}
                                    {product.category}
                                </span>
                                <h2 className="mt-2 text-2xl font-bold text-gray-900 font-headline">{product.name}</h2>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-2xl font-bold text-emerald-700 font-headline">{totalPrice.toLocaleString('vi-VN')}đ</p>
                                {!!product.originalPrice && <p className="text-sm text-gray-400 line-through">{product.originalPrice.toLocaleString('vi-VN')}đ</p>}
                            </div>
                        </div>

                        <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className={`w-4 h-4 ${s <= Math.round((product as any).rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                            ))}
                            <span className="font-medium text-gray-700">{(product as any).rating ?? '-'}</span>
                        </div>

                        <p className="mt-4 text-sm text-gray-600 leading-relaxed font-body">{product.description || ''}</p>

                        <div className="mt-6 space-y-3">
                            <button
                                onClick={() => onAddToCart?.(product, null, quantity)}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 text-emerald-700 font-semibold py-3 hover:bg-emerald-50 transition-colors font-headline"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                Thêm vào giỏ hàng
                            </button>
                            <button
                                onClick={() => onOrder?.(product, null, quantity)}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 transition-colors font-headline"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                Đặt ngay
                            </button>
                            <button onClick={onClose} className="w-full rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors font-body">
                                Quay lại
                            </button>
                        </div>
                    </div>
                </dialog>
            </div>
        </>
    );
}
// ── Page ──────────────────────────────────────────────────────────────────────

export default function GuestPage() {
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
    const [products, setProducts] = useState<Product[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState<string | null>(null);

    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        let retryTimeout: ReturnType<typeof setTimeout> | null = null;

        const shouldRetry = (err: any) => {
            const status = Number(err?.status ?? err?.response?.status);
            const msg = String(err?.message ?? "").toLowerCase();
            const name = String(err?.name ?? "").toLowerCase();

            const isServer = Number.isFinite(status) && status >= 500;
            const isRateLimited = status === 429;
            const isTimeout =
                name.includes("abort") || msg.includes("timeout") || msg.includes("timed out") || msg.includes("aborted");
            const isNetwork =
                status === 0 ||
                (!Number.isFinite(status) &&
                    (msg.includes("network") ||
                        msg.includes("failed to fetch") ||
                        msg.includes("load failed") ||
                        msg.includes("khong the ket noi") ||
                        msg.includes("ket noi") ||
                        msg.includes("kết nối")));

            return isServer || isRateLimited || isTimeout || isNetwork;
        };

        const loadProducts = async (attempt = 1, maxAttempts = 4) => {
            let scheduledRetry = false;
            setListLoading(true);
            setListError(null);

            try {
                const resp: any = await getProducts({ page: 0, size: 100, status: 'ACTIVE' });

                // Some http clients wrap responses, so be defensive.
                const rawContent = resp?.content ?? resp?.data?.content ?? resp?.payload?.content;
                const items = Array.isArray(rawContent) ? rawContent : [];

                const mapped = items.map((p: any) => ({
                    ...p,
                    id: String(p?.id ?? ''),
                    name: p?.name || '',
                    description: p?.description || '',
                    category: normalizeCategory(p?.categoryName || p?.category),
                    price: Number(p?.price ?? 0),
                    rating: Number(p?.rating ?? 4.8),
                    reviews: Number(p?.reviews ?? 0),
                    originalPrice: p?.originalPrice ? Number(p.originalPrice) : undefined,
                    imageUrl: p?.imageUrl || null,  // ✅ thêm dòng này
                }));

                if (!cancelled) {
                    setProducts(mapped);
                    if (mapped.length === 0) {
                        setListError('Không có sản phẩm để hiển thị.');
                    }
                }
            } catch (err: any) {
                if (cancelled) return;

                if (attempt < maxAttempts && shouldRetry(err)) {
                    const delay = Math.min(1200 * Math.pow(2, attempt - 1), 6000);
                    scheduledRetry = true;

                    if (attempt === 1) {
                        toast.warning('⚠️ Không thể tải sản phẩm, đang thử kết nối lại...', {
                            position: 'top-right',
                            autoClose: 2500,
                        });
                    }

                    retryTimeout = setTimeout(() => loadProducts(attempt + 1, maxAttempts), delay);
                    return;
                }

                setListError(err instanceof Error ? err.message : 'Không thể tải sản phẩm');
            } finally {
                if (!cancelled && !scheduledRetry) {
                    setListLoading(false);
                }
            }
        };

        loadProducts();

        return () => {
            cancelled = true;
            if (retryTimeout) clearTimeout(retryTimeout);
        };
    }, []);

    useEffect(() => {
        if (!selectedProductId) return;
        const loadDetail = async () => {
            setDetailLoading(true);
            setDetailError(null);
            try {
                const [prod, variants] = await Promise.all([
                    getProductById(String(selectedProductId)),
                    getProductVariants(String(selectedProductId)),
                ]);
                const withVariants = prod ? ({
                    ...prod,
                    variants,
                    category: normalizeCategory((prod as any)?.categoryName || (prod as any)?.category),
                    price: Number((prod as any)?.price ?? 0),
                    rating: Number((prod as any)?.rating ?? 4.8),
                    reviews: Number((prod as any)?.reviews ?? 0),
                    originalPrice: (prod as any)?.originalPrice ? Number((prod as any).originalPrice) : undefined,
                }) : null;
                setSelectedProduct(withVariants as any);
            } catch (err) {
                setDetailError(err instanceof Error ? err.message : 'Không thể tải chi tiết sản phẩm');
            } finally {
                setDetailLoading(false);
            }
        };
        loadDetail();
    }, [selectedProductId]);

    const handleAddToCart = (product, size, quantity) => {
        // Redirect guest to login page
        toast.info("🔐 Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng", {
            position: "top-right",
            autoClose: 3000,
        });

        // Short delay before redirect for better UX
        setTimeout(() => {
            navigate('/login', {
                state: {
                    from: '/guest',
                    message: 'Đăng nhập để thêm sản phẩm vào giỏ hàng'
                }
            });
        }, 1000);
    };

    const handleOrder = (product, size, quantity) => {
        // Redirect guest to login page
        toast.info("🔐 Vui lòng đăng nhập để đặt hàng", {
            position: "top-right",
            autoClose: 3000,
        });

        // Short delay before redirect for better UX
        setTimeout(() => {
            navigate('/login', {
                state: {
                    from: '/guest',
                    message: 'Đăng nhập để đặt hàng sản phẩm'
                }
            });
        }, 1000);
    };

    const categories = useMemo(() => {
        const setCats = new Set(products.map((p: any) => p?.category).filter(Boolean));
        return [ALL_CATEGORY, ...Array.from(setCats as any)];
    }, [products]);

    const filtered = activeCategory === ALL_CATEGORY
        ? products
        : products.filter((p: any) => p?.category === activeCategory);

    return (
        <div className="bg-surface text-on-surface flex flex-col min-h-screen">
            {/* Top Navigation Bar */}
            <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md shadow-sm">
                <div className="flex justify-between items-center px-6 py-4 max-w-screen-2xl mx-auto">
                    <div className="text-xl font-bold tracking-tighter text-emerald-900 font-headline">
                        Capital Coffee
                    </div>
                    <div className="hidden md:flex items-center gap-8 font-headline font-medium text-sm tracking-tight">
                        <button
                            type="button"
                            onClick={() => navigate('/home')}
                            className="text-slate-600 hover:text-emerald-900 transition-colors"
                        >
                            Trang chủ
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/about')}
                            className="text-slate-600 hover:text-emerald-900 transition-colors"
                        >
                            Giới thiệu
                        </button>
                        {/* <button className="text-slate-600 hover:text-emerald-900 transition-colors">
                            Dashboard
                        </button> */}
                        {/* <button className="text-slate-600 hover:text-emerald-900 transition-colors">
                            Subscription
                        </button> */}
                    </div>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate("/cart")}
                            className="text-emerald-900 transition-opacity hover:opacity-80 active:scale-95 duration-200"
                        >
                            <span className="material-symbols-outlined">shopping_bag</span>
                        </button>
                        <button
                            onClick={() => navigate("/login")}
                            className="text-emerald-900 transition-opacity hover:opacity-80 active:scale-95 duration-200"
                        >
                            <span className="material-symbols-outlined">person</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-28 pb-20 min-h-screen w-full">
                <div className="max-w-screen-2xl mx-auto px-6">
                    {/* Header */}
                    {/* <header className="mb-12 text-center md:text-left">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-on-surface mb-2 font-headline">
                            Menu
                        </h1>
                        <p className="font-label text-sm uppercase tracking-[0.2em] text-on-surface-variant font-medium">
                            Our Heritage Coffee Collection
                        </p>
                    </header> */}

                    {/* Product list */}
                    <section className="space-y-8">

                        {/* Guest Info Notice */}
                        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-blue-600">info</span>
                                <div>
                                    <h3 className="text-sm font-semibold text-blue-900 font-headline">
                                        Chế độ xem khách
                                    </h3>
                                    <p className="text-xs text-blue-700 font-body">
                                        Để thêm sản phẩm vào giỏ hàng và đặt mua, vui lòng{' '}
                                        <button
                                            onClick={() => navigate('/login')}
                                            className="underline hover:no-underline font-semibold"
                                        >
                                            đăng nhập
                                        </button>
                                        {' '}hoặc{' '}
                                        <button
                                            onClick={() => navigate('/register')}
                                            className="underline hover:no-underline font-semibold"
                                        >
                                            đăng ký tài khoản
                                        </button>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Category filter */}
                        <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors font-headline ${activeCategory === cat
                                                ? 'bg-emerald-600 text-white shadow-sm'
                                                : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-700'
                                            }`}
                                    >
                                        {cat !== ALL_CATEGORY && categoryIcon[cat]}
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cart preview - Hidden for guest users who need to login */}
                        {/* Guest users are redirected to login instead of using cart */}

                        {/* Grid */}
                        {listLoading && <ProductsLoading />}

                        {!listLoading && listError && (
                            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-red-700 text-sm">
                                {listError}
                            </div>
                        )}

                        {!listLoading && !listError && (
                            filtered.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-8 text-center text-sm text-gray-500">
                                    Không có sản phẩm trong danh mục này.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {filtered.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            onClick={() => {
                                                setSelectedProductId(String(product.id));
                                                setSelectedProduct(null);
                                            }}
                                        />
                                    ))}
                                </div>
                            )
                        )}
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full bg-slate-100 mt-auto">
                <div className="flex flex-col md:flex-row justify-between items-center px-12 py-16 gap-8 w-full max-w-screen-2xl mx-auto">
                    <div className="text-lg font-black text-emerald-900 uppercase tracking-tighter font-headline">
                        Capital Coffee
                    </div>
                    <div className="flex flex-wrap justify-center gap-8 font-headline text-xs font-light uppercase tracking-widest">
                        <button className="text-slate-500 hover:text-emerald-700 transition-all">
                            Privacy Policy
                        </button>
                        <button className="text-slate-500 hover:text-emerald-700 transition-all">
                            Terms of Service
                        </button>
                        <button className="text-slate-500 hover:text-emerald-700 transition-all">
                            Shipping Info
                        </button>
                        <button className="text-slate-500 hover:text-emerald-700 transition-all">
                            Wholesale
                        </button>
                    </div>
                    <p className="text-slate-500 text-[10px] font-light uppercase tracking-widest font-label">
                        © 2026 Capital Coffee. Crafted for the modern professional.
                    </p>
                </div>
            </footer>

            {/* Detail modal */}
            {selectedProductId && (
                <ProductModal
                    product={selectedProduct as any}
                    onClose={() => { setSelectedProductId(null); setSelectedProduct(null); }}
                    onOrder={handleOrder}
                    onAddToCart={handleAddToCart}
                />
            )}

            {/* Toast Container */}
            <ToastContainer
                position="top-right"
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                style={{ zIndex: 9999 }}
            />
        </div>
    );
}
