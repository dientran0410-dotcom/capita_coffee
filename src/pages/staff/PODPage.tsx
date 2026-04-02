import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Star } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../customer/toastStyles.css';
import { useAuth } from '../../context/AuthContext';
import { getProductById, getProducts, getProductVariants } from '../../services/productService';
import CartService from '../../services/CartService';
import invoiceService from '../../services/InvoiceService';
import MomoService from '../../services/MomoService';
import type { CartResponse, CartItemResponse } from '../../types/Cart';
import { extractUserId } from '../../utils/authHelpers';
import { ProductsLoading } from '@/components/common/ProductsLoading';
import CustomerModal from '@/components/staff/CustomerModal';

// Pagination Component
interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPreviousPage: () => void;
    onNextPage: () => void;
    totalItems: number;
    itemsPerPage: number;
}

function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    onPreviousPage,
    onNextPage,
    totalItems,
    itemsPerPage
}: PaginationProps) {
    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages: number[] = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            // If total pages is small, show all pages
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push(-1); // Ellipsis indicator
            }

            // Show current page and neighbors
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) {
                    pages.push(i);
                }
            }

            if (currentPage < totalPages - 2) {
                pages.push(-2); // Ellipsis indicator
            }

            // Always show last page
            if (!pages.includes(totalPages)) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const startItem = ((currentPage - 1) * itemsPerPage) + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    if (totalPages <= 1) return null;

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 px-4">
            {/* Results info */}
            <div className="text-sm text-gray-600 font-body">
                Hiển thị <span className="font-semibold text-gray-900">{startItem}-{endItem}</span> của{' '}
                <span className="font-semibold text-gray-900">{totalItems}</span> sản phẩm
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-2">
                {/* Previous button */}
                <button
                    onClick={onPreviousPage}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 transition-all font-label"
                >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                    <span className="hidden sm:block">Trước</span>
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => {
                        if (page === -1 || page === -2) {
                            return (
                                <span
                                    key={`ellipsis-${index}`}
                                    className="px-3 py-2 text-sm text-gray-400 font-label"
                                >
                                    ...
                                </span>
                            );
                        }

                        return (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all font-label ${
                                    currentPage === page
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                {page}
                            </button>
                        );
                    })}
                </div>

                {/* Next button */}
                <button
                    onClick={onNextPage}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 transition-all font-label"
                >
                    <span className="hidden sm:block">Tiếp</span>
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
            </div>
        </div>
    );
}

const fallbackProducts = [
    {
        id: 1,
        name: 'Cà Phê Sữa Đá',
        category: 'Cà phê',
        supplierId: 'supplier-01',
        price: 39000,
        rating: 4.8,
        reviews: 1240,
        description: 'Cà phê robusta pha phin truyền thống, kết hợp sữa đặc ngọt ngào trên nền đá lạnh giòn. Vị đắng đậm đà hòa quyện với vị ngọt béo tạo nên hương vị đặc trưng không thể nhầm lẫn.',
        ingredients: ['Cà phê robusta', 'Sữa đặc', 'Đá viên'],
        sizes: [{ label: 'S', extra: 0 }, { label: 'M', extra: 5000 }, { label: 'L', extra: 10000 }],
        tag: 'Bán chạy',
        hot: true,
    },
    {
        id: 2,
        name: 'Bạc Xỉu',
        category: 'Cà phê',
        supplierId: 'supplier-01',
        price: 35000,
        rating: 4.7,
        reviews: 980,
        description: 'Ly bạc xỉu Nam Bộ cổ điển – cà phê nhạt, nhiều sữa đặc và sữa tươi, ngọt dịu thích hợp cho người mới bắt đầu uống cà phê.',
        ingredients: ['Cà phê', 'Sữa đặc', 'Sữa tươi', 'Đá viên'],
        sizes: [{ label: 'S', extra: 0 }, { label: 'M', extra: 5000 }, { label: 'L', extra: 10000 }],
    },
    {
        id: 3,
        name: 'Americano',
        category: 'Cà phê',
        supplierId: 'supplier-01',
        price: 45000,
        rating: 4.6,
        reviews: 756,
        description: 'Espresso pha loãng với nước nóng, giữ nguyên hương thơm và vị đắng nhẹ, thanh khoáng. Lựa chọn lý tưởng cho người yêu cà phê thuần túy.',
        ingredients: ['Espresso', 'Nước lọc'],
        sizes: [{ label: 'S', extra: 0 }, { label: 'M', extra: 5000 }, { label: 'L', extra: 10000 }],
    },
    {
        id: 4,
        name: 'Caramel Macchiato',
        category: 'Cà phê',
        supplierId: 'supplier-02',
        price: 65000,
        originalPrice: 75000,
        rating: 4.9,
        reviews: 1543,
        description: 'Espresso đậm đà kết hợp sữa hấp mịn và sốt caramel thơm ngọt. Mỗi ngụm là sự hòa quyện hoàn hảo giữa đắng và ngọt, giữa nóng và lạnh.',
        ingredients: ['Espresso', 'Sữa hấp', 'Sốt caramel', 'Vanilla syrup'],
        sizes: [{ label: 'M', extra: 0 }, { label: 'L', extra: 10000 }, { label: 'XL', extra: 20000 }],
        tag: 'Khuyến mãi',
        hot: true,
    },
    {
        id: 5,
        name: 'Trà Đào Cam Sả',
        category: 'Trà',
        supplierId: 'supplier-03',
        price: 55000,
        rating: 4.7,
        reviews: 2100,
        description: 'Trà xanh thượng hạng pha lạnh với đào tươi, cam mật và sả thơm, điểm thêm hạt chia mát lạnh. Thanh mát – ngọt dịu – thơm tự nhiên.',
        ingredients: ['Trà xanh', 'Đào tươi', 'Cam mật', 'Sả', 'Hạt chia', 'Đá viên'],
        sizes: [{ label: 'M', extra: 0 }, { label: 'L', extra: 10000 }],
        tag: 'Mới',
    },
    {
        id: 6,
        name: 'Trà Sữa Trân Châu',
        category: 'Trà',
        supplierId: 'supplier-03',
        price: 55000,
        rating: 4.8,
        reviews: 3200,
        description: 'Trà đen Assam đậm vị pha cùng sữa tươi nguyên kem, thêm trân châu đen dai ngon. Cổ điển mà không bao giờ lỗi thời.',
        ingredients: ['Trà đen Assam', 'Sữa tươi nguyên kem', 'Trân châu đen', 'Đường đen'],
        sizes: [{ label: 'M', extra: 0 }, { label: 'L', extra: 10000 }, { label: 'XL', extra: 20000 }],
        hot: true,
    },
    {
        id: 7,
        name: 'Matcha Latte',
        category: 'Trà',
        supplierId: 'supplier-03',
        price: 60000,
        rating: 4.6,
        reviews: 890,
        description: 'Bột matcha Uji Nhật Bản grade A đánh tan cùng sữa hấp mịn. Vị đắng nhẹ của matcha hòa quyện với sữa béo tạo nên tách latte xanh mướt đặc trưng.',
        ingredients: ['Matcha Uji Grade A', 'Sữa hấp', 'Sữa đặc'],
        sizes: [{ label: 'S', extra: 0 }, { label: 'M', extra: 5000 }, { label: 'L', extra: 10000 }],
    },
    {
        id: 8,
        name: 'Sinh Tố Bơ',
        category: 'Sinh tố',
        supplierId: 'supplier-04',
        price: 65000,
        rating: 4.9,
        reviews: 1670,
        description: 'Bơ Đắk Lắk chín mịn xay cùng sữa đặc và sữa tươi, béo ngậy tự nhiên. Không thêm đường, giữ nguyên vị bơ thuần túy.',
        ingredients: ['Bơ Đắk Lắk', 'Sữa đặc', 'Sữa tươi', 'Đá viên'],
        sizes: [{ label: 'M', extra: 0 }, { label: 'L', extra: 10000 }],
        tag: 'Bán chạy',
    },
    {
        id: 9,
        name: 'Sinh Tố Dâu Tây',
        category: 'Sinh tố',
        supplierId: 'supplier-04',
        price: 60000,
        rating: 4.7,
        reviews: 1200,
        description: 'Dâu tây Đà Lạt tươi xay mịn với sữa chua và mật ong, thêm đá lạnh. Màu hồng bắt mắt, vị chua ngọt tươi mát, giàu vitamin C.',
        ingredients: ['Dâu tây Đà Lạt', 'Sữa chua', 'Mật ong', 'Đá viên'],
        sizes: [{ label: 'M', extra: 0 }, { label: 'L', extra: 10000 }],
    },
    {
        id: 10,
        name: 'Đá Xay Mocha',
        category: 'Đá xay',
        supplierId: 'supplier-05',
        price: 70000,
        originalPrice: 80000,
        rating: 4.8,
        reviews: 945,
        description: 'Espresso đậm đà, sốt chocolate Valrhona, sữa tươi và đá xay mịn. Trên cùng là kem tươi phủ thêm chocolate shaving. Ngọt ngào, mát lạnh, đầy năng lượng.',
        ingredients: ['Espresso', 'Sốt chocolate', 'Sữa tươi', 'Đá xay', 'Whipped cream'],
        sizes: [{ label: 'M', extra: 0 }, { label: 'L', extra: 15000 }],
        tag: 'Khuyến mãi',
        hot: true,
    },
    {
        id: 11,
        name: 'Đá Xay Matcha Đậu Đỏ',
        category: 'Đá xay',
        supplierId: 'supplier-05',
        price: 72000,
        rating: 4.7,
        reviews: 678,
        description: 'Matcha Nhật xay lạnh, sữa tươi béo ngậy, phủ đậu đỏ hầm mềm và nước cốt dừa. Vị thanh mát, béo bùi, mang phong cách Nhật – Việt hòa quyện.',
        ingredients: ['Matcha', 'Sữa tươi', 'Đậu đỏ', 'Nước cốt dừa', 'Đá xay'],
        sizes: [{ label: 'M', extra: 0 }, { label: 'L', extra: 15000 }],
    },
    {
        id: 12,
        name: 'Sinh Tố Xoài',
        category: 'Sinh tố',
        supplierId: 'supplier-04',
        price: 58000,
        rating: 4.6,
        reviews: 887,
        description: 'Xoài cát Hòa Lộc chín vàng xay nhuyễn với sữa đặc và đá lạnh. Sánh mịn, thơm ngọt tự nhiên đặc trưng của xoài miền Nam.',
        ingredients: ['Xoài cát Hòa Lộc', 'Sữa đặc', 'Đá viên'],
        sizes: [{ label: 'M', extra: 0 }, { label: 'L', extra: 10000 }],
    },
];


