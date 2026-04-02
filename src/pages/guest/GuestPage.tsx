import { useState, useEffect, useMemo } from 'react';
import { X, Star, ShoppingCart, Coffee, Leaf, Milk, IceCream2, Flame } from 'lucide-react';
import { getProducts, getProductById, getProductVariants, type Product, type ProductVariant } from '@/services/productService';
import { ProductsLoading } from '@/components/common/ProductsLoading';
const ALL_CATEGORY = 'Tất cả';
const categoryIcon = {
    'Cà phê': <Coffee className="w-4 h-4"/>,
    'Trà': <Leaf className="w-4 h-4"/>,
    'Sinh tố': <Milk className="w-4 h-4"/>,
    'Đá xay': <IceCream2 className="w-4 h-4"/>,
};
const categoryColor = {
    'Cà phê': 'bg-amber-50 text-amber-700',
    'Trà': 'bg-green-50 text-green-700',
    'Sinh tố': 'bg-pink-50 text-pink-700',
    'Đá xay': 'bg-blue-50 text-blue-700',
};
// ── Product Card ──────────────────────────────────────────────────────────────
function ProductCard({ product, onClick }) {
  const color = categoryColor[product.category || (product as any).categoryName] || 'bg-gray-100 text-gray-700';
    return (<button onClick={onClick} className="group text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden">
      {/* Placeholder image area */}
      <div className="relative h-44 bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
        <Coffee className="w-16 h-16 text-amber-300 group-hover:text-amber-400 transition-colors"/>
        {product.tag && (<span className="absolute top-3 left-3 rounded-full bg-amber-600 px-2.5 py-0.5 text-xs font-semibold text-white">
            {product.tag}
          </span>)}
        {product.hot && (<span className="absolute top-3 right-3 flex items-center gap-0.5 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
            <Flame className="w-3 h-3"/> Hot
          </span>)}
      </div>

      <div className="p-4">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
          {categoryIcon[product.category || (product as any).categoryName]}
          {product.category || (product as any).categoryName || 'Uncategorized'}
        </span>

        <h3 className="mt-2 text-base font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">
          {product.name}
        </h3>

        <p className="mt-1 text-sm text-gray-500 line-clamp-2">{product.description}</p>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-amber-700">
              {((product.price ?? 0) as number).toLocaleString('vi-VN')}đ
            </span>
        {!!product.originalPrice && (<span className="ml-2 text-sm text-gray-400 line-through">
                {product.originalPrice.toLocaleString('vi-VN')}đ
              </span>)}
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400"/>
            <span className="font-medium text-gray-700">{(product as any).rating ?? '-'}</span>
          </div>
        </div>
      </div>
    </button>);
}
// ── Product Detail Modal ──────────────────────────────────────────────────────
function ProductModal({ product, onClose }) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const currentPrice = (selectedVariant?.price ?? (product.price ?? 0));
  const totalPrice = currentPrice;
    return (<>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        {/* Click-outside trap */}
        <button aria-label="Close modal" className="absolute inset-0 w-full h-full cursor-default" onClick={onClose}/>
        {/* Dialog */}
        <dialog open className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-0 border-0">
        {/* Image area */}
        <div className="h-52 bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center relative">
          <Coffee className="w-24 h-24 text-amber-300"/>
          {product.tag && (<span className="absolute top-4 left-4 rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white">
              {product.tag}
            </span>)}
          <button onClick={onClose} className="absolute top-4 right-4 rounded-full bg-white/80 p-1.5 hover:bg-white transition-colors">
            <X className="w-5 h-5 text-gray-700"/>
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColor[product.category]}`}>
                {categoryIcon[product.category]}
                {product.category}
              </span>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">{product.name}</h2>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-amber-700">{totalPrice.toLocaleString('vi-VN')}đ</p>
        {!!product.originalPrice && (<p className="text-sm text-gray-400 line-through">{product.originalPrice.toLocaleString('vi-VN')}đ</p>)}
            </div>
          </div>

          {/* Rating */}
          <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
            {[1, 2, 3, 4, 5].map((s) => (<Star key={s} className={`w-4 h-4 ${s <= Math.round(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}/>))}
            <span className="font-medium text-gray-700">{product.rating}</span>
            <span>· {product.reviews.toLocaleString()} đánh giá</span>
          </div>

          <p className="mt-4 text-sm text-gray-600 leading-relaxed">{product.description}</p>

          {/* Ingredients */}
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Thành phần</p>
            <div className="flex flex-wrap gap-2">
              {product.ingredients.map((ing) => (<span key={ing} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">{ing}</span>))}
            </div>
          </div>

          {/* Variant / options */}
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Tùy chọn</p>
            <div className="flex gap-2">
              {((product as any).variants && (product as any).variants.length > 0) ? (
                (product as any).variants.map((v: ProductVariant) => (
                  <button key={v.variantId} onClick={() => setSelectedVariant(v)} className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors ${selectedVariant?.variantId === v.variantId
                    ? 'border-amber-600 bg-amber-600 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-amber-400'}`}>
                    {v.variantName}
                    <span className="block text-xs font-normal">{v.price.toLocaleString('vi-VN')}đ</span>
                  </button>
                ))
              ) : (
                <div className="text-sm text-gray-500">Không có tùy chọn, sử dụng giá sản phẩm</div>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6 flex gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 transition-colors">
              <ShoppingCart className="w-5 h-5"/>
              Đặt ngay
            </button>
            <button onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Quay lại
            </button>
          </div>
        </div>
        </dialog>
      </div>
    </>);
}
// ── Page ──────────────────────────────────────────────────────────────────────
export default function GuestPage() {
    const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY);
    const [products, setProducts] = useState<Product[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [listError, setListError] = useState<string | null>(null);

    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    useEffect(() => {
      const loadProducts = async () => {
        setListLoading(true);
        setListError(null);
        try {
          const resp = await getProducts({ page: 0, size: 100, status: 'ACTIVE' });
          setProducts(resp?.content ?? []);
        } catch (err) {
          setListError(err instanceof Error ? err.message : 'Không thể tải sản phẩm');
        } finally {
          setListLoading(false);
        }
      };
      loadProducts();
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
          const withVariants = prod ? ({ ...prod, variants }) : null;
          setSelectedProduct(withVariants as any);
        } catch (err) {
          setDetailError(err instanceof Error ? err.message : 'Không thể tải chi tiết sản phẩm');
        } finally {
          setDetailLoading(false);
        }
      };
      loadDetail();
    }, [selectedProductId]);

    const filtered = activeCategory === ALL_CATEGORY ? products : products.filter((p) => (p.categoryName ?? '') === activeCategory);

    const openProduct = (id: string) => {
      setSelectedProductId(id);
      setSelectedProduct(null);
      setDetailError(null);
    };

    const closeProduct = () => {
      setSelectedProductId(null);
      setSelectedProduct(null);
      setDetailError(null);
    };

    const categories = useMemo(() => {
      const setCats = new Set(products.map((p) => p.categoryName).filter(Boolean));
      return [ALL_CATEGORY, ...Array.from(setCats)];
    }, [products]);

    return (<>
      {/* Product list */}
      <section className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {/* Category filter */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((cat) => (<button key={cat} onClick={() => setActiveCategory(cat)} className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeCategory === cat
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-700'}`}>
        {cat !== ALL_CATEGORY && categoryIcon[cat]}
              {cat}
            </button>))}
        </div>

        {listLoading && <ProductsLoading />}

        {!listLoading && listError && (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-red-700 text-sm">
            {listError}
          </div>
        )}

        {/* Grid */}
        {!listLoading && !listError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((product) => (<ProductCard key={product.id} product={product as any} onClick={() => openProduct(String(product.id))}/>))}
          </div>
        )}
      </section>

      {/* Detail modal */}
      {selectedProductId && (
        <ProductModal product={selectedProduct as any} onClose={closeProduct} />
      )}
    </>);
}
