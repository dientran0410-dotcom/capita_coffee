import { http } from "@/utils/axiosClient";

const unwrapResponse = (response: any) => {
    if (!response) return null;
    return response?.data ?? response?.result ?? response;
};

const extractOrders = (payload: any) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.orders)) return payload.orders;
    if (Array.isArray(payload.data?.orders)) return payload.data.orders;
    if (Array.isArray(payload.result?.orders)) return payload.result.orders;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.records)) return payload.records;
    return [];
};

const normalizeStats = (payload: any) => {
    const statsSource = payload?.stats ?? payload;
    return {
        totalOrders: Number(
            statsSource?.totalOrders ??
            statsSource?.total ??
            statsSource?.count ??
            statsSource?.orderCount ??
            0
        ),
        preparing: Number(
            statsSource?.preparing ??
            statsSource?.ongoing ??
            statsSource?.inProgress ??
            0
        ),
        delivered: Number(
            statsSource?.delivered ??
            statsSource?.completed ??
            statsSource?.success ??
            0
        ),
    };
};

const buildQueryString = (params: Record<string, any>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        query.append(key, String(value));
    });
    return query.toString();
};

// Backend list endpoints in this repo are 0-based page index and typically use `limit`.
// Normalize common UI params (page=1, pageSize=25) -> (page=0, limit=25).
const normalizeListParams = (params?: Record<string, any>) => {
    if (!params) return undefined;
    const next: Record<string, any> = { ...params };

    if (next.limit == null) {
        if (next.pageSize != null) {
            next.limit = next.pageSize;
            delete next.pageSize;
        } else if (next.size != null) {
            next.limit = next.size;
            delete next.size;
        }
    }

    if (next.page != null) {
        const raw = Number(next.page);
        if (Number.isFinite(raw)) {
            // Treat UI inputs as 1-based; backend expects 0-based.
            next.page = raw <= 0 ? 0 : raw - 1;
        }
    }

    return next;
};

export type OrderRecord = {
    orderId?: string;
    id?: string;
    orderNumber?: string;
    code?: string;
    status?: string;
    paymentStatus?: string;
    orderSource?: string;
    customerId?: string;
    franchiseId?: string;
    supplierId?: string;
    supplierApproved?: boolean;

    // Common display fields (shapes vary by backend deployment)
    storeName?: string;
    franchiseName?: string;
    supplierName?: string;
    orderDate?: string;
    createdAt?: string;
    updatedAt?: string;

    customer?: {
        name?: string;
        phone?: string;
    };

    recipientName?: string;
    paymentMethod?: string;
    paymentType?: string;

    totalAmount?: number;
    amount?: number;
    total?: number;
    codAmount?: number;

    orderItems?: Array<{ name?: string; productId?: string; quantity?: number; price?: number }>;
    items?: Array<{ name?: string; productId?: string; quantity?: number; price?: number }>;
};

export type OrderStatsPayload = {
    totalOrders: number;
    preparing: number;
    delivered: number;
};

const ORDERS_PATH = '/products/orders';
const buildUrlWithQuery = (path: string, params?: Record<string, any>) => {
    const normalized = normalizeListParams(params);
    if (!normalized) return path;
    const queryString = buildQueryString(normalized);
    return queryString ? `${path}?${queryString}` : path;
};

const CUSTOMER_ORDERS_CACHE_MS = 5000;
let customerOrdersCache: {
    key: string;
    timestamp: number;
    value: { orders: OrderRecord[]; meta: any };
} | null = null;

export const getOrdersCOD = async (params: Record<string, any> = {}) => {
    const response = await http(buildUrlWithQuery(`${ORDERS_PATH}/cod`, params));
    const payload = unwrapResponse(response);
    return {
        orders: extractOrders(payload) as OrderRecord[],
        meta: payload?.meta ?? payload?.pagination ?? null,
    };
};

