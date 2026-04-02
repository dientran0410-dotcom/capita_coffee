import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import invoiceService from "../../services/InvoiceService";
import PaymentService from "../../services/PaymentService";
import loyaltyService from "../../services/loyaltyService";
import { createOrder } from "../../services/orderService";
import { getProductVariants } from "../../services/productService";
import type { Invoice } from "../../types/Invoice";

const PaymentSuccessStaff = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navState = (location.state || {}) as {
        invoiceId?: string;
        orderNumber?: string;
        total?: number;
        orderedAt?: string;
        paymentMethod?: string;
        customerId?: string;
        customerPhone?: string;
        notes?: string;
    };

    const roleName = useMemo(() => {
        const rawUser =
            localStorage.getItem("user") ||
            sessionStorage.getItem("user") ||
            localStorage.getItem("auth_user") ||
            sessionStorage.getItem("auth_user");

        let storedUser: any = null;
        try {
            storedUser = rawUser ? JSON.parse(rawUser) : null;
        } catch {
            storedUser = null;
        }

        return String(
            storedUser?.roleName ||
            storedUser?.role ||
            localStorage.getItem("role") ||
            sessionStorage.getItem("role") ||
            "",
        )
            .toLowerCase()
            .replace(/^role_/, "");
    }, []);

    const continueShoppingPath = useMemo(() => {
        if (roleName === "staff") return "/staff";
        if (roleName === "customer") return "/customer";
        if (roleName === "manager") return "/manager";
        if (roleName === "admin") return "/admin";
        if (roleName === "supplier") return "/supplier";
        return "/home";
    }, [roleName]);

    const ordersPath = useMemo(() => {
        if (roleName === "staff") return "/staff/portal/orders";
        if (roleName === "customer") return "/customer/portal/my-orders";
        if (roleName === "manager") return "/manager";
        if (roleName === "admin") return "/admin";
        if (roleName === "supplier") return "/supplier";
        return "/home";
    }, [roleName]);

    const didProcessMomoSuccessRef = useRef(false);
    const didCreateOrderRef = useRef(false);
    const didEarnPointsRef = useRef(false);

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [earnedPointsCommitted, setEarnedPointsCommitted] = useState<number | null>(null);
    const [pointsSyncFailed, setPointsSyncFailed] = useState(false);

    const getPersistedCheckoutOrderRequest = (id: string) => {
        try {
            const raw = localStorage.getItem(`checkout-order-request:${String(id).trim()}`);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : null;
        } catch {
            return null;
        }
    };

    const getOrderCreatedMarkerKey = (id: string) =>
        `order_created_from_invoice_${String(id).trim()}`;

    const getPointsEarnedMarkerKey = (id: string) =>
        `points_earned_from_invoice_${String(id).trim()}`;

    const isOrderAlreadyCreatedError = (error: any): boolean => {
        const status = Number(error?.response?.status ?? error?.status ?? 0);
        const message = String(
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "",
        ).toLowerCase();

        if (status === 409) return true;
        return (
            message.includes("already") ||
            message.includes("exist") ||
            message.includes("duplicate")
        );
    };

    const shouldTryRegisterEngagement = (error: any): boolean => {
        const status = Number(error?.response?.status ?? error?.status ?? 0);
        const message = String(
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            error?.message ||
            "",
        ).toLowerCase();

        if (status === 404 || status === 400) return true;
        return message.includes("customer not found") || message.includes("not found");
    };

    const resolveCustomerId = (inv: Invoice): string | null => {
        const normalizedPaymentMethod = String(navState?.paymentMethod || "").trim().toUpperCase();
        const pendingCustomerId =
            normalizedPaymentMethod === "MOMO"
                ? sessionStorage.getItem("pending_customer_id")
                : null;

        const candidates = [
            navState?.customerId,
            pendingCustomerId,
        ];

        for (const c of candidates) {
            if (c === undefined || c === null) continue;
            const value = String(c).trim();
            if (value) return value;
        }

        return null;
    };

    const resolveFranchiseId = (inv: Invoice, persisted: any): string | null => {
        const rawUser =
            localStorage.getItem("user") ||
            sessionStorage.getItem("user") ||
            localStorage.getItem("auth_user") ||
            sessionStorage.getItem("auth_user");

        let storedUser: any = null;
        try {
            storedUser = rawUser ? JSON.parse(rawUser) : null;
        } catch {
            storedUser = null;
        }

        const candidates = [
            inv?.franchiseId,
            persisted?.franchiseId,
            storedUser?.franchiseId,
            storedUser?.raw?.franchiseId,
            storedUser?.raw?.user?.franchiseId,
            localStorage.getItem("franchiseId"),
            sessionStorage.getItem("franchiseId"),
        ];

        for (const c of candidates) {
            if (c === undefined || c === null) continue;
            const value = String(c).trim();
            if (value) return value;
        }

        return null;
    };

    const resolveOrderItems = async (inv: Invoice, persisted: any) => {
        const normalizeAddons = (addonsRaw: any) => {
            const list = Array.isArray(addonsRaw) ? addonsRaw : [];
            return list
                .map((addon: any) => ({
                    addonVariantId: String(
                        addon?.addonVariantId ??
                        addon?.variantId ??
                        addon?.productVariantId ??
                        addon?.id ??
                        "",
                    ).trim(),
                    quantity: Number(addon?.quantity ?? 0),
                }))
                .filter((addon: any) => addon.addonVariantId && addon.quantity > 0);
        };

        const normalizeRawItems = (raw: any[]) =>
            raw.map((it: any) => ({
                variantId: String(it?.variantId ?? it?.productVariantId ?? "").trim(),
                productId: String(it?.productId ?? "").trim(),
                quantity: Number(it?.quantity ?? 0),
                price: Number(it?.price ?? it?.unitPrice ?? 0),
                addons: normalizeAddons(it?.addons ?? it?.addonItems),
                notes: String(it?.notes ?? "").trim(),
            }));

        const resolveVariantIdByProduct = async (productId: string, price: number) => {
            if (!productId) return "";
            try {
                const variants = await getProductVariants(productId);
                if (!Array.isArray(variants) || variants.length === 0) return "";

                const exactByPrice = Number.isFinite(price)
                    ? variants.find((v: any) => Number(v?.price ?? NaN) === Number(price))
                    : null;

                const picked = exactByPrice || variants[0];
                return String(picked?.variantId ?? picked?.id ?? "").trim();
            } catch {
                return "";
            }
        };

        const rawFromInvoice = Array.isArray((inv as any)?.items) ? (inv as any).items : [];
        const rawFromPersisted = Array.isArray(persisted?.items)
            ? persisted.items
            : Array.isArray(persisted?.orderItems)
                ? persisted.orderItems
                : [];

        const tryResolve = async (rawItems: any[]) => {
            const normalized = normalizeRawItems(rawItems);
            const resolved = await Promise.all(
                normalized.map(async (it) => {
                    let variantId = it.variantId;
                    if (!variantId && it.productId) {
                        variantId = await resolveVariantIdByProduct(it.productId, it.price);
                    }
                    return {
                        variantId,
                        quantity: it.quantity,
                        addons: it.addons,
                        notes: it.notes,
                    };
                }),
            );

            return resolved.filter((it) => it.variantId && it.quantity > 0);
        };

        const fromInvoice = await tryResolve(rawFromInvoice);
        if (fromInvoice.length > 0) return fromInvoice;

        const fromPersisted = await tryResolve(rawFromPersisted);
        return fromPersisted;
    };

    useEffect(() => {
        const invoiceId = navState.invoiceId;
        if (!invoiceId) return;

        let cancelled = false;
        setIsLoading(true);

        (async () => {
            // If coming from MoMo success redirect, tell backend to mark invoice as PAID + clear cart.
            // Guard against React StrictMode double-invoking effects in dev.
            const paymentMethod = String(navState.paymentMethod || "").trim().toUpperCase();
            if (paymentMethod === "MOMO" && !didProcessMomoSuccessRef.current) {
                didProcessMomoSuccessRef.current = true;
                try {
                    await PaymentService.handlePaymentSuccess({ invoiceId });
                } catch (e) {
                    // Keep UX resilient: invoice may already be PAID or backend may have processed in return endpoint.
                    if (import.meta.env.DEV) {
                        console.warn("[PaymentSuccess] handlePaymentSuccess failed:", e);
                    }
                }
            }

            try {
                const data = await invoiceService.getInvoice(String(invoiceId));
                if (!cancelled) setInvoice(data);

                const shouldCreateOrder = paymentMethod === "MOMO" || paymentMethod === "CASH";

                if (shouldCreateOrder && !didCreateOrderRef.current) {
                    didCreateOrderRef.current = true;

                    const markerKey = getOrderCreatedMarkerKey(String(data?.id ?? invoiceId));
                    const alreadyCreated = sessionStorage.getItem(markerKey) === "1";

                    if (!alreadyCreated) {
                        const persistedOrderRequest = getPersistedCheckoutOrderRequest(String(data?.id ?? invoiceId));
                        const customerId = resolveCustomerId(data as Invoice);
                        const franchiseId = resolveFranchiseId(data as Invoice, persistedOrderRequest);
                        const items = await resolveOrderItems(data as Invoice, persistedOrderRequest);

                        console.log("[PaymentSuccess] createOrder input check:", {
                            paymentMethod,
                            customerId,
                            franchiseId,
                            itemsCount: items.length,
                        });

                        if (!customerId || !franchiseId || items.length <= 0) {
                            console.error("[PaymentSuccess] BLOCKED createOrder due to missing required fields:", {
                                hasCustomerId: Boolean(customerId),
                                hasFranchiseId: Boolean(franchiseId),
                                itemsCount: items.length,
                                persistedOrderRequest,
                            });
                            throw new Error("Thiếu dữ liệu bắt buộc để tạo order sau thanh toán.");
                        }

                        const orderPayload = {
                            franchiseId,
                            customerId,
                            orderSource: "APP",
                            items,
                            notes: String(navState?.notes ?? (data as any)?.notes ?? "").trim(),
                        };

                        console.log("[PaymentSuccess] createOrder REQUEST payload:", orderPayload);

                        try {
                            await createOrder(orderPayload);
                            console.log("[PaymentSuccess] createOrder SUCCESS");
                            sessionStorage.setItem(markerKey, "1");
                        } catch (orderError: any) {
                            if (isOrderAlreadyCreatedError(orderError)) {
                                sessionStorage.setItem(markerKey, "1");
                            } else {
                                console.warn("[PaymentSuccess] createOrder failed but continue points flow:", orderError);
                            }
                        }
                    }
                }

                // Earn loyalty points for the customer after successful payment
                if (!didEarnPointsRef.current && data?.totalAmount) {
                    didEarnPointsRef.current = true;
                    const pointsMarkerKey = getPointsEarnedMarkerKey(String(data?.id ?? invoiceId));
                    const pointsAlreadyEarned = sessionStorage.getItem(pointsMarkerKey) === "1";
                    const calculatedPoints = Math.max(1, Math.floor(Number(data.totalAmount) / 1000));

                    if (!pointsAlreadyEarned) {
                        try {
                            const targetCustomerId = resolveCustomerId(data as Invoice);
                            const targetFranchiseId = resolveFranchiseId(data as Invoice, getPersistedCheckoutOrderRequest(String(data?.id ?? invoiceId)));
                            
                            // Backend sẽ handle tìm customer theo customerPhone nếu cần
                            if (targetCustomerId && targetFranchiseId && data.totalAmount > 0) {
                                const pointsToEarn = calculatedPoints;
                                if (pointsToEarn > 0) {
                                    console.log("[PaymentSuccess] Earning points:", {
                                        customerId: targetCustomerId,
                                        franchiseId: targetFranchiseId,
                                        points: pointsToEarn,
                                        customerPhone: navState.customerPhone,
                                    });

                                    try {
                                        await loyaltyService.earnPointsAndAutoUpgradeTier(
                                            String(targetCustomerId),
                                            String(targetFranchiseId),
                                            {
                                                points: pointsToEarn,
                                                reason: "Thanh toán đơn hàng",
                                            }
                                        );
                                        console.log("[PaymentSuccess] Points earned successfully");
                                        sessionStorage.setItem(pointsMarkerKey, "1");
                                        setEarnedPointsCommitted(pointsToEarn);
                                        setPointsSyncFailed(false);
                                    } catch (pointsErr: any) {
                                        if (shouldTryRegisterEngagement(pointsErr)) {
                                            try {
                                                await loyaltyService.registerCustomerEngagement(
                                                    String(targetFranchiseId),
                                                    {
                                                        customerId: String(targetCustomerId),
                                                        userName: navState.customerPhone,
                                                    }
                                                );
                                                await loyaltyService.earnPointsAndAutoUpgradeTier(
                                                    String(targetCustomerId),
                                                    String(targetFranchiseId),
                                                    {
                                                        points: pointsToEarn,
                                                        reason: "Thanh toán đơn hàng",
                                                    }
                                                );
                                                console.log("[PaymentSuccess] Points earned successfully after register");
                                                sessionStorage.setItem(pointsMarkerKey, "1");
                                                setEarnedPointsCommitted(pointsToEarn);
                                                setPointsSyncFailed(false);
                                            } catch (retryErr: any) {
                                                console.warn("[PaymentSuccess] Retry earn points failed:", retryErr);
                                                didEarnPointsRef.current = false;
                                                setPointsSyncFailed(true);
                                            }
                                        } else {
                                            console.warn("[PaymentSuccess] Failed to earn points:", pointsErr);
                                            // Allow retry on next visit if earning failed.
                                            didEarnPointsRef.current = false;
                                            setPointsSyncFailed(true);
                                        }
                                    }
                                }
                            } else {
                                setPointsSyncFailed(true);
                            }
                        } catch (pointsError) {
                            console.warn("[PaymentSuccess] Error in points earning logic:", pointsError);
                            // Allow retry on next visit if earning failed.
                            didEarnPointsRef.current = false;
                            setPointsSyncFailed(true);
                        }
                    } else {
                        setEarnedPointsCommitted(calculatedPoints);
                        setPointsSyncFailed(false);
                    }
                }
            } catch (e) {
                if (import.meta.env.DEV) {
                    console.warn("[PaymentSuccess] Failed to load invoice:", e);
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [navState.invoiceId, navState.paymentMethod]);

    const orderNumber = invoice?.code || invoice?.id || navState.orderNumber || "-";

    const orderDateLabel = useMemo(() => {
        const raw =
            invoice?.paidAt ||
            invoice?.updatedAt ||
            invoice?.createdAt ||
            invoice?.issuedAt ||
            navState.orderedAt;

        const toDate = (v: unknown) => {
            if (v == null) return null;
            if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
            if (typeof v === "number") {
                const d = new Date(v);
                return Number.isNaN(d.getTime()) ? null : d;
            }
            if (typeof v === "string") {
                const s = v.trim();
                if (!s) return null;
                if (/^\d+$/.test(s)) {
                    const n = Number(s);
                    // Heuristic: 10 digits => seconds, otherwise ms
                    const ms = s.length <= 10 ? n * 1000 : n;
                    const d = new Date(ms);
                    return Number.isNaN(d.getTime()) ? null : d;
                }
                const d = new Date(s);
                return Number.isNaN(d.getTime()) ? null : d;
            }
            return null;
        };

        const d = toDate(raw);
        if (!d) return "";

        return new Intl.DateTimeFormat("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(d);
    }, [invoice?.paidAt, invoice?.updatedAt, invoice?.createdAt, invoice?.issuedAt, navState.orderedAt]);

    const totalPaid = Number(invoice?.totalAmount ?? navState.total ?? 0);
    const expectedPoints = useMemo(() => {
        const amount = Number.isFinite(totalPaid) ? totalPaid : 0;
        if (amount <= 0) return 0;
        return Math.max(1, Math.floor(amount / 1000));
    }, [totalPaid]);

    const formatVND = (n: number) =>
        (Number.isFinite(n) ? n : 0).toLocaleString("vi-VN");

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-display flex flex-col text-slate-900 dark:text-slate-100">
            {/* Main */}
            <main className="flex-1 flex items-start justify-center py-10 px-4 sm:px-6">
                <div className="w-full max-w-lg animate-fade-up">
                    {/* Status card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-8 text-center">
                        {/* Icon */}
                        <div className="relative inline-flex items-center justify-center mb-6">
                            <span
                                className="absolute inline-block w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 animate-ping-slow"
                                aria-hidden="true"
                            />
                            <span
                                className="material-symbols-outlined text-green-500 text-7xl relative z-10"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                                check_circle
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold mb-2">Thanh toán thành công</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                            Cảm ơn bạn đã mua hàng. Đơn hàng đang được xử lý.
                        </p>

                        {/* Order summary */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 mb-6 text-left border border-slate-100 dark:border-slate-700/50">
                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Mã đơn hàng</span>
                                <span className="text-sm font-bold">{orderNumber}</span>
                            </div>
                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Ngày đặt</span>
                                <span className="text-sm font-medium">
                                    {isLoading ? "Đang tải..." : orderDateLabel || "-"}
                                </span>
                            </div>
                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Tổng thanh toán</span>
                                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                    {formatVND(totalPaid)} VND
                                </span>
                            </div>

                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Điểm được cộng</span>
                                <span className="text-sm font-bold text-primary">
                                    {earnedPointsCommitted != null
                                        ? `${earnedPointsCommitted.toLocaleString("vi-VN")} điểm`
                                        : "Chưa ghi nhận"}
                                </span>
                            </div>

                            {pointsSyncFailed ? (
                                <div className="mb-3 text-xs text-amber-600 dark:text-amber-400">
                                    Chưa đồng bộ điểm xuống hệ thống. Vui lòng mở lại trang sau vài giây.
                                </div>
                            ) : earnedPointsCommitted == null && expectedPoints > 0 ? (
                                <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                                    Điểm dự kiến: {expectedPoints.toLocaleString("vi-VN")} điểm.
                                </div>
                            ) : null}

                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-500 dark:text-slate-400">Trạng thái</span>
                                <span className="inline-flex items-center gap-1 text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 px-2.5 py-1 rounded-full">
                                    <span
                                        className="material-symbols-outlined text-xs"
                                        style={{ fontVariationSettings: "'FILL' 1" }}
                                    >
                                        check
                                    </span>
                                    Thành công
                                </span>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                            <button
                                onClick={() => navigate(ordersPath)}
                                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white text-sm font-semibold py-3 px-5 rounded-xl hover:bg-primary/90 transition-colors"
                            >
                                <span className="material-symbols-outlined text-base">receipt_long</span>
                                Xem Đơn Hàng
                            </button>
                            <button
                                onClick={() => navigate(continueShoppingPath)}
                                className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold py-3 px-5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            >
                                <span className="material-symbols-outlined text-base">storefront</span>
                                Tiếp Tục Mua Sắm
                            </button>
                        </div>

                        {/* Back link */}
                        {/* <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Quay về trang chủ
            </button> */}
                    </div>

                    {/* Footer trust badge */}
                    <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-base text-green-500">
                                verified_user
                            </span>
                            Bảo mật SSL 256-bit
                        </span>
                        <span className="flex items-center gap-1">
                            <span
                                className="material-symbols-outlined text-base text-blue-500"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                                credit_card
                            </span>
                            Visa / Mastercard / MoMo
                        </span>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PaymentSuccessStaff;