const categories = ['Tất cả', 'Cà phê', 'Trà', 'Sinh tố', 'Đá xay'];
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
// ── Product Card ──────────────────────────────────────────────────────────────

const normalizedCategoryKeys = ['Cà phê', 'Trà', 'Sinh tố', 'Đá xay'];

const normalizeCategory = (rawCategory) => {
    if (!rawCategory) return normalizedCategoryKeys[0];
    if (normalizedCategoryKeys.includes(rawCategory)) return rawCategory;
    const lower = String(rawCategory).toLowerCase();
    if (lower.includes('tea') || lower.includes('tra')) return 'Trà';
    if (lower.includes('smoothie') || lower.includes('sinh')) return 'Sinh tố';
    if (lower.includes('ice') || lower.includes('blend') || lower.includes('xay')) return 'Đá xay';
    if (lower.includes('coffee') || lower.includes('ca phe')) return 'Cà phê';
    return normalizedCategoryKeys[0];
};

const mapVariantsToSizes = (price, variants = []) => {
    if (!variants.length) {
        return [{ label: 'M', extra: 0, variantId: null }];
    }

    return variants.map((variant, idx) => {
        const variantPrice = Number(variant?.price ?? price);
        const basePrice = Number(price ?? 0);

        return {
            label: variant?.variantName || variant?.name || `Size ${idx + 1}`, // Support both variantName and name
            extra: Math.max(0, variantPrice - basePrice),
            // ✅ IMPORTANT: Backend returns "variantId" field, not "id" field
            variantId: variant?.variantId || variant?.id // Backend uses "variantId", fallback to "id"
        };
    });
};

