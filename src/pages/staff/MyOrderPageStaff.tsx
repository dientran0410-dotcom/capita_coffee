import { useEffect, useMemo, useRef, useState } from "react";
import {
    AlertTriangle,
    Package,
    Search,
    Clock,
    CheckCircle2,
    Truck,
    RotateCcw,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { getCustomerOrders, getOrderById } from "../../services/orderService";

import type { OrderRecord } from "../../services/orderService";
import invoiceService from "../../services/InvoiceService";
import { getProductById } from "../../services/productService";
import { readPaymentResults } from "../../utils/paymentHistory";

const STATUS_META = {
    processing: { label: "Đang pha chế", icon: Clock, color: "text-amber-600" },
    in_transit: { label: "Đang giao", icon: Truck, color: "text-blue-600" },
    shipped: { label: "Đang giao", icon: Truck, color: "text-blue-600" },
    delivered: {
        label: "Đã giao",
        icon: CheckCircle2,
        color: "text-emerald-600",
    },
    paid: {
        label: "Đã thanh toán",
        icon: CheckCircle2,
        color: "text-emerald-600",
    },
    failed: { label: "Thất bại", icon: AlertTriangle, color: "text-rose-600" },
    cancelled: { label: "Đã hủy", icon: RotateCcw, color: "text-rose-600" },
    blocked: { label: "Bị chặn", icon: AlertTriangle, color: "text-rose-600" },
    pending: { label: "Chờ xử lý", icon: Clock, color: "text-gray-600" },
    unknown: { label: "Chưa rõ", icon: Clock, color: "text-gray-500" },
};

const FILTER_OPTIONS = ["Tất cả", "Đã thanh toán", "Thất bại"];

type OrderItemLike = {
    name?: string;
    productName?: string;
    title?: string;
    productId?: string;
    variantId?: string;
    sku?: string;
    quantity?: number;
    qty?: number;
    amount?: number;
    price?: number;
    unitPrice?: number;
    subtotal?: number;
    product?: { name?: string };
    variant?: { name?: string; size?: string };
    productVariant?: { name?: string; size?: string };
};

type OrderDetailLike = Record<string, any>;

const orderDetailCache = new Map<string, OrderDetailLike>();
const orderDetailInFlight = new Map<string, Promise<OrderDetailLike>>();

const PRODUCT_NAME_CACHE_MS = 5 * 60 * 1000;
const productNameCache = new Map<string, { name: string; ts: number }>();
const productNameInFlight = new Map<string, Promise<string | undefined>>();

function getCachedProductName(productId: string): string | undefined {
    const hit = productNameCache.get(productId);
    if (!hit) return undefined;
    if (Date.now() - hit.ts > PRODUCT_NAME_CACHE_MS) {
        productNameCache.delete(productId);
        return undefined;
    }
    return hit.name;
}

async function resolveProductName(
    productId: string
): Promise<string | undefined> {
    const cached = getCachedProductName(productId);
    if (cached) return cached;

    const inflight = productNameInFlight.get(productId);
    if (inflight) return inflight;

    const p = (async () => {
        try {
            const product = await getProductById(productId);
            const name = String((product as any)?.name || "").trim();
            if (name) {
                productNameCache.set(productId, { name, ts: Date.now() });
                return name;
            }
            return undefined;
        } catch {
            return undefined;
        } finally {
            productNameInFlight.delete(productId);
        }
    })();

    productNameInFlight.set(productId, p);
    return p;
}

function unwrapOrderDetail(payload: any): OrderDetailLike {
    if (!payload) return {};
    return payload?.data ?? payload?.result ?? payload?.order ?? payload;
}

function extractOrderItems(source: any): OrderItemLike[] {
    if (!source) return [];
    const candidates = [
        source?.orderItems,
        source?.items,
        source?.details,
        source?.orderDetails,
        source?.orderItemResponses,
        source?.orderLines,
        source?.orderLineItems,
        source?.lineItems,
        source?.products,
        source?.cartItems,
        source?.invoiceItems,
    ];

    for (const c of candidates) {
        if (Array.isArray(c)) return c as OrderItemLike[];
    }

    // Some deployments return nested: { order: { items: [...] } }
    if (source?.order) return extractOrderItems(source.order);
    return [];
}

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getStatusKey = (value?: string) => {
    if (!value) return "unknown";
    const normalized = value.toLowerCase();
    if (normalized.includes("fail")) return "failed";
    if (normalized.includes("paid") || normalized.includes("success"))
        return "paid";
    if (normalized.includes("process")) return "processing";
    if (
        normalized.includes("in_transit") ||
        normalized.includes("ship") ||
        normalized.includes("delivering")
    )
        return "in_transit";
    if (normalized.includes("delivered")) return "delivered";
    if (normalized.includes("cancel")) return "cancelled";
    if (normalized.includes("block")) return "blocked";
    if (normalized.includes("pending") || normalized.includes("draft"))
        return "pending";
    return "unknown";
};

const translateStatusLabel = (value?: string) =>
    STATUS_META[getStatusKey(value)].label;

const formatCurrency = (value?: number | string) => {
    if (value === undefined || value === null || value === "") return "—";
    if (typeof value === "number") {
        return `${value.toLocaleString("vi-VN")}đ`;
    }
    return value.toString();
};

type OrderRowProps = {
    order: OrderRecord;
};

function OrderRow({ order }: OrderRowProps) {
    const [open, setOpen] = useState(false);
    const statusKey = getStatusKey(order.status);
    const statusMeta = STATUS_META[statusKey] ?? STATUS_META.unknown;

    const summaryItems = useMemo(() => extractOrderItems(order), [order]);
    const [resolvedItems, setResolvedItems] = useState<OrderItemLike[] | null>(
        null
    );
    const [resolvedDetail, setResolvedDetail] = useState<OrderDetailLike | null>(
        null
    );
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [productNamesVersion, setProductNamesVersion] = useState(0);

    const items = resolvedItems ?? summaryItems;
    const detailData = resolvedDetail ?? (order as any);

    const detailLabel =
        order.storeName ??
        order.franchiseName ??
        order.supplierName ??
        order.customer?.name ??
        "—";
    const createdAt = order.createdAt ?? order.orderDate ?? order.updatedAt ?? "";
    const amount = order.totalAmount ?? order.amount ?? order.total ?? "";
    const StatusIcon = statusMeta.icon;

    const orderId = String((order as any).orderId || order.id || "").trim();
    const orderNumber = String(order.orderNumber || "").trim();
    const detailLookupKeys = Array.from(
        new Set([orderId, orderNumber].filter(Boolean))
    );
    const detailRequestKey = detailLookupKeys.join("|");

    useEffect(() => {
        if (!open) return;
        if (detailLookupKeys.length === 0) return;

        // Only fetch once per row open-cycle (cache prevents refetch).
        if (resolvedItems !== null) return;

        let cancelled = false;

        const loadDetail = async () => {
            setIsLoadingDetail(true);
            setDetailError(null);

            try {
                const cached = detailLookupKeys
                    .map((key) => orderDetailCache.get(key))
                    .find(Boolean);
                const detailPayload = cached
                    ? cached
                    : await (detailLookupKeys
                        .map((key) => orderDetailInFlight.get(key))
                        .find(Boolean) ??
                        (() => {
                            const p = (async () => {
                                let lastError: any = null;

                                for (const key of detailLookupKeys) {
                                    try {
                                        const orderDetail = await getOrderById(key);
                                        return unwrapOrderDetail(orderDetail);
                                    } catch (error) {
                                        lastError = error;
                                    }
                                }

                                try {
                                    const invoice = await invoiceService.getInvoice(
                                        detailLookupKeys[0]
                                    );
                                    return unwrapOrderDetail(invoice);
                                } catch {
                                    throw lastError ?? new Error("Cannot load order detail");
                                }
                            })();
                            detailLookupKeys.forEach((key) => {
                                orderDetailInFlight.set(key, p);
                            });
                            return p;
                        })());

                detailLookupKeys.forEach((key) => {
                    orderDetailCache.set(key, detailPayload);
                    orderDetailInFlight.delete(key);
                });

                const detailItems = extractOrderItems(detailPayload);
                if (!cancelled) {
                    setResolvedDetail(detailPayload);
                    if (detailItems.length > 0) setResolvedItems(detailItems);
                }
            } catch (e: any) {
                detailLookupKeys.forEach((key) => {
                    orderDetailInFlight.delete(key);
                });
                const status = e?.status ?? e?.raw?.status ?? e?.response?.status;
                const msg =
                    status === 500
                        ? "Server đang lỗi khi lấy chi tiết đơn hàng (500)."
                        : status === 404
                            ? "Không tìm thấy chi tiết đơn hàng."
                            : e?.message ?? "Không thể tải chi tiết đơn hàng.";
                if (!cancelled) setDetailError(msg);
            } finally {
                if (!cancelled) setIsLoadingDetail(false);
            }
        };

        void loadDetail();

        return () => {
            cancelled = true;
        };
    }, [open, detailRequestKey, resolvedItems]);

    useEffect(() => {
        if (!open) return;
        if (items.length === 0) return;

        const ids = Array.from(
            new Set(
                items
                    .map((it) => String(it?.productId || "").trim())
                    .filter((pid) => pid && UUID_REGEX.test(pid))
                    .filter((pid) => !getCachedProductName(pid))
            )
        );

        if (ids.length === 0) return;

        let cancelled = false;

        (async () => {
            // Sequential to avoid rate-limit bursts.
            for (const pid of ids) {
                if (cancelled) return;
                await resolveProductName(pid);
            }
            if (!cancelled) setProductNamesVersion((v) => v + 1);
        })();

        return () => {
            cancelled = true;
        };
    }, [open, items, detailRequestKey, productNamesVersion]);

    const detailView = useMemo(() => {
        const safe = detailData ?? {};
        const rawItems = extractOrderItems(safe);

        return {
            orderId:
                String(safe?.orderId ?? safe?.id ?? orderId ?? "").trim() || null,
            orderNumber:
                String(safe?.orderNumber ?? safe?.code ?? orderNumber ?? "").trim() ||
                null,
            orderSource: safe?.orderSource ?? null,
            customerId: String(safe?.customerId ?? "").trim() || null,
            status: safe?.status ?? null,
            paymentStatus: safe?.paymentStatus ?? null,
            totalAmount:
                typeof safe?.totalAmount === "number"
                    ? safe.totalAmount
                    : typeof safe?.amount === "number"
                        ? safe.amount
                        : typeof safe?.total === "number"
                            ? safe.total
                            : null,
            orderDate: safe?.orderDate ?? safe?.createdAt ?? null,
            notes: safe?.notes ?? null,
            items: rawItems.map((item: any) => ({
                variantId: item?.variantId ?? item?.productVariantId ?? null,
                sku: item?.sku ?? null,
                productName:
                    item?.productName ??
                    item?.name ??
                    item?.title ??
                    item?.product?.name ??
                    null,
                quantity:
                    typeof item?.quantity === "number"
                        ? item.quantity
                        : typeof item?.qty === "number"
                            ? item.qty
                            : 1,
                unitPrice:
                    typeof item?.unitPrice === "number"
                        ? item.unitPrice
                        : typeof item?.price === "number"
                            ? item.price
                            : null,
                subtotal:
                    typeof item?.subtotal === "number"
                        ? item.subtotal
                        : typeof item?.amount === "number"
                            ? item.amount
                            : null,
                addons: Array.isArray(item?.addons) ? item.addons : [],
            })),
        };
    }, [detailData, orderId, orderNumber]);

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setOpen((prev) => !prev)}
            >
                <div className="flex items-center gap-4 min-w-0">
                    <div className="p-2.5 rounded-lg bg-amber-50">
                        <Package className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">
                                {order.orderNumber ?? order.id ?? "—"}
                            </span>
                            <span
                                className={`inline-flex items-center gap-1 text-xs font-medium ${statusMeta.color}`}
                            >
                                <StatusIcon className="w-4 h-4" />
                                {statusMeta.label}
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5 truncate">
                            {detailLabel}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{createdAt || "—"}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <span className="font-bold text-gray-900">
                        {formatCurrency(amount)}
                    </span>
                    {open ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                </div>
            </button>
            {open && (
                <div className="border-t border-gray-100 bg-gray-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                        Order Detail
                    </p>
                    <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <p className="text-gray-600">
                                <span className="font-semibold text-gray-900">Order ID:</span>{" "}
                                {detailView.orderId ?? "-"}
                            </p>
                            <p className="text-gray-600">
                                <span className="font-semibold text-gray-900">
                                    Order Number:
                                </span>{" "}
                                {detailView.orderNumber ?? "-"}
                            </p>
                            <p className="text-gray-600">
                                <span className="font-semibold text-gray-900">Source:</span>{" "}
                                {detailView.orderSource ?? "-"}
                            </p>
                            <p className="text-gray-600">
                                <span className="font-semibold text-gray-900">
                                    Customer ID:
                                </span>{" "}
                                {detailView.customerId ?? "-"}
                            </p>
                            <p className="text-gray-600">
                                <span className="font-semibold text-gray-900">Status:</span>{" "}
                                {detailView.status ?? "-"}
                            </p>
                            <p className="text-gray-600">
                                <span className="font-semibold text-gray-900">Payment:</span>{" "}
                                {detailView.paymentStatus ?? "-"}
                            </p>
                            <p className="text-gray-600">
                                <span className="font-semibold text-gray-900">Order Date:</span>{" "}
                                {detailView.orderDate ?? "-"}
                            </p>
                            <p className="text-gray-600">
                                <span className="font-semibold text-gray-900">Total:</span>{" "}
                                {typeof detailView.totalAmount === "number"
                                    ? formatCurrency(detailView.totalAmount)
                                    : "-"}
                            </p>
                            <p className="text-gray-600 sm:col-span-2">
                                <span className="font-semibold text-gray-900">Notes:</span>{" "}
                                {detailView.notes ?? "-"}
                            </p>
                        </div>
                    </div>

                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                        Sản phẩm
                    </p>
                    <ul className="space-y-2 mb-4">
                        {isLoadingDetail ? (
                            <li className="text-sm text-gray-600">Đang tải sản phẩm...</li>
                        ) : detailError ? (
                            <li className="text-sm text-rose-600">{detailError}</li>
                        ) : detailView.items.length > 0 ? (
                            detailView.items.map((item, index) => (
                                <li
                                    key={`${order.id ?? order.orderNumber}-${item.productName ?? item.variantId ?? item.sku ?? index
                                        }`}
                                    className="rounded-lg border border-gray-200 bg-white p-3"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-gray-900">
                                            {item.productName ?? "N/A"}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {typeof item.subtotal === "number"
                                                ? formatCurrency(item.subtotal)
                                                : "-"}
                                        </p>
                                    </div>

                                    <p className="text-xs text-gray-500">
                                        Size: {item.variantId ?? "-"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Quantity: {item.quantity ?? 1}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Price:{" "}
                                        {typeof item.unitPrice === "number"
                                            ? formatCurrency(item.unitPrice)
                                            : "-"}
                                    </p>
                                </li>
                            ))
                        ) : (
                            <li className="text-sm text-gray-600">
                                Không có thông tin sản phẩm.
                            </li>
                        )}
                    </ul>
                    <div className="flex gap-2 mt-4">
                        {/* <button className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 transition-colors">
              Đặt lại
            </button> */}
                        {statusKey === "processing" && (
                            <button className="rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-medium px-4 py-2 transition-colors">
                                Hủy đơn
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

type RecentPaymentResult = {
    status: "SUCCESS" | "FAILED" | "PENDING";
    invoiceId?: string;
    orderNumber?: string;
    total?: number;
    orderedAt?: string;
    paymentMethod?: string;
    recordedAt?: string;
};

function MyOrdersPageStaff() {
    const [orders, setOrders] = useState<OrderRecord[]>([]);
    const [filter, setFilter] = useState(FILTER_OPTIONS[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [paymentHistory, setPaymentHistory] = useState<RecentPaymentResult[]>([]);

    const didInitRef = useRef(false);

    const readPaymentHistory = (): RecentPaymentResult[] => {
        try {
            const list = readPaymentResults() as any[];
            return (Array.isArray(list) ? list : [])
                .map((it) => ({
                    status: it?.status,
                    invoiceId: it?.invoiceId,
                    orderNumber: it?.orderNumber,
                    total:
                        typeof it?.total === "number"
                            ? it.total
                            : it?.total != null
                                ? Number(it.total)
                                : undefined,
                    orderedAt: it?.orderedAt,
                    paymentMethod: it?.paymentMethod,
                    recordedAt: it?.recordedAt,
                }))
                .filter((it) => it?.status);
        } catch {
            return [];
        }
    };

    const loadOrders = async () => {
        if (isLoading) return;
        setIsLoading(true);
        setError(null);

        try {
            const response = await getCustomerOrders();
            const list = (response.orders ?? []) as OrderRecord[];

            const history = readPaymentHistory();

            // Inject recent payment attempts into list when backend doesn't create an order record yet.
            if (history.length > 0) {
                const existingKeys = new Set<string>();
                for (const o of list) {
                    const id = String(o?.id || "").trim();
                    const num = String(o?.orderNumber || "").trim();
                    if (id) existingKeys.add(id);
                    if (num) existingKeys.add(num);
                }

                const injections: OrderRecord[] = [];
                const seen = new Set<string>();

                for (const rp of history) {
                    if (!rp?.status) continue;
                    const invoiceId = String(rp?.invoiceId || "").trim();
                    if (!invoiceId || !UUID_REGEX.test(invoiceId)) continue;
                    if (seen.has(invoiceId)) continue;
                    seen.add(invoiceId);

                    if (existingKeys.has(invoiceId)) continue;
                    const num = String(rp?.orderNumber || "").trim();
                    if (num && existingKeys.has(num)) continue;

                    injections.push({
                        id: invoiceId,
                        orderNumber: num || invoiceId,
                        status: rp.status,
                        totalAmount: typeof rp.total === "number" ? rp.total : undefined,
                        createdAt: rp.orderedAt ?? rp.recordedAt,
                        paymentMethod: rp.paymentMethod,
                        items: [],
                    } as OrderRecord);
                }

                if (injections.length > 0) {
                    list.unshift(...injections.slice(0, 10));
                }
            }

            // If backend is rate-limited / delayed creating order records,
            // still show recent payment results as local rows.
            if (list.length === 0) {
                const seen = new Set<string>();

                for (const rp of history) {
                    const invoiceId = String(rp?.invoiceId || "").trim();
                    if (!invoiceId || !UUID_REGEX.test(invoiceId)) continue;
                    if (seen.has(invoiceId)) continue;
                    seen.add(invoiceId);

                    list.push({
                        id: invoiceId,
                        orderNumber: rp.orderNumber ?? invoiceId,
                        status: rp.status,
                        totalAmount: typeof rp.total === "number" ? rp.total : undefined,
                        createdAt: rp.orderedAt ?? rp.recordedAt,
                        items: [],
                    } as OrderRecord);
                }
            }

            setOrders(list);
        } catch (err: any) {
            const status =
                err?.status ?? err?.raw?.status ?? err?.raw?.response?.status;

            // Avoid spamming more requests when rate-limited.
            if (status === 429) {
                setError(
                    "Bạn thao tác quá nhanh hoặc server đang giới hạn truy cập (429). Vui lòng đợi 1 phút rồi thử lại."
                );
            } else {
                setError(err?.message ?? "Không thể tải đơn hàng từ server.");
            }

            setOrders([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // React StrictMode in DEV can run effects twice; prevent double fetch.
        if (didInitRef.current) return;
        didInitRef.current = true;

        setPaymentHistory(readPaymentHistory());
        void loadOrders();
    }, []);

    const filteredOrders = useMemo(() => {
        const normalizedSearch = searchQuery.trim().toLowerCase();
        return orders.filter((order) => {
            const statusMatch =
                filter === "Tất cả" || translateStatusLabel(order.status) === filter;
            if (!statusMatch) return false;
            if (!normalizedSearch) return true;
            const haystack = [
                order.orderNumber,
                order.id,
                order.storeName,
                order.franchiseName,
                order.supplierName,
                order.customer?.name,
            ]
                .filter(Boolean)
                .map((value) => value.toString().toLowerCase());
            return haystack.some((value) => value.includes(normalizedSearch));
        });
    }, [orders, filter, searchQuery]);

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Đơn hàng của tôi</h1>
                <p className="text-gray-600 mt-1">
                    Xem lại lịch sử và trạng thái đơn hàng.
                </p>
            </div>

            <div className="flex gap-2 flex-wrap mb-6">
                {FILTER_OPTIONS.map((option) => (
                    <button
                        key={option}
                        onClick={() => setFilter(option)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${filter === option
                            ? "bg-amber-600 text-white"
                            : "bg-white border border-gray-200 text-gray-600 hover:border-amber-400"
                            }`}
                    >
                        {option}
                    </button>
                ))}
            </div>

            <div className="relative mb-4 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Tìm theo mã đơn, cửa hàng..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
            </div>

            {error && (
                <div className="text-center py-6 px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 mb-4">
                    <div>{error}</div>
                    <button
                        type="button"
                        onClick={() => void loadOrders()}
                        className="mt-3 inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-white text-sm font-semibold hover:bg-rose-700"
                    >
                        Thử lại
                    </button>
                </div>
            )}

            {isLoading && (
                <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 p-6 text-center text-amber-800 font-semibold">
                    Đang tải đơn hàng từ server...
                </div>
            )}

            <div className="space-y-3">
                {!isLoading && filteredOrders.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Không có đơn hàng nào.</p>
                    </div>
                ) : (
                    filteredOrders.map((order, index) => (
                        <OrderRow
                            key={order.id ?? order.orderNumber ?? `order-${index}`}
                            order={order}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

export default MyOrdersPageStaff;
