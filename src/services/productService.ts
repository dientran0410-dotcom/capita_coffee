import { http } from '../utils/axiosClient';
import type {
    ProductAvailabilityRequest,
    ProductCreateRequest,
    ProductResponse,
    ProductUpdateRequest,
} from '@/types/product';

const API_BASE = '/products';

export interface Product {
    id: string;
    sku: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    quantity: number;
    categoryId: string;
    categoryName: string;
    imageUrl: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

// Backend returns VariantMenuResponse with "variantId" field (not "id")
export interface ProductVariant {
    id?: string;              // Fallback compatibility
    variantId?: string;       // ✅ Real field from backend VariantMenuResponse
    variantName: string;
    name?: string;            // Fallback compatibility
    price: number;
}

export interface ProductPageResponse {
    totalPages: number;
    totalElements: number;
    first: boolean;
    last: boolean;
    numberOfElements: number;
    size: number;
    number: number;
    empty: boolean;
    content: Product[];
}

export interface GetProductsParams {
    keyword?: string;
    query?: string;
    categoryId?: string;
    franchiseId?: string;
    status?: string;
    minPrice?: string | number;
    maxPrice?: string | number;
    isActive?: boolean;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
}

function buildProductsQuery(params: GetProductsParams = {}) {
    const query = new URLSearchParams();

    if (params.keyword) query.set('keyword', params.keyword);
    if (!params.keyword && params.query) query.set('keyword', params.query);
    if (params.categoryId) query.set('categoryId', params.categoryId);
    if (params.franchiseId) query.set('franchiseId', params.franchiseId);
    if (params.minPrice !== undefined && params.minPrice !== '') {
        query.set('minPrice', String(params.minPrice));
    }
    if (params.maxPrice !== undefined && params.maxPrice !== '') {
        query.set('maxPrice', String(params.maxPrice));
    }

    if (params.status) {
        query.set('status', params.status);
    } else if (typeof params.isActive === 'boolean') {
        query.set('status', params.isActive ? 'ACTIVE' : 'INACTIVE');
    }

    query.set('page', String(params.page ?? 0));
    query.set('size', String(params.size ?? 20));
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortDir) query.set('sortDir', params.sortDir);

    return query.toString();
}

export async function getProducts(params: GetProductsParams = {}) {
    const query = buildProductsQuery(params);
    console.log('🔍 getProducts - Making API call with query:', query);
    console.log('🔍 Full URL will be:', `/products?${query}`);

    try {
        const response = await http(`/products?${query}`, {
            skipAuth: true
        }) as ProductPageResponse;

        console.log('✅ getProducts - Success response:', response);
        return response;
    } catch (error: any) {
        console.error('❌ getProducts - API call failed:', {
            status: error?.status,
            message: error?.message,
            stack: error?.stack,
        });

        // Preserve original AppError (status/message) from http() so callers can retry correctly.
        throw error;
    }
}

export async function getProductById(id: string) {
    console.log('🔍 getProductById - Fetching product details for ID:', id);
    console.log('🔍 Full URL will be:', `/products/${id}`);

    try {
        const response = await http(`/products/${id}`, { skipAuth: true }) as Product;
        console.log('✅ getProductById - Success response:', response);
        return response;
    } catch (error: any) {
        console.error('❌ getProductById - API call failed:', {
            status: error?.status,
            message: error?.message,
            productId: id
        });

        const status = error?.status;

        if (status === 404) {
            console.error('🔍 Product not found with ID:', id);
            const notFound = new Error(`Product with ID "${id}" not found.`) as Error & { status?: number };
            notFound.status = status;
            throw notFound;
        } else if (status === 500) {
            console.error('🔥 Server Error - Database or backend service issue');
            const serverErr = new Error(
                'Backend service error. Please check if product-service and database are running.',
            ) as Error & { status?: number };
            serverErr.status = status;
            throw serverErr;
        }

        throw error;
    }
}

export async function getProductVariants(productId: string) {
    console.log('🔍 getProductVariants called for productId:', productId);
    console.log('🔍 Request URL:', `/products/${productId}/variants`);

    try {
        const response = await http(`/products/${productId}/variants`, {
            skipAuth: true,
        }) as ProductVariant[];

        console.log('🔍 Raw backend response:', response);

        // ✅ Debug: Log each variant in detail
        if (response && Array.isArray(response)) {
            response.forEach((variant, index) => {
                console.log(`🔍 Variant ${index + 1} detailed structure:`, {
                    rawVariant: variant,
                    keys: Object.keys(variant),
                    values: Object.values(variant),
                    variantId_field: variant.variantId,
                    id_field: variant.id,
                    variantName_field: variant.variantName,
                    name_field: variant.name,
                    price_field: variant.price
                });
            });
        }

        return response;
    } catch (error) {
        console.error('❌ Error in getProductVariants:', error);
        throw error;
    }
}

