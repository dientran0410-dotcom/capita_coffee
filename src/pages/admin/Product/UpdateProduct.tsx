import { useEffect, useState } from 'react';
import type { FC, ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, updateProductById, updateProductImage } from '@/services/productService';
import { getCategories } from '@/services/categoryService';
import { ArrowLeft, Save, X } from 'lucide-react';
import type { ProductUpdateRequest } from '@/types/product';
import ImageUploader from '@/components/product/ImageUploader';

interface Category {
    id: string;
    name: string;
    isTopping?: boolean;
}

interface FormData {
    name: string;
    description: string;
    categoryId: string;
    imageUrl: string;
    status: 'ACTIVE' | 'INACTIVE';
}

interface RouteParams extends Record<string, string> {
    id?: string;
}

const UpdateProduct: FC = () => {
    const { id } = useParams<RouteParams>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [categories, setCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState<FormData>({
        name: '',
        description: '',
        categoryId: '',
        imageUrl: '',
        status: 'ACTIVE'
    });

    useEffect(() => {
        const fetchData = async (): Promise<void> => {
            try {
                setLoading(true);
                const data = await getProductById(id || '');
                if (!data) {
                    setError('Product not found!');
                    return;
                }
                setFormData({
                    name: data.name || '',
                    description: data.description || '',
                    categoryId: data.categoryId || '',
                    imageUrl: data.imageUrl || '',
                    status: data.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
                });

                try {
                    const data = await getCategories();
                    setCategories(data);
                } catch {
                    setCategories([]);
                }
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
        void fetchData();
    }, [id]);

    const handleChange = (
        e: ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ): void => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (
        e: FormEvent<HTMLFormElement>
    ): Promise<void> => {
        e.preventDefault();
        try {
            setSaving(true);
            const payload: ProductUpdateRequest = {
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                categoryId: formData.categoryId.trim(),
                // Nếu ImageUploader trả base64, service sẽ tự loại bỏ imageUrl khỏi update payload.
                imageUrl: formData.imageUrl.trim() || null,
                status: formData.status
            };

            if (!payload.categoryId) {
                alert('Category is required.');
                setSaving(false);
                return;
            }

            await updateProductById(id || '', payload);

            if (formData.imageUrl) {
                try {
                    await updateProductImage(id || '', formData.imageUrl.trim());
                } catch (imgErr) {
                    console.error('Failed to update product image via dedicated endpoint', imgErr);
                }
            }

            alert('Product updated successfully!');
            navigate(-1);
        } catch (err: unknown) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to update product.';
            alert(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    if (loading)
        return (
            <div className='p-10 text-center text-gray-500'>
                Loading data...
            </div>
        );
    if (error)
        return (
            <div className='p-10 text-center text-red-500'>Error: {error}</div>
        );

    return (
        <div className='mx-auto max-w-2xl space-y-6'>
            <div className='flex items-center gap-4'>
                <button
                    onClick={() => navigate(-1)}
                    className='rounded-full p-2 transition-colors hover:bg-gray-100'
                >
                    <ArrowLeft className='h-5 w-5 text-gray-600' />
                </button>
                <h1 className='text-2xl font-bold text-gray-800'>
                    Update Product
                </h1>
            </div>

            <form
                onSubmit={handleSubmit}
                className='overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm'
            >
                <div className='border-b border-gray-200 bg-amber-50 p-6'>
                    <p className='font-medium text-amber-800'>
                        Editing product ID:{' '}
                        <span className='font-bold text-amber-900'>{id}</span>
                    </p>
                </div>

                <div className='space-y-6 p-6'>
                    {/* Product Name — giữ nguyên */}
                    <div>
                        <label className='mb-2 block text-sm font-medium text-gray-700'>
                            Product Name
                        </label>
                        <input
                            type='text'
                            name='name'
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className='w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500'
                            placeholder='Enter product name...'
                        />
                    </div>

                    {/* Description — giữ nguyên */}
                    <div>
                        <label className='mb-2 block text-sm font-medium text-gray-700'>
                            Description
                        </label>
                        <textarea
                            name='description'
                            value={formData.description}
                            onChange={handleChange}
                            className='w-full rounded-lg border border-gray-300 px-4 py-2.5'
                            placeholder='Enter description...'
                            rows={4}
                        />
                    </div>

                    {/*
                     * ✅ THAY THẾ đoạn Image URL cũ:
                     *
                     * XOÁ đi:
                     *   <div>
                     *     <label ...>Image URL</label>
                     *     <input type="text" name="imageUrl" value={formData.imageUrl} onChange={handleChange} ... />
                     *   </div>
                     *
                     * THÊM VÀO:
                     */}
                    <ImageUploader
                        value={formData.imageUrl}
                        onChange={(url: string) =>
                            setFormData((prev) => ({ ...prev, imageUrl: url }))
                        }
                        accentColor='amber'
                        label='Product Image'
                    />

                    {/* Category dropdown — giữ nguyên, đã có select */}
                    <div>
                        <label className='mb-2 block text-sm font-medium text-gray-700'>
                            Category
                        </label>
                        <select
                            name='categoryId'
                            value={formData.categoryId || ''}
                            onChange={handleChange}
                            required
                            className='w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500'
                        >
                            <option value=''>-- Select category --</option>
                            {categories.map((c: Category) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status — giữ nguyên */}
                    <div>
                        <label className='mb-2 block text-sm font-medium text-gray-700'>
                            Status
                        </label>
                        <select
                            name='status'
                            value={formData.status}
                            onChange={handleChange}
                            className='w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5'
                        >
                            <option value='ACTIVE'>ACTIVE</option>
                            <option value='INACTIVE'>INACTIVE</option>
                        </select>
                    </div>
                </div>

                <div className='flex justify-end gap-3 border-t border-gray-200 bg-gray-50 p-6'>
                    <button
                        type='button'
                        onClick={() => navigate(-1)}
                        className='inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-2.5 font-medium text-gray-700 hover:bg-gray-100'
                    >
                        <X className='h-4 w-4' /> Cancel
                    </button>
                    <button
                        type='submit'
                        disabled={saving}
                        className='inline-flex items-center gap-2 rounded-lg bg-amber-600 px-6 py-2.5 font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70'
                    >
                        <Save className='h-4 w-4' />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UpdateProduct;
