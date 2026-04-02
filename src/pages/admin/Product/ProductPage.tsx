import {
    useState,
    useCallback,
    useEffect,
    type FC,
    type ChangeEvent
} from 'react';
import { Eye, CheckCircle, Ban, Edit, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    getProducts,
    toggleProductAvailability
} from '@/services/productService';
import { getCategories, createCategory } from '@/services/categoryService';

interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    categoryName?: string;
    categoryId?: string;
    imageUrl?: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt?: string;
}

interface Category {
    id: string;
    name: string;
    topping?: boolean;
}

interface FilterState {
    query: string;
    minPrice: string;
    maxPrice: string;
    categoryId: string;
    isActive: string;
    sort: string;
}

interface ProductResponse {
    content: Product[];
    totalPages: number;
}

const ProductPage: FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [categories, setCategories] = useState<Category[]>([]);
    const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
    const [showCreateCategoryModal, setShowCreateCategoryModal] =
        useState<boolean>(false);
    const [newCategoryName, setNewCategoryName] = useState<string>('');
    const [newCategoryIsTopping, setNewCategoryIsTopping] =
        useState<boolean>(false);
    const [creatingCategory, setCreatingCategory] = useState<boolean>(false);
    const navigate = useNavigate();
    const location = useLocation();
    const routeBase = location.pathname.startsWith('/supplier')
        ? '/supplier/products'
        : '/admin/products';

    const defaultFilters: FilterState = {
        query: '',
        minPrice: '',
        maxPrice: '',
        categoryId: '',
        isActive: '',
        sort: 'createdAt,desc'
    };
    const [filters, setFilters] = useState<FilterState>(defaultFilters);

    const formatPrice = (value: number | undefined): string =>
        new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value || 0);

    const generateSlug = (text: string): string =>
        text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 50);

    useEffect(() => {
        const fetchCategories = async (): Promise<void> => {
            try {
                const data = await getCategories();
                setCategories(data || []);
            } catch {
                setCategories([]);
            }
        };
        void fetchCategories();
    }, []);

    const handleCreateCategory = async (): Promise<void> => {
        if (!newCategoryName.trim()) {
            alert('Please enter a category name');
            return;
        }

        if (newCategoryName.trim().length > 50) {
            alert('Category name must not exceed 50 characters');
            return;
        }

        setCreatingCategory(true);
        try {
            const newCategory = await createCategory({
                name: newCategoryName.trim(),
                isTopping: newCategoryIsTopping
            });
            setCategories((prev) => [...prev, newCategory]);
            setNewCategoryName('');
            setNewCategoryIsTopping(false);
            setShowCreateCategoryModal(false);
            alert('Category created successfully!');
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Failed to create category';
            alert(errorMessage);
        } finally {
            setCreatingCategory(false);
        }
    };

    const loadProducts = useCallback(
        async (
            pageNumber: number = 0,
            searchFilters?: FilterState
        ): Promise<void> => {
            if (!searchFilters) return;
            try {
                setLoading(true);
                const size = 5;

                const params = {
                    minPrice:
                        searchFilters.minPrice !== ''
                            ? searchFilters.minPrice
                            : undefined,
                    maxPrice:
                        searchFilters.maxPrice !== ''
                            ? searchFilters.maxPrice
                            : undefined,
                    categoryId:
                        searchFilters.categoryId !== ''
                            ? searchFilters.categoryId
                            : undefined,
                    isActive:
                        searchFilters.isActive === ''
                            ? undefined
                            : String(searchFilters.isActive) === 'true',
                    page: 0,
                    size: 1000
                };

                const result: ProductResponse = await getProducts(params);
                let filtered: Product[] = result?.content || [];

                if (searchFilters.minPrice !== '') {
                    const minPrice = Number(searchFilters.minPrice);
                    if (!Number.isNaN(minPrice)) {
                        filtered = filtered.filter(
                            (p) =>
                                p.price != null && Number(p.price) >= minPrice
                        );
                    }
                }

                if (searchFilters.maxPrice !== '') {
                    const maxPrice = Number(searchFilters.maxPrice);
                    if (!Number.isNaN(maxPrice)) {
                        filtered = filtered.filter(
                            (p) =>
                                p.price != null && Number(p.price) <= maxPrice
                        );
                    }
                }

                if (searchFilters.isActive !== '') {
                    const isActiveFilter =
                        String(searchFilters.isActive) === 'true';
                    filtered = filtered.filter(
                        (p) => (p.status === 'ACTIVE') === isActiveFilter
                    );
                }

                if (searchFilters.query && searchFilters.query.trim() !== '') {
                    const q = searchFilters.query.trim().toLowerCase();
                    filtered = filtered.filter(
                        (p) =>
                            (p.name && p.name.toLowerCase().includes(q)) ||
                            (p.description &&
                                p.description.toLowerCase().includes(q))
                    );
                }

                const total = filtered.length;
                const pages = Math.max(1, Math.ceil(total / size));
                const start = pageNumber * size;
                setProducts(filtered.slice(start, start + size));
                setTotalPages(pages);
                setPage(pageNumber);
            } catch (err: unknown) {
                console.error(err);
                setProducts([]);
                setTotalPages(0);
                setPage(0);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    useEffect(() => {
        void loadProducts(0, filters);
    }, [filters, loadProducts]);

    const handleReset = (): void => {
        setFilters({ ...defaultFilters });
    };

    const handleToggleStatus = async (
        _supplierId: string | null,
        productId: string,
        currentStatus: boolean
    ): Promise<void> => {
        if (
            !window.confirm(
                `Are you sure you want to ${currentStatus ? 'disable' : 'enable'} this product?`
            )
        )
            return;
        try {
            await toggleProductAvailability(productId, !currentStatus);
            alert('Status updated successfully!');
            void loadProducts(page, filters);
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : 'Failed to update status';
            alert(errorMessage);
        }
    };

    return (
        <div>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <h1 className='text-2xl font-bold'>Product Management</h1>

                <div className='flex items-center gap-2'>
                    <button
                        onClick={() =>
                            navigate(
                                location.pathname.startsWith('/supplier')
                                    ? '/supplier/products/create'
                                    : '/admin/products/create'
                            )
                        }
                        className='inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600'
                    >
                        + Create New Product
                    </button>
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        className='inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600'
                    >
                        📁 View All Categories
                    </button>
                </div>
            </div>

            <div className='mt-4 flex items-center gap-3 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm'>
                <input
                    type='text'
                    value={filters.query || ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setFilters({ ...filters, query: e.target.value })
                    }
                    placeholder='Search product by name or description...'
                    className='flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500'
                />
            </div>

            <div className='mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm'>
                <div className='grid grid-cols-1 items-center gap-4 sm:grid-cols-2 md:grid-cols-5'>
                    <input
                        type='number'
                        placeholder='Min Price'
                        value={filters.minPrice}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setFilters({ ...filters, minPrice: e.target.value })
                        }
                        className='h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none'
                    />
                    <input
                        type='number'
                        placeholder='Max Price'
                        value={filters.maxPrice}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setFilters({ ...filters, maxPrice: e.target.value })
                        }
                        className='h-10 rounded-lg border border-gray-300 px-3 text-sm outline-none'
                    />
                    <select
                        value={filters.categoryId}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                            setFilters({
                                ...filters,
                                categoryId: e.target.value
                            })
                        }
                        className='h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none'
                    >
                        <option value=''>-- All Categories --</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filters.isActive}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                            setFilters({ ...filters, isActive: e.target.value })
                        }
                        className='h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none'
                    >
                        <option value=''>All</option>
                        <option value='true'>Active</option>
                        <option value='false'>Inactive</option>
                    </select>
                    <div className='flex justify-end gap-2'>
                        <button
                            onClick={handleReset}
                            className='rounded-lg border border-gray-300 px-5 py-2 text-sm text-gray-700 hover:bg-gray-100'
                        >
                            Reset
                        </button>
                    </div>
                </div>
            </div>

            <div className='mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm'>
                <div className='overflow-x-auto'>
                    <table className='min-w-full table-fixed whitespace-nowrap'>
                        <thead className='border-b border-gray-200 bg-gray-50 text-sm font-semibold text-gray-600'>
                            <tr>
                                <th className='w-24 px-4 py-3 text-left'>
                                    Image
                                </th>
                                <th className='w-1/3 px-5 py-3 text-left'>
                                    Product Name
                                </th>
                                <th className='w-1/6 px-5 py-3 text-left'>
                                    Category
                                </th>
                                <th className='w-28 px-5 py-3 text-right'>
                                    Price
                                </th>
                                <th className='w-36 px-5 py-3 text-center'>
                                    Created Date
                                </th>
                                <th className='w-28 px-5 py-3 text-center'>
                                    Status
                                </th>
                                <th className='w-36 px-5 py-3 text-right'>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-200'>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className='py-8 text-center text-gray-500'
                                    >
                                        Loading...
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className='py-8 text-center text-gray-500'
                                    >
                                        No products found
                                    </td>
                                </tr>
                            ) : (
                                products.map((p) => {
                                    const isActive = p.status === 'ACTIVE';

                                    return (
                                        <tr
                                            key={p.id}
                                            className='hover:bg-gray-50'
                                        >
                                            <td className='px-4 py-3 text-left align-middle'>
                                                {p.imageUrl ? (
                                                    <img
                                                        src={p.imageUrl}
                                                        alt={
                                                            p.name ||
                                                            'product-image'
                                                        }
                                                        className='h-12 w-12 rounded object-cover'
                                                    />
                                                ) : (
                                                    <div className='flex h-12 w-12 items-center justify-center rounded bg-gray-100 text-xs text-gray-400'>
                                                        No Image
                                                    </div>
                                                )}
                                            </td>

                                            <td className='px-5 py-3 align-middle font-medium text-gray-900'>
                                                {p.name || p.id}
                                            </td>
                                            <td className='px-5 py-3 align-middle text-gray-600'>
                                                {p.categoryName || '-'}
                                            </td>
                                            <td className='px-5 py-3 align-middle text-right text-gray-600'>
                                                {formatPrice(p.price)}
                                            </td>
                                            <td className='px-5 py-3 align-middle text-center text-gray-600'>
                                                {p.createdAt
                                                    ? new Date(
                                                          p.createdAt
                                                      ).toLocaleDateString()
                                                    : '-'}
                                            </td>

                                            <td className='px-5 py-3 text-center align-middle'>
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                        isActive
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-red-100 text-red-700'
                                                    }`}
                                                >
                                                    {isActive
                                                        ? 'Active'
                                                        : 'Inactive'}
                                                </span>
                                            </td>

                                            <td className='px-5 py-3 text-right align-middle'>
                                                <div className='flex items-center justify-end gap-2'>
                                                    <button
                                                        onClick={() =>
                                                            navigate(
                                                                `${routeBase}/${p.id}`
                                                            )
                                                        }
                                                        className='inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1 text-sm'
                                                    >
                                                        <Eye className='h-4 w-4' />{' '}
                                                        Detail
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            navigate(
                                                                `${routeBase}/update/${p.id}`
                                                            )
                                                        }
                                                        className='inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1 text-sm'
                                                    >
                                                        <Edit className='h-4 w-4' />{' '}
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            void handleToggleStatus(
                                                                null,
                                                                p.id,
                                                                isActive
                                                            )
                                                        }
                                                        className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-sm ${
                                                            isActive
                                                                ? 'border-red-200 bg-red-50 text-red-700'
                                                                : 'border-green-200 bg-green-50 text-green-700'
                                                        }`}
                                                    >
                                                        {isActive ? (
                                                            <Ban className='h-4 w-4' />
                                                        ) : (
                                                            <CheckCircle className='h-4 w-4' />
                                                        )}
                                                        {isActive
                                                            ? 'Disable'
                                                            : 'Enable'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className='flex items-center justify-between gap-3 p-4'>
                    <div />
                    <div className='flex items-center gap-3'>
                        <button
                            disabled={page === 0}
                            onClick={() => {
                                if (page > 0)
                                    void loadProducts(page - 1, filters);
                            }}
                            className='rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 disabled:opacity-50'
                        >
                            Previous
                        </button>
                        <span className='text-sm font-medium text-gray-600'>
                            Page {totalPages === 0 ? 0 : page + 1} /{' '}
                            {totalPages}
                        </span>
                        <button
                            disabled={
                                page + 1 >= totalPages || totalPages === 0
                            }
                            onClick={() => {
                                if (page + 1 < totalPages)
                                    void loadProducts(page + 1, filters);
                            }}
                            className='rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 disabled:opacity-50'
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {showCategoryModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
                    <div className='w-full max-w-2xl rounded-xl bg-white shadow-lg'>
                        <div className='flex items-center justify-between border-b border-gray-200 p-6'>
                            <h2 className='text-xl font-bold text-gray-800'>
                                📁 All Categories
                            </h2>
                            <div className='flex items-center gap-2'>
                                <button
                                    onClick={() =>
                                        setShowCreateCategoryModal(true)
                                    }
                                    className='inline-flex items-center gap-2 rounded-lg bg-green-500 px-3 py-2 text-sm font-medium text-white hover:bg-green-600'
                                >
                                    + Add Category
                                </button>
                                <button
                                    onClick={() => setShowCategoryModal(false)}
                                    className='rounded-lg p-1 hover:bg-gray-100'
                                >
                                    <X className='h-6 w-6 text-gray-600' />
                                </button>
                            </div>
                        </div>

                        <div className='max-h-96 overflow-y-auto p-6'>
                            {categories.length === 0 ? (
                                <p className='text-center text-gray-500'>
                                    No categories found
                                </p>
                            ) : (
                                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                                    {categories.map((cat) => (
                                        <div
                                            key={cat.id}
                                            className='flex items-center justify-between rounded-lg border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 transition-shadow hover:shadow-md'
                                        >
                                            <div className='flex-1'>
                                                <h3 className='font-medium text-gray-900'>
                                                    {cat.name}
                                                </h3>
                                                {cat.topping && (
                                                    <p className='mt-1 text-xs text-orange-600'>
                                                        🌶️ Topping
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setFilters({
                                                        ...filters,
                                                        categoryId: cat.id
                                                    });
                                                    setShowCategoryModal(false);
                                                }}
                                                className='ml-3 rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600'
                                            >
                                                Filter
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className='border-t border-gray-200 bg-gray-50 p-4 text-right'>
                            <button
                                onClick={() => setShowCategoryModal(false)}
                                className='rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-gray-700 hover:bg-gray-100'
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showCreateCategoryModal && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
                    <div className='w-full max-w-md rounded-xl bg-white shadow-lg'>
                        <div className='flex items-center justify-between border-b border-gray-200 p-6'>
                            <h2 className='text-xl font-bold text-gray-800'>
                                ➕ Create New Category
                            </h2>
                            <button
                                onClick={() =>
                                    setShowCreateCategoryModal(false)
                                }
                                className='rounded-lg p-1 hover:bg-gray-100'
                            >
                                <X className='h-6 w-6 text-gray-600' />
                            </button>
                        </div>

                        <div className='space-y-4 p-6'>
                            <div>
                                <label className='mb-2 block text-sm font-medium text-gray-700'>
                                    Category Name
                                </label>
                                <input
                                    type='text'
                                    value={newCategoryName}
                                    onChange={(
                                        e: ChangeEvent<HTMLInputElement>
                                    ) => setNewCategoryName(e.target.value)}
                                    placeholder='e.g., Pizza, Burger, Dessert...'
                                    className='w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500'
                                    disabled={creatingCategory}
                                />
                            </div>

                            <div className='flex items-center gap-3'>
                                <input
                                    id='isTopping'
                                    type='checkbox'
                                    checked={newCategoryIsTopping}
                                    onChange={(
                                        e: ChangeEvent<HTMLInputElement>
                                    ) =>
                                        setNewCategoryIsTopping(
                                            e.target.checked
                                        )
                                    }
                                    className='h-4 w-4 cursor-pointer rounded border-gray-300'
                                    disabled={creatingCategory}
                                />
                                <label
                                    htmlFor='isTopping'
                                    className='cursor-pointer text-sm font-medium text-gray-700'
                                >
                                    🌶️ Is Topping?
                                </label>
                            </div>
                        </div>

                        <div className='flex justify-end gap-3 border-t border-gray-200 bg-gray-50 p-4'>
                            <button
                                onClick={() =>
                                    setShowCreateCategoryModal(false)
                                }
                                disabled={creatingCategory}
                                className='rounded-lg border border-gray-300 bg-white px-6 py-2 font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50'
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => void handleCreateCategory()}
                                disabled={creatingCategory}
                                className='rounded-lg bg-green-500 px-6 py-2 font-medium text-white hover:bg-green-600 disabled:opacity-50'
                            >
                                {creatingCategory ? 'Creating...' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductPage;