export async function createProduct(
    data: ProductCreateRequest,
): Promise<ProductResponse> {
    const name = String(data.name || '').trim();
    const categoryId = String(data.categoryId || '').trim();
    const descriptionRaw =
        typeof data.description === 'string' ? data.description.trim() : data.description;
    const description = descriptionRaw ? String(descriptionRaw) : null;

    const rawImageUrl = typeof data.imageUrl === 'string' ? data.imageUrl.trim() : '';
    const isDataUrl = /^data:/i.test(rawImageUrl);
    const isHttpUrl = /^https?:\/\//i.test(rawImageUrl);

    // NOTE: Many backends validate imageUrl as HTTP(S) URL; base64 is handled via /products/{id}/image.
    const payload: any = {
        name,
        description,
        categoryId,
        variants: (data.variants || []).map((variant: any) => {
            const variantName = String(variant?.name || variant?.variantName || '').trim();
            const v: any = {
                // Send both keys for compatibility (backend may expect variantName).
                name: variantName,
                variantName,
                price: Number(variant?.price ?? 0),
                isDefault: Boolean(variant?.isDefault),
            };

            if (Array.isArray(variant?.ingredients) && variant.ingredients.length) {
                v.ingredients = variant.ingredients
                    .filter((ing: any) => ing?.ingredientId)
                    .map((ing: any) => ({
                        ingredientId: String(ing.ingredientId),
                        quantity: Number(ing.quantity ?? 0),
                    }));
            }

            return v;
        }),
    };

    const franchiseId = (data as any)?.franchiseId;
    if (franchiseId != null && String(franchiseId).trim() !== '') {
        payload.franchiseId = String(franchiseId).trim();
    }

    if (rawImageUrl && isHttpUrl && !isDataUrl) {
        payload.imageUrl = rawImageUrl;
    }

    // IMPORTANT: do not wrap/replace http() errors; preserve status + raw for UI debugging.
    return (await http(`${API_BASE}`, {
        method: 'POST',
        body: JSON.stringify(payload),
    })) as ProductResponse;
}

export async function toggleProductAvailability(
    productId: string,
    isAvailable: boolean,
): Promise<any> {
    try {
        return await http(`${API_BASE}/${productId}/availability`, {
            method: 'PATCH',
            body: JSON.stringify({ isAvailable } as ProductAvailabilityRequest),
        });
    } catch (error: any) {
        const errMsg =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            'Toggle product availability failed';
        throw new Error(errMsg);
    }
}

export async function updateProductById(
    id: string,
    updateData: ProductUpdateRequest,
): Promise<ProductResponse> {
    try {
        const rawImageUrl = typeof updateData.imageUrl === 'string' ? updateData.imageUrl.trim() : '';
        const isDataUrl = /^data:/i.test(rawImageUrl);
        const isHttpUrl = /^https?:\/\//i.test(rawImageUrl);

        // Nếu UI dùng ImageUploader (base64) thì không gửi imageUrl vào update endpoint.
        // Ảnh sẽ được xử lý qua endpoint riêng /products/{id}/image.
        const payload: any = {
            ...updateData,
            description: updateData.description ?? null,
        };

        if (!rawImageUrl || isDataUrl || !isHttpUrl) {
            delete payload.imageUrl;
        } else {
            payload.imageUrl = rawImageUrl;
        }

        return (await http(`${API_BASE}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        })) as ProductResponse;
    } catch (error: any) {
        const errMsg = error?.message || 'Unable to update product.';
        throw new Error(errMsg);
    }
}

// Health check functions for debugging
export async function checkBackendHealth() {
    console.log('🏥 Checking backend service health...');

    try {
        // Test basic connectivity
        await http('/products?page=0&size=1', { skipAuth: true });
        console.log('✅ Backend service is responsive');
        return { status: 'healthy', message: 'Backend service is running' };
    } catch (error: any) {
        console.error('❌ Backend health check failed:', error);

        if (error?.status === 500) {
            return {
                status: 'error',
                message: 'Backend service is running but database connection failed',
                details: 'Check PostgreSQL database connection',
            };
        } else if (error?.status === 0 || !error?.status) {
            return {
                status: 'error',
                message: 'Cannot connect to backend service',
                details: 'Check if product-service is running on port 8181',
            };
        } else {
            return {
                status: 'error',
                message: `Backend responded with error: ${error?.status}`,
                details: error?.message || 'Unknown error',
            };
        }
    }
}

// Test specific endpoints
export async function testProductEndpoints() {
    console.log('🧪 Testing product service endpoints...');

    const tests = [
        { name: 'Products List', endpoint: '/products?page=0&size=5' },
        { name: 'Product Categories', endpoint: '/products/menu' },
    ];

    const results = [];

    for (const test of tests) {
        try {
            console.log(`📋 Testing ${test.name}...`);
            await http(test.endpoint, { skipAuth: true });
            console.log(`✅ ${test.name}: PASS`);
            results.push({ name: test.name, status: 'PASS' });
        } catch (error: any) {
            console.error(`❌ ${test.name}: FAIL -`, error?.message);
            results.push({
                name: test.name,
                status: 'FAIL',
                error: error?.message,
                statusCode: error?.status,
            });
        }
    }

    return results;
}

export async function updateProductImage(
    id: string,
    imageUrl: string,
): Promise<any> {
    try {
        return await http(`${API_BASE}/${id}/image`, {
            method: 'PUT',
            body: JSON.stringify({ imageUrl }),
        });
    } catch (error: any) {
        const errMsg =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            'Update product image failed';
        throw new Error(errMsg);
    }
}

