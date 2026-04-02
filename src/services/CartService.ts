import type { CreateAddCartRequest, UpdateCartItemRequest, CartResponse } from "../types/Cart";
import { CART_ADD_URL, CART_ITEM_DELETE_URL, CART_ITEM_URL, CART_URL } from "../constants/apiEndPoints";
import api, { http } from "../api/axios";
import { AUTH_SERVICE_URL } from "@/constants/api";

// Rate limiting helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simple cache for cart data
let cartCache: { data: CartResponse | null; timestamp: number; customerId: string } = {
    data: null,
    timestamp: 0,
    customerId: ''
};

const CACHE_DURATION = 2000; // 2 seconds cache (reduced from 10 seconds)

// Retry helper for 429 errors
async function retryApiCall<T>(
    apiCall: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await apiCall();
        } catch (error: any) {
            lastError = error;

            // Only retry for 429 (Too Many Requests) errors
            if (error.response?.status === 429 && attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
                console.warn(`🔄 Rate limited (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`);
                await sleep(delay);
                continue;
            }

            // Don't retry for other errors or if max retries reached
            throw error;
        }
    }

    throw lastError;
}

// Clear cache helper
function clearCartCache() {
    cartCache = { data: null, timestamp: 0, customerId: '' };
    console.log('🧹 Cart cache cleared');
}

// Test if cart API endpoint is working
async function testCartEndpoint(): Promise<boolean> {
    try {
        // Test with a simple GET request to check if API is alive
        const response = await api.get('/api/products/cart', {
            params: { customerId: 'test-health-check' },
            timeout: 5000,
            headers: { 'X-Skip-Auth': 'true' }
        });
        console.log('✅ Cart API endpoint is responding');
        return true;
    } catch (error: any) {
        console.error('❌ Cart API endpoint test failed:', error?.response?.status || error.message);
        return false;
    }
}

// Advanced backend diagnostic
async function diagnoseBackend(): Promise<object> {
    console.log('🔬 Starting backend diagnostic...');

    const results = {
        apiHealth: false,
        databaseConnection: false,
        authService: false,
        specificErrors: [] as string[]
    };

    // 1. Test API Gateway
    try {
        const response = await api.get('/api/health', { timeout: 5000 });
        results.apiHealth = true;
        console.log('✅ API Gateway responding');
    } catch (error: any) {
        results.specificErrors.push(`API Gateway: ${error?.response?.status || error.message}`);
        console.error('❌ API Gateway issue:', error?.response?.status || error.message);
    }

    // 2. Test Cart API specifically
    try {
        await testCartEndpoint();
        results.databaseConnection = true;
    } catch (error: any) {
        results.specificErrors.push(`Cart API: ${error?.response?.status || error.message}`);
    }

    // 3. Test Authentication
    try {
        const response = await api.get('/api/auth/verify', { timeout: 5000 });
        results.authService = true;
        console.log('✅ Auth Service responding');
    } catch (error: any) {
        results.specificErrors.push(`Auth Service: ${error?.response?.status || error.message}`);
        console.warn('⚠️ Auth Service issue (may be normal for public endpoints)');
    }

    return results;
}