const mapProductToViewModel = (product, variants = []) => {
    const basePrice = Number(product?.price ?? 0);
    return {
        id: String(product?.id ?? ''),
        name: product?.name || '',
        category: normalizeCategory(product?.categoryName || product?.category),
        supplierId: product?.supplierId ?? '',
        price: basePrice,
        rating: Number(product?.rating ?? 4.8),
        reviews: Number(product?.reviews ?? 0),
        description: product?.description || '',
        ingredients: Array.isArray(product?.ingredients) ? product.ingredients : [],
        sizes: mapVariantsToSizes(basePrice, variants),
        tag: product?.tag,
        hot: Boolean(product?.hot),
        originalPrice: Number(product?.originalPrice ?? 0) || undefined,
    };
};
function ProductCard({ product, onClick }) {
    const color = categoryColor[product.category] || 'bg-gray-100 text-gray-700';

    const formatVnd = (value) => `${Number(value ?? 0).toLocaleString('vi-VN')}đ`;

    return (
        <div className="group bg-white rounded-xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div
                role="button"
                tabIndex={0}
                onClick={onClick}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onClick?.();
                    }
                }}
                className="text-left"
            >
                <div className="relative h-48 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-emerald-300 group-hover:text-emerald-400 transition-colors">
                        coffee
                    </span>

                    {!!product.tag && (
                        <span className="absolute top-2 left-2 rounded-full bg-emerald-700 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                            {product.tag}
                        </span>
                    )}

                    {product.hot && (
                        <span className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                            <span className="material-symbols-outlined text-sm">local_fire_department</span>
                            Hot
                        </span>
                    )}
                </div>

                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
                    {product.category !== 'Tất cả' && categoryIcon[product.category]}
                    {product.category}
                </span>

                <div className="mt-2 flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg leading-tight text-gray-900 group-hover:text-emerald-700 transition-colors font-headline">
                        {product.name}
                    </h3>
                    <span className="font-bold text-emerald-700 font-headline">{formatVnd(product.price)}</span>
                </div>

                <p className="text-xs text-gray-500 mb-1 line-clamp-2 font-body">{product.description}</p>
            </div>
        </div>
    );
}
// ── Product Detail Modal ──────────────────────────────────────────────────────
function ProductModal({ product, onClose, onAddToCart }) {
  var _a, _b;
  // Check if this is a fallback product (number ID instead of UUID string)
  const isDemoProduct = typeof product.id === 'number';
  const [selectedSize, setSelectedSize] = useState(product.sizes[0].label);
  const [quantity, setQuantity] = useState(1);
  useEffect(() => {
    setSelectedSize(product.sizes[0]?.label || 'M');
    setQuantity(1);
  }, [product.id, product.sizes]);
  const selectedExtra = (_b = (_a = product.sizes.find((s) => s.label === selectedSize)) === null || _a === void 0 ? void 0 : _a.extra) !== null && _b !== void 0 ? _b : 0;
  const totalPrice = product.price + selectedExtra;
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <button aria-label="Close modal" className="absolute inset-0 w-full h-full cursor-default" onClick={onClose} />
        <dialog open className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-0 border-0">
          <div className="h-52 bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center relative">
            <span className="material-symbols-outlined text-8xl text-emerald-300">coffee</span>
            {product.tag && (
              <span className="absolute top-4 left-4 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                {product.tag}
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
                <Star key={s} className={`w-4 h-4 ${s <= Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
              ))}
              <span className="font-medium text-gray-700">{product.rating}</span>
              <span>· {product.reviews.toLocaleString()} đánh giá</span>
            </div>

            <p className="mt-4 text-sm text-gray-600 leading-relaxed font-body">{product.description}</p>

            {isDemoProduct && (
              <div className="mt-4 rounded-lg bg-orange-50 border border-orange-200 p-3">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-orange-600 text-xl">info</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-orange-800">Sản phẩm mẫu (DEMO)</p>
                    <p className="text-xs text-orange-700 mt-1">
                      Đây là dữ liệu mẫu, không thể thêm vào giỏ hàng. Vui lòng liên hệ admin để thêm sản phẩm thực vào hệ thống.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 font-label">Thành phần</p>
              <div className="flex flex-wrap gap-2">
                {product.ingredients.map((ing) => (
                  <span key={ing} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 font-body">{ing}</span>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 font-label">Kích cỡ</p>
              <div className="flex gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setSelectedSize(s.label)}
                    className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors font-headline ${
                      selectedSize === s.label
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-emerald-400'
                    }`}
                  >
                    {s.label}{s.extra > 0 && <span className="block text-xs font-normal">+{s.extra.toLocaleString('vi-VN')}đ</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs font-semibold uppercase text-gray-500 tracking-wide font-label">Số lượng</span>
              <div className="flex items-center gap-3 rounded-full border border-gray-200 px-3 py-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="text-lg font-bold text-gray-500"
                >
                  –
                </button>
                <span className="w-8 text-center text-sm font-semibold font-headline">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="text-lg font-bold text-gray-500"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => !isDemoProduct && onAddToCart?.(product, selectedSize, quantity)}
                disabled={isDemoProduct}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border font-semibold py-3 transition-colors font-headline ${
                  isDemoProduct
                    ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                    : 'border-gray-200 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                {/* <ShoppingCart className="w-5 h-5" /> */}
                {isDemoProduct ? 'Không khả dụng (Demo)' : 'Thêm vào giỏ hàng'}
              </button>
              {/* <button onClick={onClose} className="w-full rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors font-body">
                Quay lại
              </button> */}
            </div>
          </div>
        </dialog>
      </div>
    </>
  );
}
// ── Page ──────────────────────────────────────────────────────────────────────

// Helper function now uses centralized extractUserId utility
const getUserId = (user: any): string | null => {
    return extractUserId(user);
};

export default function GuestPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user, logout } = useAuth();

    const isStaffView = location.pathname.startsWith("/staff");
    const cartPath = isStaffView ? "/staff/cart" : "/cart";
    const profilePath = isStaffView ? "/staff/portal" : "/customer/portal/my-portal";
    const settingsPath = isStaffView ? "/staff/portal" : "/customer/portal";

    const [activeCategory, setActiveCategory] = useState("Tất cả");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedProductId, setSelectedProductId] = useState(null);

    const closeProductModal = () => {
        setSelectedProduct(null);
        setSelectedProductId(null);
    };

    const [products, setProducts] = useState([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [hasProductError, setHasProductError] = useState(false);
    const [productsReloadKey, setProductsReloadKey] = useState(0);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20); // 20 products per page (5x4 grid)

    // Replace localStorage cart with API cart
    const [cartData, setCartData] = useState<CartResponse | null>(null);
    const [isLoadingCart, setIsLoadingCart] = useState(false);

    const [isPayingCash, setIsPayingCash] = useState(false);
    const [isPayingMomo, setIsPayingMomo] = useState(false);

    // Customer selection for POS order (default: Guest)
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [activeCustomer, setActiveCustomer] = useState<{
        id?: string;
        name: string;
        phone: string;
    } | null>(null);

    const activeCustomerName = activeCustomer?.name?.trim() || 'Guest';

    const userId = getUserId(user);

    const rawUser = user?.raw as Record<string, unknown> | undefined;
    const nestedRawUser = (rawUser?.user as Record<string, unknown> | undefined) ?? {};
    const displayName = user?.username?.trim() || 'Khách hàng';
    const displayEmail =
        (typeof rawUser?.email === 'string' && rawUser.email) ||
        (typeof nestedRawUser.email === 'string' && nestedRawUser.email) ||
        'Chưa cập nhật email';

    const handleLogout = () => {
        logout();
        navigate('/home');
    };

    // Load cart from API instead of localStorage
    const loadCart = useCallback(
        async (forceRefresh: boolean = false, showLoading: boolean = true) => {
            if (!isAuthenticated || !userId) {
                setCartData(null);
                return;
            }

            try {
                if (showLoading) setIsLoadingCart(true);

                // Force refresh after mutations to bypass cache + get latest items immediately
                const cart = await CartService.getCart(userId, forceRefresh);
                setCartData(cart);
            } catch (error: any) {
                console.error('Error loading cart:', error);

                // Handle 429 errors gracefully
                if (error.response?.status === 429) {
                    console.warn('⚠️ Cart loading rate limited - will retry automatically');
                    // Keep previous cartData for better UX
                } else {
                    setCartData(null);
                }
            } finally {
                if (showLoading) setIsLoadingCart(false);
            }
        },
        [isAuthenticated, userId],
    );

    useEffect(() => {
        // Initial load should be fresh
        loadCart(true);
    }, [isAuthenticated, userId, loadCart]);

    useEffect(() => {
        let cancelled = false;
        let retryTimeoutId: NodeJS.Timeout;

        const loadProductsWithRetry = async (attempt = 1, maxAttempts = 3) => {
            if (cancelled) return;

            try {
                setIsLoadingProducts(true);
                if (attempt === 1) {
                    setHasProductError(false);
                }

                console.log(`🚀 Loading products from API (attempt ${attempt}/${maxAttempts})...`);
                console.log('API Base URL:', import.meta.env.DEV ? '/api' : 'https://api-gate-way.onrender.com');

                const response = await getProducts({ page: 0, size: 100, status: 'ACTIVE' });
                const items = Array.isArray(response?.content) ? response.content : [];

                console.log('📦 API Response:', response);
                console.log('📊 Products found:', items.length);

                if (!cancelled) {
                    if (items.length > 0) {
                        // Load variants for all products in parallel
                        console.log('🔄 Loading variants for all products...');
                        const productsWithVariants = await Promise.all(
                            items.map(async (item) => {
                                try {
                                    const variants = await getProductVariants(String(item.id));
                                    console.log(`🔍 Raw variants for product ${item.name}:`, variants);

                                    // ✅ Debug: Check variant field structure
                                    if (variants && variants.length > 0) {
                                        variants.forEach((v, idx) => {
                                            console.log(`  Variant ${idx + 1}:`, {
                                                hasId: !!v.id,
                                                hasVariantId: !!v.variantId,
                                                hasName: !!v.name,
                                                hasVariantName: !!v.variantName,
                                                actualId: v.id || v.variantId,
                                                actualName: v.variantName || v.name,
                                                rawVariant: v
                                            });
                                        });
                                    }

                                    return mapProductToViewModel(item, variants);
                                } catch (error) {
                                    console.warn(`⚠️ Failed to load variants for product ${item.id}:`, error);
                                    // Fallback to product without variants
                                    return mapProductToViewModel(item, []);
                                }
                            })
                        );

                        setProducts(productsWithVariants);
                        try {
                            const catalog = (productsWithVariants || [])
                                .filter((p) => p?.id && p?.name)
                                .map((p) => ({ id: String(p.id), name: String(p.name) }));
                            localStorage.setItem('productCatalog_v1', JSON.stringify(catalog));
                        } catch {
                            // ignore storage errors
                        }
                        console.log('✅ Successfully loaded products with variants:', productsWithVariants.length);

                        // Reset error state on success
                        setHasProductError(false);

                        // 🔍 DEBUG: Log variants info for each product
                        console.log('📊 Products with variants details:');
                        productsWithVariants.forEach(p => {
                            console.log(`  Product: ${p.name}`);
                            console.log(`    ID: ${p.id}`);
                            console.log(`    Sizes:`, p.sizes);
                            p.sizes.forEach(s => {
                                const isTestVariant = s.variantId && /^test-|-test-|fake-|dummy-|00000000-0000-0000-0000|ffffffff-ffff-ffff-ffff/i.test(String(s.variantId));
                                console.log(`      - ${s.label}: variantId=${s.variantId} ${isTestVariant ? '⚠️ TEST DATA' : '✅ VALID'}`);
                            });
                        });

                        // toast.success(`Đã tải thành công ${productsWithVariants.length} sản phẩm từ database`, {
                        //     position: "top-right",
                        //     autoClose: 3000,
                        // });
                    } else {
                        // If API returns empty but no error, retry once more
                        if (attempt < 2) {
                            console.log('⚠️ API returned empty, retrying...');
                            const retryDelay = 2000;
                            retryTimeoutId = setTimeout(() => loadProductsWithRetry(attempt + 1, maxAttempts), retryDelay);
                            return;
                        }

                        // After retries, use fallback
                        console.log('⚠️ No products from API after retries, using fallback data');
                        setProducts(fallbackProducts);
                        try {
                            const catalog = (fallbackProducts || [])
                                .filter((p: any) => p?.id && p?.name)
                                .map((p: any) => ({ id: String(p.id), name: String(p.name) }));
                            localStorage.setItem('productCatalog_v1', JSON.stringify(catalog));
                        } catch {
                            // ignore storage errors
                        }
                        setHasProductError(true);
                        toast.warning("⚠️ Database trống hoặc tạm thời không khả dụng, đang sử dụng dữ liệu mẫu", {
                            position: "top-right",
                            autoClose: 5000,
                        });
                    }
                }
            } catch (error: any) {
                console.error(`❌ Error loading products (attempt ${attempt}):`, error);

                if (!cancelled) {
                    const status = Number(error?.status ?? error?.response?.status);
                    const message = String(error?.message ?? "").toLowerCase();
                    const name = String(error?.name ?? "").toLowerCase();

                    const isServerError = Number.isFinite(status) && status >= 500;
                    const isRateLimited = status === 429;
                    const isTimeoutError =
                        name.includes("abort") ||
                        message.includes("timeout") ||
                        message.includes("timed out") ||
                        message.includes("aborted");
                    const isNetworkError =
                        status === 0 ||
                        (!Number.isFinite(status) &&
                            (message.includes("network") ||
                                message.includes("failed to fetch") ||
                                message.includes("load failed") ||
                                message.includes("khong the ket noi") ||
                                message.includes("ket noi") ||
                                message.includes("kết nối")));

                    // Retry for transient issues
                    if ((isServerError || isNetworkError || isTimeoutError || isRateLimited) && attempt < maxAttempts) {
                        const retryDelay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
                        console.log(`🔄 Retrying in ${retryDelay}ms... (${maxAttempts - attempt} attempts left)`);

                        toast.warning(`⚠️ Lỗi tải sản phẩm, thử lại sau ${retryDelay/1000}s... (${attempt}/${maxAttempts})`, {
                            position: "top-right",
                            autoClose: retryDelay - 200,
                        });

                        retryTimeoutId = setTimeout(() => loadProductsWithRetry(attempt + 1, maxAttempts), retryDelay);
                        return;
                    }

                    // After all retries failed, use fallback
                    setProducts(fallbackProducts);
                    try {
                        const catalog = (fallbackProducts || [])
                            .filter((p: any) => p?.id && p?.name)
                            .map((p: any) => ({ id: String(p.id), name: String(p.name) }));
                        localStorage.setItem('productCatalog_v1', JSON.stringify(catalog));
                    } catch {
                        // ignore storage errors
                    }
                    setHasProductError(true);

                    const errorType = isServerError
                        ? 'lỗi server'
                        : isRateLimited
                          ? 'rate limit'
                          : isNetworkError
                            ? 'lỗi mạng'
                            : isTimeoutError
                              ? 'timeout'
                              : Number.isFinite(status)
                                ? `HTTP ${status}`
                                : 'lỗi không xác định';

                    toast.error(`❌ Không thể kết nối database (${errorType}), hiển thị dữ liệu mẫu`, {
                        position: "top-right",
                        autoClose: 8000,
                    });
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingProducts(false);
                }
            }
        };

        loadProductsWithRetry();

        return () => {
            cancelled = true;
            if (retryTimeoutId) {
                clearTimeout(retryTimeoutId);
            }
        };
    }, [productsReloadKey]);

    // Periodic health check for service recovery
    useEffect(() => {
        if (!hasProductError) return; // Only run when there's an error

        let healthCheckInterval: NodeJS.Timeout;
        let cancelled = false;

        const healthCheck = async () => {
            if (cancelled) return;

            try {
                console.log('🏥 Health check: Testing API recovery...');
                const testResponse = await getProducts({ page: 0, size: 1, status: 'ACTIVE' });

                if (testResponse?.content?.length > 0) {
                    console.log('✅ Health check: API recovered! Reloading products...');

                    // Clear error state and reload
                    setHasProductError(false);

                    toast.success("🎉 Kết nối database đã phục hồi! Đang tải lại sản phẩm...", {
                        position: "top-right",
                        autoClose: 3000,
                    });

                    // Re-fetch products without forcing a full page reload
                    setProductsReloadKey((k) => k + 1);
                }
            } catch (error) {
                console.log('🏥 Health check: API still unavailable, will retry in 30s');
            }
        };

        // Check every 30 seconds when in error state
        healthCheckInterval = setInterval(healthCheck, 30000);

        return () => {
            cancelled = true;
            if (healthCheckInterval) {
                clearInterval(healthCheckInterval);
            }
        };
    }, [hasProductError]);

    useEffect(() => {
        if (!selectedProductId) return;
        let cancelled = false;

        const loadProductDetail = async () => {
            try {
                const [product, variants] = await Promise.all([
                    getProductById(String(selectedProductId)),
                    getProductVariants(String(selectedProductId)),
                ]);

                if (!cancelled && product) {
                    setSelectedProduct(mapProductToViewModel(product, variants));
                }
            } catch (_error) {
                // keep existing selectedProduct as fallback
            }
        };

        loadProductDetail();
        return () => {
            cancelled = true;
        };
    }, [selectedProductId]);

    const handleAddToCart = async (product, size, quantity) => {
        // Debug logging
        console.log('🔍 Debug product info:', {
            product,
            productId: product.id,
            productIdType: typeof product.id,
            isDemoProduct: typeof product.id === 'number',
            size,
            quantity
        });

        console.log('🔍 Debug thông tin đăng nhập:', {
            isAuthenticated,
            userId,
            user,
            accessToken: localStorage.getItem('accessToken'),
            userFromStorage: localStorage.getItem('user')
        });

        // Check if this is a fallback/demo product (number ID instead of UUID)
        const isDemoProduct = typeof product.id === 'number';
        if (isDemoProduct) {
            console.warn('⚠️ This is a demo product with numeric ID:', product.id);
            toast.warning("⚠️ Đây là sản phẩm mẫu, không thể thêm vào giỏ hàng. Vui lòng liên hệ admin để thêm sản phẩm thực.", {
                position: "top-right",
                autoClose: 5000,
            });
            return;
        }

        console.log('✅ This is a real product with UUID:', product.id);

        if (!isAuthenticated || !userId) {
            console.error('❌ Lỗi xác thực:', { isAuthenticated, userId });
            toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng", {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        // Validate UUID format (but allow fallback/test UUIDs)
        const isValidUUID = (str: string) => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            const fallbackUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            return uuidRegex.test(str) || fallbackUuidRegex.test(str);
        };

        if (!isValidUUID(userId)) {
            console.error('❌ Invalid userId format:', userId);
            toast.error("Lỗi định danh người dùng. Vui lòng đăng xuất và đăng nhập lại.", {
                position: "top-right",
                autoClose: 3000,
            });
            return;
        }

        // Declare these before try block so they're accessible in catch block
        let selectedSizeObj;
        let variantId;
        let optimisticCartItemId: number | null = null;

        try {
            // ✅ OPTIMIZED: Get variant ID directly from product.sizes (already loaded with variants)
            console.log('🔍 Product sizes:', product.sizes);
            console.log('🔍 Selected size:', size);

            // Check if product has sizes array
            if (!product.sizes || product.sizes.length === 0) {
                console.error('❌ Product has no sizes/variants:', product);
                toast.error("❌ Sản phẩm này chưa có biến thể trong hệ thống. Vui lòng liên hệ admin.", {
                    position: "top-right",
                    autoClose: 5000,
                });
                return;
            }

            // Find the selected size in product.sizes array
            selectedSizeObj = product.sizes.find(s => s.label === size);
            variantId = selectedSizeObj?.variantId;

            console.log('🔍 Selected size object:', selectedSizeObj);
            console.log('🔍 Variant ID:', variantId);

            // Validate variantId exists
            if (!variantId) {
                console.error('❌ No variant ID found for size:', size);
                toast.error("❌ Không tìm thấy biến thể sản phẩm cho size này", {
                    position: "top-right",
                    autoClose: 3000,
                });
                return;
            }

            // Validate all UUIDs
            if (!isValidUUID(String(product.id))) {
                console.error('❌ Invalid productId format:', product.id);
                toast.error("Lỗi định danh sản phẩm", {
                    position: "top-right",
                    autoClose: 3000,
                });
                return;
            }

            if (!isValidUUID(String(variantId))) {
                console.error('❌ Invalid variantId format:', variantId);
                toast.error("Lỗi định danh biến thể sản phẩm", {
                    position: "top-right",
                    autoClose: 3000,
                });
                return;
            }

            // ⚠️ Warning check for test/fake variant IDs
            const variantIdStr = String(variantId);
            if (variantIdStr.includes('aaaa') || variantIdStr.includes('1111') ||
                variantIdStr.includes('2222') || variantIdStr.includes('test')) {
                console.warn('⚠️ Detected test/fake variant ID:', variantIdStr);
                // toast.warning(`⚠️ Cảnh báo: Variant ID có vẻ là dữ liệu test (${variantIdStr.substring(0, 20)}...). Sản phẩm này có thể không tồn tại trong database thực.`, {
                //     position: "top-right",
                //     autoClose: 8000,
                // });
            }

            const cartPayload = {
                customerId: userId,
                productId: String(product.id),
                variantId: String(variantId),
                quantity
            };

            // Optimistic UI: show item immediately in Active Order while API finishes
            optimisticCartItemId = -Date.now();
            const unitPrice = Number(product?.price ?? 0) + Number(selectedSizeObj?.extra ?? 0);
            setCartData((prev) => {
                const prevCartId = prev?.cartId ?? cartData?.cartId ?? 0;
                const prevItems = Array.isArray(prev?.items) ? prev!.items : [];

                const optimisticItem: CartItemResponse = {
                    cartItemId: optimisticCartItemId as number,
                    productId: String(product.id),
                    variantId: String(variantId),
                    productName: String(product?.name ?? ''),
                    productImage: undefined,
                    productPrice: unitPrice,
                    quantity,
                    totalPrice: unitPrice * Number(quantity ?? 1),
                };

                return {
                    cartId: prevCartId,
                    items: [optimisticItem, ...prevItems],
                    // Keep server subtotal; totals will be derived from items while optimistic item exists
                    subtotal: Number(prev?.subtotal ?? 0) || 0,
                } as CartResponse;
            });
            closeProductModal();

            console.log('🛒 Adding to cart with payload:', cartPayload);

            const response = await CartService.addToCart(cartPayload);

            console.log('✅ Cart API response:', response);

            // Backend returns { message: string }, not { success: boolean }
            if (response && response.message) {
                toast.success(`${'Đã thêm vào giỏ hàng'}`, {
                    position: "top-right",
                    autoClose: 2000,
                });
                // Refresh immediately (no loading flicker)
                loadCart(true, false);
            } else {
                // Unexpected response format
                console.warn('⚠️ Unexpected response format:', response);
                toast.success("Đã thêm vào giỏ hàng", {
                    position: "top-right",
                    autoClose: 2000,
                });
                loadCart(true, false);
            }

    } catch (error) {
        // Rollback optimistic item on failure
        if (optimisticCartItemId != null) {
            setCartData((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    items: (prev.items || []).filter((it) => it.cartItemId !== optimisticCartItemId),
                };
            });
        }

        console.error('❌ Error adding to cart:', error);

        // Extract detailed error information
        const serverError = error?.response?.data;
        const statusCode = error?.response?.status || error?.status;
        const serverMsg = serverError?.message || error?.message || '';

        console.error('❌ Error details:', {
            status: statusCode,
            serverError,
            message: serverMsg,
            cartPayload: {
                customerId: userId,
                productId: String(product.id),
                variantId: String(variantId),
                quantity
            }
        });

        // Handle specific error cases
        let msg = "Có lỗi xảy ra khi thêm vào giỏ hàng";

        if (error.status === 429) {
            return toast.warning("⏰ Hệ thống đang bận, vui lòng thử lại sau giây lát.");
        }

        if (serverMsg.toLowerCase().includes('variant') || serverMsg.includes('not found')) {
            msg = "❌ Sản phẩm chưa được cấu hình đầy đủ trong hệ thống (thiếu Variant).";
        } else if (serverMsg.includes('He thong dang gap loi')) {
            msg = "🔧 Lỗi kết nối Backend/Database. Vui lòng liên hệ Admin.";
        } else if (error.status === 400) {
            msg = "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.";
        }

        toast.error(msg, { autoClose: 5000 });
    }
};

    const handleRemoveFromCart = async (cartItemId: number) => {
        if (!isAuthenticated || !userId) return;
        if (cartItemId < 0) return; // optimistic item; will be replaced by server response soon

        try {
            await CartService.removeCartItem(cartItemId);
            loadCart(true, false); // Reload cart after removing (no loading flicker)
            toast.success("Đã xóa sản phẩm khỏi giỏ hàng", {
                position: "top-right",
                autoClose: 2000,
            });
        } catch (error) {
            console.error('Error removing from cart:', error);
            toast.error("❌ Có lỗi xảy ra khi xóa sản phẩm", {
                position: "top-right",
                autoClose: 3000,
            });
        }
    };

    const handleSetCartItemQuantity = async (cartItemId: number, nextQuantity: number) => {
        if (!isAuthenticated || !userId) return;
        if (cartItemId < 0) return; // optimistic item; wait for server cartItemId

        // Keep "-" from deleting items; user should use the delete icon instead.
        const safeQuantity = Math.max(1, Number.isFinite(nextQuantity) ? Math.floor(nextQuantity) : 1);

        try {
            await CartService.updateCartItem({ cartItemId, quantity: safeQuantity });
            loadCart(true, false);
        } catch (error) {
            console.error('Error updating cart item quantity:', error);
            toast.error("❌ Có lỗi xảy ra khi cập nhật số lượng", {
                position: "top-right",
                autoClose: 3000,
            });
        }
    };


    // Get cart items and totals
    const cartItems = cartData?.items || [];
    const cartItemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

    const handleTestAPI = async () => {
        console.log('🧪 Testing API endpoints manually...');

        try {
            toast.info("🧪 Đang test API endpoints...", {
                position: "top-right",
                autoClose: 2000,
            });

            // Test 1: Get products
            const productsResponse = await getProducts({ page: 0, size: 5 });
            console.log('✅ Products API test:', productsResponse);

            // Test 2: If we have products, test getting details + variants
            if (productsResponse?.content?.length > 0) {
                const firstProduct = productsResponse.content[0];
                console.log('📋 Testing first product:', firstProduct);

                try {
                    const [productDetail, variants] = await Promise.all([
                        getProductById(String(firstProduct.id)),
                        getProductVariants(String(firstProduct.id))
                    ]);

                    console.log('✅ Product Detail API test:', productDetail);
                    console.log('✅ Product Variants API test:', variants);

                    // 🔍 Analyze variant data quality
                    console.log('\n🔍 VARIANT DATA ANALYSIS:');
                    console.log(`Product: ${firstProduct.name} (ID: ${firstProduct.id})`);

                    if (variants && variants.length > 0) {
                        variants.forEach((v, idx) => {
                            const isTestVariant = (v.id || v.variantId) && /^test-|-test-|fake-|dummy-|00000000-0000-0000-0000|ffffffff-ffff-ffff-ffff/i.test(String(v.id || v.variantId));

                            console.log(`  Variant ${idx + 1}:`);
                            console.log(`    - ID: ${v.id || v.variantId} ${isTestVariant ? '⚠️ TEST DATA' : '✅ REAL DATA'}`);
                            console.log(`    - Name: ${v.variantName || v.name}`);
                            console.log(`    - Price: ${v.price}`);
                            console.log(`    - Created: ${v.createdAt || 'N/A'}`);

                            if (isTestVariant) {
                                console.warn(`    ❌ This variant has TEST/DUMMY ID pattern!`);
                            }
                        });
                    } else {
                        console.warn(`  ❌ No variants found for product ${firstProduct.id}`);
                    }

                    toast.success("✅ API test hoàn thành! Xem console để biết chi tiết.", {
                        position: "top-right",
                        autoClose: 5000,
                    });

                } catch (detailError) {
                    console.error('❌ Product detail/variants API failed:', detailError);
                    toast.warning(`⚠️ Products API OK, nhưng detail/variants API lỗi: ${detailError.message}`, {
                        position: "top-right",
                        autoClose: 8000,
                    });
                }
            } else {
                toast.warning("⚠️ Products API phản hồi nhưng không có dữ liệu", {
                    position: "top-right",
                    autoClose: 5000,
                });
            }

        } catch (error) {
            console.error('❌ API Test failed:', error);
            toast.error(`❌ Kiểm tra API thất bại: ${error.message || 'Lỗi không xác định'}`, {
                position: "top-right",
                autoClose: 8000,
            });
        }
    };

    const filteredByCategory = activeCategory === 'Tất cả'
        ? products
        : products.filter((p) => p.category === activeCategory);

    const q = searchQuery.trim().toLowerCase();
    const filtered = q
        ? filteredByCategory.filter((p) => {
            const name = String(p?.name ?? '').toLowerCase();
            const desc = String(p?.description ?? '').toLowerCase();
            return name.includes(q) || desc.includes(q);
        })
        : filteredByCategory;

    // Pagination logic
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filtered.slice(startIndex, endIndex);

    // Reset to page 1 when category/search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeCategory, searchQuery]);

    // Pagination handlers
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // Smooth scroll to top of products section
        document.getElementById('products-section')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            handlePageChange(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            handlePageChange(currentPage + 1);
        }
    };

    const formatVnd = (value: number) => `${Number(value ?? 0).toLocaleString('vi-VN')}đ`;

    const computedSubtotal = cartItems.reduce(
        (sum, it) => sum + Number(it.totalPrice ?? (it.productPrice ?? 0) * (it.quantity ?? 0)),
        0,
    );

    const hasOptimisticItem = cartItems.some((it) => Number(it.cartItemId ?? 0) < 0);

    const subtotal = hasOptimisticItem
        ? computedSubtotal
        : typeof cartData?.subtotal === 'number'
            ? cartData.subtotal
            : computedSubtotal;

    const total = subtotal;

    const handleCashPayment = async () => {
        if (!isAuthenticated || !userId) {
            toast.error("Vui lòng đăng nhập để thanh toán", { autoClose: 2500 });
            return;
        }
        if (!cartItems.length) return;

        setIsPayingCash(true);
        try {
            const invoice = await invoiceService.createInvoice({ customerId: userId });
            const invoiceId = String((invoice as any)?.id ?? "").trim();

            if (!invoiceId) {
                throw new Error("Không tạo được hóa đơn (invoiceId rỗng)");
            }

            await invoiceService.checkout({ invoiceId });

            navigate("/staff/payment-success", {
                state: {
                    invoiceId,
                    orderNumber: (invoice as any)?.code || invoiceId,
                    total: Number((invoice as any)?.totalAmount ?? total) || 0,
                    orderedAt:
                        (invoice as any)?.paidAt ||
                        (invoice as any)?.updatedAt ||
                        (invoice as any)?.createdAt ||
                        new Date().toISOString(),
                    paymentMethod: "Cash",
                    customerId: userId,
                },
            });
        } catch (err) {
            console.error("[PODPage] Cash payment error:", err);
            toast.error("❌ Không thể thanh toán tiền mặt. Vui lòng thử lại.", {
                autoClose: 4000,
            });
            setIsPayingCash(false);
        }
    };

    const handleMomoPayment = async () => {
        if (!isAuthenticated || !userId) {
            toast.error("Vui lòng đăng nhập để thanh toán", { autoClose: 2500 });
            return;
        }
        if (!cartItems.length) return;

        setIsPayingMomo(true);
        try {
            const invoice = await invoiceService.createInvoice({ customerId: userId });
            const invoiceId = String((invoice as any)?.id ?? "").trim();

            if (!invoiceId) {
                throw new Error("Không tạo được hóa đơn (invoiceId rỗng)");
            }

            await invoiceService.checkout({ invoiceId });

            const amount = Number((invoice as any)?.totalAmount ?? 0);
            if (!amount || Number.isNaN(amount) || amount <= 0) {
                throw new Error(`Invalid amount for MoMo payment: ${amount}`);
            }

            // Mark this MoMo flow as STAFF so PaymentReturn can route to PaymentSuccessStaff.
            sessionStorage.setItem("payment_success_role", "staff");
            sessionStorage.setItem("pending_invoice_id", invoiceId);

            const momo = await MomoService.createMomoPayment({
                orderId: invoiceId,
                amount,
            });

            const payUrl = (momo as any)?.payUrl;
            if (payUrl) {
                window.location.href = payUrl;
                return;
            }

            throw new Error("MoMo did not return payUrl");
        } catch (err) {
            console.error("[PODPage] MoMo payment error:", err);
            toast.error("❌ Không thể tạo thanh toán MoMo. Vui lòng thử lại.", {
                autoClose: 4000,
            });
            setIsPayingMomo(false);
        }
    };

    return (
        <div className="h-screen overflow-hidden bg-gray-50 text-gray-900">
            {/* TopNavBar */}
            <header className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md shadow-sm flex justify-between items-center px-8 h-16">
                <div className="text-xl font-bold tracking-tighter text-emerald-800 flex items-center gap-2 font-headline">
                    <span className="material-symbols-outlined text-emerald-700" style={{ fontVariationSettings: "'FILL' 1" }}>coffee</span>
                    Capital Coffee POS
                </div>

                {/* <nav className="hidden md:flex items-center space-x-8 font-headline text-sm font-medium tracking-tight">
                    <span className="text-emerald-700 font-bold border-b-2 border-emerald-600 px-1 py-5">Dashboard</span>
                    <span className="text-zinc-500 hover:text-emerald-600 transition-colors px-1 py-5">Orders</span>
                    <span className="text-zinc-500 hover:text-emerald-600 transition-colors px-1 py-5">Inventory</span>
                    <span className="text-zinc-500 hover:text-emerald-600 transition-colors px-1 py-5">Reports</span>
                </nav> */}

                <div className="flex items-center space-x-6">
                    <button
                        onClick={() => navigate(cartPath)}
                        className="relative text-emerald-900 transition-opacity hover:opacity-80 active:scale-95 duration-200"
                        type="button"
                        aria-label="Open cart"
                    >
                        <span className="material-symbols-outlined">shopping_bag</span>
                        {cartItemCount > 0 && (
                            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-sm">
                                {cartItemCount > 99 ? "99+" : cartItemCount}
                            </span>
                        )}
                    </button>

                    {isAuthenticated ? (
                        <div className="group relative">
                            <button
                                type="button"
                                className="text-emerald-900 transition-opacity hover:opacity-80 active:scale-95 duration-200"
                                aria-label="User menu"
                            >
                                <span className="material-symbols-outlined">person</span>
                            </button>

                            <div className="invisible absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-emerald-100 bg-white p-3 opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100">
                                <div className="border-b border-emerald-100 pb-2">
                                    <p className="text-sm font-semibold text-emerald-900 truncate">{displayName}</p>
                                    <p className="text-xs text-gray-500 truncate">{displayEmail}</p>
                                </div>

                                <div className="mt-2 flex flex-col gap-1">
                                    <button
                                        type="button"
                                        onClick={() => navigate(profilePath)}
                                        className="rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-800"
                                    >
                                        My profile
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => navigate(settingsPath)}
                                        className="rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-800"
                                    >
                                        Setting
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                        className="rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="text-emerald-900 transition-opacity hover:opacity-80 active:scale-95 duration-200"
                        >
                            <span className="material-symbols-outlined">person</span>
                        </button>
                    )}
                </div>
            </header>

            <main className="flex h-screen pt-16">
                {/* SideNavBar */}
                <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-24 bg-zinc-50 border-r border-zinc-200 flex flex-col space-y-2 py-4">
                    {categories.map((cat) => {
                        const isActive = activeCategory === cat;

                        return (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setActiveCategory(cat)}
                                className={`${isActive
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'text-zinc-400 hover:bg-zinc-100'} flex flex-col items-center justify-center rounded-xl m-2 py-4 transition-all duration-200 ease-in-out cursor-pointer`}
                            >
                                <span className={`material-symbols-outlined mb-1 ${isActive ? '' : ''}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                                    {cat === 'Tất cả' ? 'apps' : cat === 'Cà phê' ? 'coffee' : cat === 'Trà' ? 'eco' : cat === 'Sinh tố' ? 'local_drink' : 'ac_unit'}
                                </span>
                                <span className="font-headline text-[10px] font-semibold uppercase tracking-widest">
                                    {cat}
                                </span>
                            </button>
                        );
                    })}
                </aside>

                {/* Main Product Grid */}
                <section className="ml-24 mr-[400px] flex-grow p-8 overflow-y-auto bg-gray-50 pb-24">

                    <section id="products-section">
                        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-semibold text-gray-900 font-headline">
                                    {activeCategory === 'Tất cả' ? 'Tất cả sản phẩm' : activeCategory}
                                </h3>
                                <p className="text-sm text-gray-600 font-body mt-1">
                                    {filtered.length} sản phẩm
                                    {searchQuery.trim() ? ` · kết quả cho "${searchQuery.trim()}"` : ''}
                                </p>
                            </div>
                        </div>

                        {isLoadingProducts ? (
                            <ProductsLoading className="min-h-[360px]" />
                        ) : paginatedProducts.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                    {paginatedProducts.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            onClick={() => {
                                                setSelectedProduct(product);
                                                setSelectedProductId(String(product.id));
                                            }}
                                        />
                                    ))}
                                </div>

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                    onPreviousPage={handlePreviousPage}
                                    onNextPage={handleNextPage}
                                    totalItems={filtered.length}
                                    itemsPerPage={itemsPerPage}
                                />
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <span className="material-symbols-outlined text-6xl">search_off</span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 font-headline mb-2">
                                    Không tìm thấy sản phẩm
                                </h3>
                                <p className="text-gray-600 font-body">
                                    Không có sản phẩm nào khớp với bộ lọc hiện tại.
                                </p>
                            </div>
                        )}
                    </section>
                </section>

                {/* Right: Order Summary / Cart Panel */}
                <aside className="w-[400px] bg-white h-screen fixed right-0 top-0 pt-16 flex flex-col border-l border-zinc-100 shadow-2xl z-40">
                    <div className="p-6 border-b border-zinc-50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-extrabold tracking-tight font-headline">Active Order</h3>
                            <span className="text-xs font-bold text-zinc-500 bg-gray-100 px-2 py-1 rounded">
                                {cartData?.cartId ? `CART-${cartData.cartId}` : '—'}
                            </span>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                            <span className="material-symbols-outlined text-emerald-600">person</span>
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 leading-none mb-1">Customer</p>
                                <p className="text-sm font-bold truncate">{activeCustomerName}</p>
                            </div>
                            <button
                                className="ml-auto text-emerald-600"
                                type="button"
                                onClick={() => setIsCustomerModalOpen(true)}
                                aria-label="Chọn khách hàng"
                            >
                                <span className="material-symbols-outlined">edit</span>
                            </button>
                        </div>

                        {!isAuthenticated && (
                            <div className="mt-3 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
                                Vui lòng đăng nhập để sử dụng giỏ hàng.
                            </div>
                        )}
                    </div>

                    <div className="flex-grow overflow-y-auto p-6 space-y-6">
                        {cartItems.length === 0 ? (
                            isLoadingCart ? (
                                <div className="text-sm text-zinc-500 font-body">Đang tải giỏ hàng...</div>
                            ) : (
                                <div className="text-sm text-zinc-500 font-body">Chưa có sản phẩm trong đơn.</div>
                            )
                        ) : (
                            <>
                                {isLoadingCart && (
                                    <div className="text-xs text-zinc-400 font-body">Đang cập nhật...</div>
                                )}
                                {cartItems.map((item: CartItemResponse) => (
                                    <div className="flex gap-4" key={item.cartItemId}>
                                    <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                        {item.productImage ? (
                                            <img className="w-full h-full object-cover" src={item.productImage} alt={item.productName} />
                                        ) : (
                                            <span className="material-symbols-outlined text-3xl text-emerald-300">coffee</span>
                                        )}
                                    </div>

                                    <div className="flex-grow min-w-0">
                                        <div className="flex justify-between mb-1 gap-2">
                                            <h4 className="font-bold text-sm truncate font-headline">{item.productName}</h4>
                                            <span className="font-bold text-sm font-headline">{formatVnd(item.totalPrice)}</span>
                                        </div>

                                        <p className="text-xs text-zinc-500 mb-2 italic font-body">{formatVnd(item.productPrice)} / item</p>

                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-3 bg-gray-100 px-2 py-1 rounded-full">
                                                <button
                                                    className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    type="button"
                                                    disabled={item.cartItemId < 0 || (item.quantity ?? 1) <= 1}
                                                    onClick={() => handleSetCartItemQuantity(item.cartItemId, (item.quantity ?? 1) - 1)}
                                                >
                                                    -
                                                </button>
                                                <span className="text-xs font-bold font-headline">{item.quantity}</span>
                                                <button
                                                    className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                    type="button"
                                                    disabled={item.cartItemId < 0}
                                                    onClick={() => handleSetCartItemQuantity(item.cartItemId, (item.quantity ?? 1) + 1)}
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <button
                                                className="text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                type="button"
                                                disabled={item.cartItemId < 0}
                                                onClick={() => handleRemoveFromCart(item.cartItemId)}
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    <div className="p-6 bg-zinc-50 border-t border-zinc-100">
                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-sm text-zinc-500">
                                <span>Subtotal</span>
                                <span className="font-bold font-headline">{formatVnd(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-extrabold text-gray-900 pt-2 border-t border-zinc-200">
                                <span>Total</span>
                                <span className="text-emerald-700 font-headline">{formatVnd(total)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-white border border-zinc-200 hover:border-emerald-500 hover:text-emerald-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                type="button"
                                onClick={handleCashPayment}
                                disabled={!isAuthenticated || cartItems.length === 0 || hasOptimisticItem || isPayingCash || isPayingMomo}
                            >
                                <span className="material-symbols-outlined text-xl">payments</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                    {isPayingCash ? "Đang xử lý" : "Tiền mặt"}
                                </span>
                            </button>

                            <button
                                className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-white border border-zinc-200 hover:border-emerald-500 hover:text-emerald-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                type="button"
                                onClick={handleMomoPayment}
                                disabled={!isAuthenticated || cartItems.length === 0 || hasOptimisticItem || isPayingCash || isPayingMomo}
                            >
                                <span className="material-symbols-outlined text-xl">qr_code_2</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                    {isPayingMomo ? "Đang xử lý" : "MoMo"}
                                </span>
                            </button>
                        </div>

                        {hasOptimisticItem && (
                            <p className="text-[11px] text-amber-600 mt-2 font-body">
                                Đang đồng bộ giỏ hàng... Vui lòng đợi vài giây trước khi thanh toán.
                            </p>
                        )}
                    </div>
                </aside>
            </main>

            {selectedProduct && (
                <ProductModal
                    product={selectedProduct}
                    onClose={closeProductModal}
                    onAddToCart={handleAddToCart}
                />
            )}

            <CustomerModal
                isOpen={isCustomerModalOpen}
                onClose={() => setIsCustomerModalOpen(false)}
                onSkip={() => setActiveCustomer(null)}
                onSelectCustomer={(customer) => {
                    const name = String(customer?.name ?? "").trim();
                    const phone = String(customer?.phone ?? "").trim();
                    setActiveCustomer({
                        id: customer?.id,
                        name: name || 'Guest',
                        phone,
                    });
                    setIsCustomerModalOpen(false);
                }}
            />

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