export const getCustomerOrders = async (params: Record<string, any> = {}) => {
    const url = buildUrlWithQuery(`${ORDERS_PATH}/list`, params);
    const now = Date.now();

    if (
        customerOrdersCache &&
        customerOrdersCache.key === url &&
        now - customerOrdersCache.timestamp < CUSTOMER_ORDERS_CACHE_MS
    ) {
        return customerOrdersCache.value;
    }

    const response = await http(url);
    const payload = unwrapResponse(response);
    const value = {
        orders: extractOrders(payload) as OrderRecord[],
        meta: payload?.meta ?? payload?.pagination ?? null,
    };

    customerOrdersCache = { key: url, timestamp: now, value };
    return value;
};

export const getOrderHistory = async (params: Record<string, any> = {}) => {
    const response = await http(buildUrlWithQuery(`${ORDERS_PATH}/history`, params));
    const payload = unwrapResponse(response);
    return {
        orders: extractOrders(payload) as OrderRecord[],
        meta: payload?.meta ?? payload?.pagination ?? null,
    };
};

export const getOrderList = async (params: Record<string, any> = {}) => {
    const response = await http(buildUrlWithQuery(`${ORDERS_PATH}/list`, params));
    const payload = unwrapResponse(response);
    return {
        orders: extractOrders(payload) as OrderRecord[],
        meta: payload?.meta ?? payload?.pagination ?? payload?.data ?? null,
    };
};

export const getAllOrders = async () => {
    const response = await http(`${ORDERS_PATH}/list`);
    const payload = unwrapResponse(response);

    return {
        orders: extractOrders(payload) as OrderRecord[],
        meta: null,
    };
};

export const getOrderById = (id: string) => http(`${ORDERS_PATH}/${id}`);

export const getOrderStatus = (id: string) => http(`${ORDERS_PATH}/${id}/status`);

export const estimateOrderTime = (id: string) => http(`${ORDERS_PATH}/${id}/estimate-time`);

export const createOrder = (payload: Record<string, any>) =>
    http(`${ORDERS_PATH}`, {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const updateOrder = (id: string, payload: Record<string, any>) =>
    http(`${ORDERS_PATH}/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });

export const updateOrderStatus = (id: string, status: string) =>
    http(`${ORDERS_PATH}/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
    });

export const reassignOrder = (orderId: string, payload: Record<string, any>) =>
    http(`${ORDERS_PATH}/${orderId}/reassign`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });

export const cancelOrderItem = (orderId: string, itemId: string, reason?: string) =>
    http(`${ORDERS_PATH}/${orderId}/items/${itemId}/cancel`, {
        method: "PUT",
        body: JSON.stringify({ reason }),
    });

export const cancelOrder = (id: string, payload?: Record<string, any>) =>
    http(`${ORDERS_PATH}/${id}/cancel`, {
        method: "PUT",
        body: JSON.stringify(payload ?? {}),
    });

export const staffCancelOrder = (id: string, payload?: Record<string, any>) =>
    http(`${ORDERS_PATH}/${id}/staff-cancel`, {
        method: "PUT",
        body: JSON.stringify(payload ?? {}),
    });

export const flagOrder = (orderId: string, payload: Record<string, any>) =>
    http(`${ORDERS_PATH}/${orderId}/flag`, {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const paymentCallback = (id: string, payload: Record<string, any>) =>
    http(`${ORDERS_PATH}/${id}/payment-callback`, {
        method: "POST",
        body: JSON.stringify(payload),
    });

export const getOrderStats = async (): Promise<OrderStatsPayload> => {
    const response = await http(`/orders/stats`);
    const payload = unwrapResponse(response);
    return normalizeStats(payload);
};

export const connectLiveOrders = (options?: { token?: string; onOpen?: () => void; onError?: (err: Event) => void }) => {
    const url = new URL(`/api/orders/live`, window.location.origin);
    if (options?.token) {
        url.searchParams.set("access_token", options.token);
    }
    const eventSource = new EventSource(url.toString());
    eventSource.onopen = () => options?.onOpen?.();
    eventSource.onerror = (err) => options?.onError?.(err);
    return eventSource;
};

// Aliases for cross-source compatibility.
export const getCODOrders = getOrdersCOD;
export const getById = getOrderById;
export const create = createOrder;
export const updateStatus = updateOrderStatus;
export const getStats = getOrderStats;
