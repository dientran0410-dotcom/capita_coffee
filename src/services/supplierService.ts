// Đường dẫn file: src/api/supplierApi.ts

import { http } from "../utils/axiosClient"; 
import { SUPPLIER_URL } from "../constants/apiEndPoints";

const normalizeDateTimeQuery = (value: unknown): string => {
    const raw = String(value ?? "").trim();
    if (!raw) return "";

    // `datetime-local` returns `YYYY-MM-DDTHH:mm`; backend date-time filters often require seconds.
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) {
        return `${raw}:00`;
    }

    return raw;
};

const buildUserHeaders = (user?: string) => {
    const userId = String(user || "").trim();
    if (!userId) {
        return {};
    }

    return {
        "X-User-Id": userId,
        USER: userId,
    };
};

/* =========================
   GET ALL & DASHBOARD
========================= */
export const getAllSuppliers = async (page: number = 0, size: number = 10): Promise<any> => {
    return http(`${SUPPLIER_URL}/all-statuses?page=${page}&size=${size}`);
};

export const getAllSuppliersInDashboard = async (page: number = 0, size: number = 10): Promise<any> => {
    return http(`${SUPPLIER_URL}/all-statuses?page=${page}&size=${size}`);
};

export const getDashboardSummary = async (): Promise<any> => {
    return http(`${SUPPLIER_URL}/dashboard-summary`);
};

/* =========================
   FILTER & SEARCH SUPPLIER
========================= */
export const filterSuppliers = async (params: Record<string, any>): Promise<any> => {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
        const value = key === "updatedAfter" ? normalizeDateTimeQuery(params[key]) : params[key];
        if (value !== "" && value !== null && value !== undefined) {
            query.append(key, String(value));
        }
    });
    return http(`${SUPPLIER_URL}/filter?${query.toString()}`);
};

export const searchSuppliersByKeyword = async (keyword: string, page: number = 0, size: number = 10): Promise<any> => {
    return http(`${SUPPLIER_URL}/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`);
};

/* =========================
   CRUD SUPPLIER
========================= */
export const getSupplierById = async (id: string | number): Promise<any> => {
    return http(`${SUPPLIER_URL}/${id}`);
};

export const getSupplierAccountByAccountId = async (accountId: string | number): Promise<any> => {
    return http(`/api/suppliers/account/${encodeURIComponent(String(accountId))}`);
};

export const createSupplier = async (dataBody: any, user: string): Promise<any> => {
    return http(`${SUPPLIER_URL}`, {
        method: "POST",
        headers: buildUserHeaders(user), 
        body: JSON.stringify(dataBody),
    });
};

export const updateSupplier = async (id: string | number, dataBody: any, user: string): Promise<any> => {
    return http(`${SUPPLIER_URL}/${id}`, {
        method: "PUT",
        headers: buildUserHeaders(user), 
        body: JSON.stringify(dataBody),
    });
};

export const deleteSupplier = async (id: string | number, userName: string): Promise<any> => {
    return http(`${SUPPLIER_URL}/${id}`, {
        method: "DELETE",
        headers: buildUserHeaders(userName), 
    });
};

/* =========================
   SUPPLIER ACTIONS
========================= */
export const toggleSuspend = async (id: string | number, user: string): Promise<any> => {
    return http(`${SUPPLIER_URL}/${id}/toggle-suspend`, {
        method: "PATCH",
        headers: buildUserHeaders(user),
    });
};

export const reviewSupplier = async (id: string | number, status: string, user: string, reason: string = ""): Promise<any> => {
    return http(
        `${SUPPLIER_URL}/${id}/review?status=${status}&reason=${encodeURIComponent(reason)}`,
        {
            method: "PATCH",
            headers: buildUserHeaders(user),
        }
    );
};

export const getApprovedSuppliers = async (page: number = 0, size: number = 10): Promise<any> => {
    return http(`${SUPPLIER_URL}/approved?page=${page}&size=${size}`);
};

export const getSupplierAuditLogs = async (supplierId: string | number, page: number = 0, size: number = 10): Promise<any> => {
    return http(`${SUPPLIER_URL}/${supplierId}/audit-logs?page=${page}&size=${size}`);
};

export const getAllSupplierAuditLogs = async (page: number = 0, size: number = 10): Promise<any> => {
    return http(`${SUPPLIER_URL}/audit-logs/all?page=${page}&size=${size}`);
};

export const getAdminCustomerProfileByUserId = async (userId: string): Promise<any> => {
    return http(`/api/auth-service/admin/customers/${encodeURIComponent(userId)}/profile`);
};

/* =========================
   SUPPLIER PRODUCTS
========================= */
export const getProductsBySupplierId = async (
    supplierId: string | number,
    params: { page?: number; size?: number; } = { page: 0, size: 10 }
): Promise<any> => {
    const query = new URLSearchParams();
    Object.keys(params).forEach((key) => {
        const value = params[key as keyof typeof params];
        if (value !== null && value !== undefined) query.append(key, String(value));
    });
    return http(`${SUPPLIER_URL}/${supplierId}/products?${query.toString()}`);
};

export const getAllProductsWithAllStatusesBySupplierId = async (
    supplierId: string | number,
    params: {
        page?: number;
        size?: number;
        sortBy?: string;
        sortDir?: "asc" | "desc";
    } = {}
): Promise<any> => {
    const query = new URLSearchParams();
    query.set("page", String(params.page ?? 0));
    query.set("size", String(params.size ?? 10));
    query.set("sortBy", params.sortBy ?? "createAt");
    query.set("sortDir", params.sortDir ?? "desc");

    return http(`${SUPPLIER_URL}/${supplierId}/products/all-statuses?${query.toString()}`);
};

export const createSupplierProduct = async (
    supplierId: string | number,
    dataBody: {
        name: string;
        unit: string;
        description: string;
        pricePerUnit: number;
        minOrderQuantity: number;
        leadTimeDays: number;
    }
): Promise<any> => {
    return http(`${SUPPLIER_URL}/${supplierId}/products`, {
        method: "POST",
        body: JSON.stringify(dataBody),
    });
};

export const updateSupplierProduct = async (supplierId: string | number, supplierProductId: string | number, dataBody: any): Promise<any> => {
    return http(`${SUPPLIER_URL}/${supplierId}/products/${supplierProductId}`, {
        method: "PATCH",
        body: JSON.stringify(dataBody),
    });
};

export const deleteSupplierProduct = async (supplierId: string | number, supplierProductId: string | number): Promise<any> => {
    return http(`${SUPPLIER_URL}/${supplierId}/products/${supplierProductId}`, {
        method: "DELETE",
    });
};

export const searchSupplierProducts = async (params: Record<string, any>): Promise<any> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
            query.append(key, String(value));
        }
    });
    return http(`${SUPPLIER_URL}/products/search?${query.toString()}`);
};

export const compareSuppliers = async (productId: string | number): Promise<any> => {
    return http(`${SUPPLIER_URL}/products/${productId}/compare`);
};

export const getAllSupplierProductsByStatuses = async (
    params: {
        page?: number;
        size?: number;
        sortBy?: string;
        sortDir?: "asc" | "desc";
    } = {}
): Promise<any> => {
    const query = new URLSearchParams();
    query.set("page", String(params.page ?? 0));
    query.set("size", String(params.size ?? 10));
    query.set("sortBy", params.sortBy ?? "createAt");
    query.set("sortDir", params.sortDir ?? "desc");

    return http(`${SUPPLIER_URL}/products/all-statuses?${query.toString()}`);
};