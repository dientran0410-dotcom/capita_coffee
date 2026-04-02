import { useEffect, useState } from 'react';
import type { FC } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, updateProductById, updateProductImage } from '@/services/productService';
import type { ProductResponse } from '@/types/product';
import {
    ArrowLeft,
    Package,
    CheckCircle,
    Ban,
    DollarSign,
    Clock,
    ImageOff,
    Trash2,
    Loader2,
    ZoomIn,
    X
} from 'lucide-react';
import ImageUploader from '@/components/product/ImageUploader';

interface RouteParams extends Record<string, string> {
    id?: string;
}

// ─── Modal xem ảnh toàn màn hình ──────────────────────────────────────────
const ImageLightbox: FC<{ src: string; alt: string; onClose: () => void }> = ({
    src,
    alt,
    onClose
}) => (
    <div
        className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm'
        onClick={onClose}
    >
        <button
            type='button'
            onClick={onClose}
            className='absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20'
        >
            <X className='h-6 w-6' />
        </button>
        <img
            src={src}
            alt={alt}
            className='max-h-[90vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl'
            onClick={(e) => e.stopPropagation()}
        />
    </div>
);

const ProductDetail: FC = () => {
    const { id } = useParams<RouteParams>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<ProductResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // ✅ THÊM MỚI: state cho image section
    const [showUploader, setShowUploader] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
    const [savingImage, setSavingImage] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    useEffect(() => {
        const isUUID = (value: string): boolean =>
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                value
            );

        if (!id || !isUUID(id)) {
            setLoading(false);
            return;
        }

        const fetchProduct = async (): Promise<void> => {
            try {
                setLoading(true);
                const data = await getProductById(id);
                if (!data) {
                    setError('Product not found!');
                    return;
                }
                setProduct(data);
                setCurrentImageUrl(data.imageUrl || ''); // ✅ sync state ảnh
            } catch (err: unknown) {
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'Failed to load product';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        void fetchProduct();
    }, [id]);

    const formatPrice = (value: number | undefined): string =>
        new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value || 0);

    // ✅ THÊM MỚI: lưu ảnh mới lên BE
    const handleSaveImage = async (newUrl: string): Promise<void> => {
        if (!id || !product) return;
        setSavingImage(true);
        try {
            await updateProductImage(id, newUrl || '');
            setCurrentImageUrl(newUrl);
            setProduct((prev) => (prev ? { ...prev, imageUrl: newUrl } : prev));
            setShowUploader(false);
        } catch (err: unknown) {
            alert(
                err instanceof Error ? err.message : 'Failed to update image.'
            );
        } finally {
            setSavingImage(false);
        }
    };

    // ✅ THÊM MỚI: xoá ảnh (set imageUrl = null trên BE)
    const handleDeleteImage = async (): Promise<void> => {
        if (!window.confirm('Bạn có chắc muốn xoá ảnh sản phẩm này không?'))
            return;
        await handleSaveImage('');
    };

    if (loading)
        return (
            <div className='p-10 text-center text-gray-500'>
                Loading product details...
            </div>
        );
    if (error)
        return (
            <div className='p-10 text-center text-red-500'>Error: {error}</div>
        );
    if (!product) return null;

    return (
        <div className='mx-auto max-w-4xl space-y-6'>
            {/* Lightbox */}
            {lightboxOpen && currentImageUrl && (
                <ImageLightbox
                    src={currentImageUrl}
                    alt={product.name}
                    onClose={() => setLightboxOpen(false)}
                />
            )}

            {/* Header */}
            <div className='flex items-center gap-4'>
                <button
                    onClick={() => navigate('/admin/products')}
                    type='button'
                    className='rounded-full p-2 transition-colors hover:bg-gray-100'
                >
                    <ArrowLeft className='h-5 w-5 text-gray-600' />
                </button>
                <h1 className='text-2xl font-bold text-gray-800'>
                    Product Details
                </h1>
            </div>

            <div className='overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm'>
                {/* ── Banner header ── */}
                <div className='flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6'>
                    <div className='flex items-center gap-3'>
                        <div className='rounded-lg bg-blue-600 p-3 text-white'>
                            <Package className='h-6 w-6' />
                        </div>
                        <div>
                            <h2 className='text-xl font-bold text-gray-900'>
                                Product: {product.name}
                            </h2>
                            <p className='text-sm text-gray-500'>
                                SKU:{' '}
                                <span className='font-semibold'>
                                    {product.sku || '-'}
                                </span>
                            </p>
                        </div>
                    </div>
                    <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                            product.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                        }`}
                    >
                        {product.status === 'ACTIVE' ? (
                            <CheckCircle className='h-4 w-4' />
                        ) : (
                            <Ban className='h-4 w-4' />
                        )}
                        {product.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                </div>

                {/*
                 * ✅ THÊM MỚI: Image section
                 * Đặt NGAY SAU block header banner ở trên, TRƯỚC grid thông tin.
                 */}
                <div className='border-b border-gray-200 p-6'>
                    <div className='flex items-center justify-between mb-4'>
                        <h3 className='text-sm font-semibold text-gray-700 uppercase tracking-wide'>
                            Product Image
                        </h3>
                        <div className='flex items-center gap-2'>
                            {currentImageUrl && (
                                <>
                                    <button
                                        type='button'
                                        onClick={() => setLightboxOpen(true)}
                                        className='inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100 transition'
                                    >
                                        <ZoomIn className='h-4 w-4' /> Xem toàn
                                        màn hình
                                    </button>
                                    <button
                                        type='button'
                                        onClick={() => void handleDeleteImage()}
                                        disabled={savingImage}
                                        className='inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100 transition disabled:opacity-50'
                                    >
                                        {savingImage ? (
                                            <Loader2 className='h-4 w-4 animate-spin' />
                                        ) : (
                                            <Trash2 className='h-4 w-4' />
                                        )}
                                        Xoá ảnh
                                    </button>
                                </>
                            )}
                            <button
                                type='button'
                                onClick={() => setShowUploader((v) => !v)}
                                className='inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-sm text-orange-700 hover:bg-orange-100 transition'
                            >
                                {showUploader
                                    ? 'Huỷ'
                                    : currentImageUrl
                                      ? 'Đổi ảnh'
                                      : 'Thêm ảnh'}
                            </button>
                        </div>
                    </div>

                    {/* Hiển thị ảnh hiện tại */}
                    {!showUploader && (
                        <div className='flex justify-center'>
                            {currentImageUrl ? (
                                <div
                                    className='group relative cursor-zoom-in overflow-hidden rounded-2xl border border-gray-200 shadow-sm'
                                    onClick={() => setLightboxOpen(true)}
                                >
                                    <img
                                        src={currentImageUrl}
                                        alt={product.name}
                                        className='h-64 w-full max-w-sm object-contain p-3 transition-transform duration-300 group-hover:scale-105'
                                        onError={(e) => {
                                            (
                                                e.target as HTMLImageElement
                                            ).style.display = 'none';
                                        }}
                                    />
                                    <div className='absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100 rounded-2xl'>
                                        <div className='rounded-full bg-white/90 p-3 shadow'>
                                            <ZoomIn className='h-5 w-5 text-gray-800' />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className='flex h-48 w-full max-w-sm flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50'>
                                    <ImageOff className='h-10 w-10 text-gray-300' />
                                    <p className='text-sm text-gray-400'>
                                        Chưa có ảnh sản phẩm
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Uploader — hiện khi bấm "Đổi ảnh" / "Thêm ảnh" */}
                    {showUploader && (
                        <div className='space-y-3'>
                            <ImageUploader
                                value={currentImageUrl}
                                onChange={(url) => {
                                    // Gọi save ngay khi upload xong
                                    void handleSaveImage(url);
                                }}
                                accentColor='orange'
                                label=''
                                disabled={savingImage}
                            />
                            {savingImage && (
                                <p className='flex items-center gap-2 text-sm text-gray-500'>
                                    <Loader2 className='h-4 w-4 animate-spin' />{' '}
                                    Đang lưu thay đổi…
                                </p>
                            )}
                        </div>
                    )}
                </div>
                {/* ✅ KẾT THÚC image section */}

                {/* Grid thông tin — giữ nguyên */}
                <div className='grid grid-cols-1 gap-6 p-6 md:grid-cols-2'>
                    <div className='space-y-4'>
                        <div className='flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4'>
                            <DollarSign className='h-5 w-5 text-amber-500' />
                            <div>
                                <p className='text-sm font-medium text-gray-500'>
                                    Unit Price
                                </p>
                                <p className='text-lg font-bold text-gray-900'>
                                    {formatPrice(product.price)}
                                </p>
                            </div>
                        </div>
                        <div className='flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4'>
                            <Clock className='h-5 w-5 text-blue-500' />
                            <div>
                                <p className='text-sm font-medium text-gray-500'>
                                    Category
                                </p>
                                <p className='text-lg font-bold text-gray-900'>
                                    {product.categoryName ||
                                        product.categoryId ||
                                        '-'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className='space-y-4'>
                        <div className='h-full rounded-lg border border-gray-100 bg-gray-50 p-4'>
                            <p className='mb-2 text-sm font-medium text-gray-500'>
                                System Information
                            </p>
                            <div className='space-y-2 text-sm'>
                                <p className='flex justify-between'>
                                    <span className='text-gray-500'>
                                        System ID:
                                    </span>
                                    <span className='font-mono text-gray-900'>
                                        {product.id}
                                    </span>
                                </p>
                                <p className='flex justify-between'>
                                    <span className='text-gray-500'>Slug:</span>
                                    <span className='font-medium text-gray-900'>
                                        {product.slug || '-'}
                                    </span>
                                </p>
                                <p className='flex justify-between'>
                                    <span className='text-gray-500'>
                                        Created:
                                    </span>
                                    <span className='font-medium text-gray-900'>
                                        {product.createdAt
                                            ? new Date(
                                                  product.createdAt
                                              ).toLocaleDateString('en-GB')
                                            : '-'}
                                    </span>
                                </p>
                                <p className='flex justify-between'>
                                    <span className='text-gray-500'>
                                        Last Updated:
                                    </span>
                                    <span className='font-medium text-gray-900'>
                                        {product.updatedAt
                                            ? new Date(
                                                  product.updatedAt
                                              ).toLocaleDateString('en-GB')
                                            : '-'}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description — giữ nguyên */}
                <div className='border-t border-gray-200 p-6'>
                    <h3 className='mb-2 text-sm font-medium text-gray-500'>
                        Description
                    </h3>
                    <p className='text-sm text-gray-700'>
                        {product.description || 'No description provided.'}
                    </p>
                </div>

                {/* Footer buttons — giữ nguyên */}
                <div className='flex justify-end gap-3 border-t border-gray-200 bg-gray-50 p-6'>
                    <button
                        onClick={() => navigate('/admin/products')}
                        type='button'
                        className='rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-gray-700 hover:bg-gray-100'
                    >
                        Close
                    </button>
                    <button
                        onClick={() =>
                            navigate(`../update/${product.id}`, {
                                relative: 'path'
                            })
                        }
                        type='button'
                        className='rounded-lg bg-amber-500 px-6 py-2 font-medium text-white hover:bg-amber-600'
                    >
                        Edit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