const CartService = {
    async addToCart(data: CreateAddCartRequest): Promise<{ message: string }> {
        console.log('🔍 CartService.addToCart called with:', data);
        console.log('🔍 Request payload:', JSON.stringify(data, null, 2));
        console.log('🔍 API Endpoint:', CART_ADD_URL);

        // Enhanced validation
        if (!data.customerId || !data.productId || !data.variantId || !data.quantity) {
            const error = new Error('Missing required fields in cart request');
            console.error('❌ Validation failed:', {
                customerId: !!data.customerId,
                productId: !!data.productId,
                variantId: !!data.variantId,
                quantity: !!data.quantity
            });
            throw error;
        }

        // Validate data types and formats
        if (typeof data.customerId !== 'string' || data.customerId.trim() === '') {
            console.error('❌ Invalid customerId:', data.customerId);
            throw new Error('customerId must be a non-empty string');
        }

        if (typeof data.productId !== 'string' || data.productId.trim() === '') {
            console.error('❌ Invalid productId:', data.productId);
            throw new Error('productId must be a non-empty string');
        }

        if (typeof data.variantId !== 'string' || data.variantId.trim() === '') {
            console.error('❌ Invalid variantId:', data.variantId);
            throw new Error('variantId must be a non-empty string');
        }

        if (typeof data.quantity !== 'number' || data.quantity <= 0 || !Number.isInteger(data.quantity)) {
            console.error('❌ Invalid quantity:', data.quantity);
            throw new Error('quantity must be a positive integer');
        }

        // Validate UUID format (basic check)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(data.customerId)) {
            console.warn('⚠️ customerId might not be a valid UUID format:', data.customerId);
        }
        if (!uuidRegex.test(data.productId)) {
            console.warn('⚠️ productId might not be a valid UUID format:', data.productId);
        }
        if (!uuidRegex.test(data.variantId)) {
            console.warn('⚠️ variantId might not be a valid UUID format:', data.variantId);
        }

        try {
            console.log('🔄 Calling server API:', CART_ADD_URL);
            console.log('🔄 Base URL:', api.defaults.baseURL);
            console.log('🔄 Full URL:', `${api.defaults.baseURL || ''}${CART_ADD_URL}`);

            const response = await retryApiCall(() =>
                api.post<{ message: string }>(CART_ADD_URL, data)
            );

            console.log('✅ Server API success:', response.data);

            // Clear cache after successful add
            clearCartCache();

            return response.data;
        } catch (serverError: any) {
            console.error('❌ Server API failed:', {
                status: serverError?.response?.status,
                statusText: serverError?.response?.statusText,
                data: serverError?.response?.data,
                message: serverError?.message,
                url: serverError?.config?.url,
                method: serverError?.config?.method,
                requestData: serverError?.config?.data,
                headers: serverError?.config?.headers
            });

            // More specific error messages
            if (serverError?.response?.status === 400) {
                console.error('❌ Bad Request - Check if UUIDs are valid format');
            } else if (serverError?.response?.status === 401) {
                console.error('❌ Unauthorized - Check authentication headers');
            } else if (serverError?.response?.status === 404) {
                console.error('❌ Not Found - Check if product/variant exists');
            }

            throw serverError;
        }
    },

    async getCart(customerId: string, forceRefresh: boolean = false): Promise<CartResponse> {
        console.log('🔍 CartService.getCart called with customerId:', customerId, 'forceRefresh:', forceRefresh);

        // Check cache first (unless force refresh)
        const now = Date.now();
        if (
            !forceRefresh &&
            cartCache.data &&
            cartCache.customerId === customerId &&
            (now - cartCache.timestamp) < CACHE_DURATION
        ) {
            console.log('🔄 Using cached cart data');
            return cartCache.data;
        }

        try {
            console.log('📡 Fetching cart from server...');
            const response = await retryApiCall(() =>
                api.get<CartResponse>(CART_URL, {
                    params: { customerId },
                })
            );

            console.log('✅ Server getCart success', response.data);

            // Update cache
            cartCache = {
                data: response.data,
                timestamp: now,
                customerId
            };

            return response.data;
        } catch (serverError: any) {
            console.error('❌ Server getCart failed:', {
                status: serverError.response?.status,
                data: serverError.response?.data,
                message: serverError.message
            });

            // Handle 429 specifically
            if (serverError.response?.status === 429) {
                console.warn('⚠️ Rate limited - using cached data if available');
                if (cartCache.data && cartCache.customerId === customerId) {
                    console.log('📦 Fallback to cached cart data due to rate limit');
                    return cartCache.data;
                }
            }

            throw serverError;
        }
    },

    async updateCartItem(data: UpdateCartItemRequest): Promise<{ message: string }> {
        try {
            const response = await retryApiCall(() =>
                api.put<{ message: string }>(CART_ITEM_URL, data)
            );

            console.log('✅ Server updateCartItem success');

            // Clear cache after successful update
            clearCartCache();

            return response.data;
        } catch (serverError: any) {
            console.error('❌ Server updateCartItem failed:', {
                status: serverError.response?.status,
                data: serverError.response?.data,
                message: serverError.message
            });
            throw serverError;
        }
    },

    async removeCartItem(id: number): Promise<{ message: string }> {
        try {
            const response = await retryApiCall(() =>
                api.delete<{ message: string }>(`${CART_ITEM_DELETE_URL}/${id}`)
            );

            console.log('✅ Server removeCartItem success');

            // Clear cache after successful removal
            clearCartCache();

            return response.data;
        } catch (serverError: any) {
            console.error('❌ Server removeCartItem failed:', {
                status: serverError.response?.status,
                data: serverError.response?.data,
                message: serverError.message
            });
            throw serverError;
        }
    },

    // Test API endpoint health
    async testEndpoint(): Promise<boolean> {
        return await testCartEndpoint();
    },

    // Advanced backend diagnostic
    async diagnoseBackend(): Promise<object> {
        return await diagnoseBackend();
    },

    // Debug helper
    logCartCache() {
        console.log('📦 Current cart cache:', cartCache);
    }
};

export default CartService;
