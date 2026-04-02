import { useEffect, useMemo, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import invoiceService from "../../../services/InvoiceService";
import MomoService from "../../../services/MomoService";
import couponService from "../../../services/couponService";
import pointsBalanceService from "../../../services/PointsBalanceService";
import type { Invoice } from "../../../types/Invoice";
import type { CouponResponse } from "../../../types/coupon";
import { getProductById } from "../../../services/productService";
import {
  clearAuthStorage,
  extractUserId,
  getStoredToken,
} from "../../../utils/authHelpers";

const PRODUCT_CATALOG_STORAGE_KEY = "productCatalog_v1";

type ProductCatalogEntry = { id: string; name: string };

type CheckoutNavState = {
  checkoutMode?: "cart";
  fromCart?: boolean;
  fromApi?: boolean;
  cartData?: any;
};

const readProductCatalogMap = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(PRODUCT_CATALOG_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return {};

    const map: Record<string, string> = {};
    for (const entry of parsed as any[]) {
      const id = entry?.id;
      const name = entry?.name;
      if (id && name) map[String(id)] = String(name);
    }
    return map;
  } catch {
    return {};
  }
};

const writeProductCatalogMap = (map: Record<string, string>) => {
  try {
    const entries: ProductCatalogEntry[] = Object.entries(map)
      .filter(([id, name]) => id && name)
      .map(([id, name]) => ({ id, name }));
    localStorage.setItem(PRODUCT_CATALOG_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
};

const formatVND = (value: number) => {
  const num = Number(value) || 0;
  return num.toLocaleString("vi-VN");
};

const parseCouponCodeFromQr = (rawValue: string) => {
  const cleaned = String(rawValue || "").trim();
  if (!cleaned) return "";

  const withoutPrefix = cleaned.replace(/^COUPON:/i, "").replace(/^VOUCHER:/i, "").trim();

  const extractFromObject = (value: unknown) => {
    if (!value || typeof value !== "object") return "";
    const candidateKeys = ["couponCode", "code", "voucher", "coupon", "token", "value"];
    for (const key of candidateKeys) {
      const maybe = (value as Record<string, unknown>)[key];
      if (typeof maybe === "string" && maybe.trim()) return maybe.trim();
    }
    return "";
  };

  const tryParseUrl = (value: string) => {
    try {
      const parsed = new URL(value);
      const queryKeys = ["couponCode", "code", "voucher", "coupon", "token"];
      for (const key of queryKeys) {
        const queryValue = parsed.searchParams.get(key);
        if (queryValue && queryValue.trim()) return queryValue.trim();
      }
      const segments = parsed.pathname.split("/").filter(Boolean);
      if (segments.length > 0) return segments[segments.length - 1];
    } catch {
      // Not a URL
    }
    return "";
  };

  try {
    const parsedJson = JSON.parse(withoutPrefix);
    const fromJson = extractFromObject(parsedJson);
    if (fromJson) return fromJson;
  } catch {
    // Not JSON
  }

  const fromUrl = tryParseUrl(withoutPrefix);
  if (fromUrl) return fromUrl;

  const queryMatch = withoutPrefix.match(
    /[?&](?:couponCode|code|voucher|coupon|token)=([^&]+)/i,
  );
  if (queryMatch?.[1]) {
    try {
      return decodeURIComponent(queryMatch[1]).trim();
    } catch {
      return String(queryMatch[1]).trim();
    }
  }

  return withoutPrefix;
};

export default function StaffCheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const navState = (location.state || {}) as CheckoutNavState;

  const userId = useMemo(() => extractUserId(user), [user]);
  const hasValidToken = useMemo(() => !!getStoredToken(), []);
  const shouldShowLoginPrompt = !isAuthenticated && !hasValidToken && !userId;

  const cartPath = "/staff/cart";
  const shopPath = "/staff";

  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);
  const [isCashOrdering, setIsCashOrdering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [isQrCouponModalOpen, setIsQrCouponModalOpen] = useState(false);
  const [qrCouponError, setQrCouponError] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const [availableCoupons, setAvailableCoupons] = useState<CouponResponse[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);

  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
  const [loyaltyTierName, setLoyaltyTierName] = useState<string>("");
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);


  const [productNameById, setProductNameById] = useState<Record<string, string>>(
    () => readProductCatalogMap(),
  );
  const productNameByIdRef = useRef<Record<string, string>>({});
  const qrScannerRef = useRef<Html5QrcodeScanner | null>(null);
  const qrScanLockedRef = useRef(false);
  const applyCouponByCodeRef = useRef<(code: string) => Promise<boolean>>(
    () => Promise.resolve(false),
  );

  useEffect(() => {
    productNameByIdRef.current = productNameById;
  }, [productNameById]);

  const toPositiveInt = (value: unknown): number | null => {
    const num = typeof value === "number" ? value : Number(String(value ?? "").trim());
    return Number.isFinite(num) && num > 0 ? Math.floor(num) : null;
  };

  const toNumber = (value: unknown): number => {
    const num = typeof value === "number" ? value : Number(String(value ?? "").trim());
    return Number.isFinite(num) ? num : 0;
  };

  const getStoredUserObject = (): any | null => {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const isUuid = (value: unknown): boolean => {
    const s = String(value ?? "").trim();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
  };

  const extractFranchiseId = (): string | null => {
    const stored = getStoredUserObject();
    const candidates = [
      (invoice as any)?.franchiseId,
      (user as any)?.franchiseId,
      (user as any)?.raw?.franchiseId,
      (user as any)?.raw?.user?.franchiseId,
      (stored as any)?.franchiseId,
      (stored as any)?.raw?.franchiseId,
      (stored as any)?.raw?.data?.franchiseId,
      (stored as any)?.raw?.user?.franchiseId,
    ];
    for (const c of candidates) {
      if (c === undefined || c === null) continue;
      const s = String(c).trim();
      if (s && isUuid(s)) return s;
    }
    return null;
  };

  const extractCustomerNumericId = (): number | null => {
    const stored = getStoredUserObject();
    const candidates = [
      (user as any)?.id,
      (user as any)?.staffId,
      (user as any)?.raw?.id,
      (user as any)?.raw?.userId,
      (user as any)?.raw?.user?.id,
      (user as any)?.raw?.user?.userId,
      (user as any)?.raw?.data?.userId,
      (stored as any)?.id,
      (stored as any)?.staffId,
      (stored as any)?.userId,
      (stored as any)?.raw?.id,
      (stored as any)?.raw?.userId,
      (stored as any)?.raw?.user?.id,
      (stored as any)?.raw?.data?.userId,
      (invoice as any)?.customerId,
    ];
    for (const c of candidates) {
      const num = toPositiveInt(c);
      if (num) return num;
    }
    return null;
  };

  const effectiveUserId = useMemo(() => {
    if (userId) return userId;
    try {
      const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return extractUserId(parsed);
    } catch {
      return null;
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;

    const loadCoupons = async () => {
      setIsLoadingCoupons(true);
      try {
        const data = await couponService.getActiveCouponsForCustomer();
        if (!cancelled) setAvailableCoupons(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error("[StaffCheckout] Failed to load coupons:", err);
        const status = err?.response?.status;
        if (status === 401) {
          alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem mã giảm giá.");
          clearAuthStorage();
          navigate("/login", { replace: true });
          return;
        }
        if (!cancelled) setAvailableCoupons([]);
      } finally {
        if (!cancelled) setIsLoadingCoupons(false);
      }
    };

    loadCoupons();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    let cancelled = false;

    const loadPoints = async () => {
      const customerIdNum = extractCustomerNumericId();
      const franchiseId = extractFranchiseId();
      if (!customerIdNum || !franchiseId) return;

      setIsLoadingPoints(true);
      try {
        const result = await pointsBalanceService.getPointsBalance(customerIdNum, franchiseId);
        if (!cancelled) {
          const points = Number((result as any)?.currentPoints ?? 0);
          setLoyaltyPoints(points);
          setLoyaltyTierName(String((result as any)?.tier?.tierName ?? ""));
        }
      } catch (err: any) {
        console.error("[StaffCheckout] Failed to load points balance:", err);
        const status = err?.response?.status;
        if (status === 401) {
          alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem điểm thưởng.");
          clearAuthStorage();
          navigate("/login", { replace: true });
          return;
        }
        if (!cancelled) {
          setLoyaltyPoints(0);
          setLoyaltyTierName("");
        }
      } finally {
        if (!cancelled) setIsLoadingPoints(false);
      }
    };

    loadPoints();
    return () => {
      cancelled = true;
    };
  }, [navigate, invoice?.franchiseId, invoice?.customerId, user]);

  useEffect(() => {
    const init = async () => {
      setError(null);

      if (!effectiveUserId) {
        setIsLoading(false);
        return;
      }

      const cameFromCart = !!(
        navState?.checkoutMode === "cart" || navState?.fromCart || navState?.fromApi
      );
      if (!cameFromCart) {
        alert("Vui lòng vào giỏ hàng staff và nhấn Thanh toán.");
        navigate(cartPath, { replace: true });
        return;
      }

      try {
        setIsCreatingInvoice(true);
        setIsLoading(true);

        const newInvoice = await invoiceService.createInvoice({
          customerId: effectiveUserId,
        });
        setInvoice(newInvoice);
        setInvoiceId(newInvoice.id);
      } catch (err: any) {
        console.error("[StaffCheckout] init error:", err);

        if (err?.response?.status === 401 || err?.status === 401) {
          alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          clearAuthStorage();
          navigate("/login", { replace: true });
          return;
        }

        const serverMessage =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          (typeof err?.response?.data === "string" ? err.response.data : null);

        setError(
          serverMessage
            ? `Không thể tải thông tin hóa đơn. Lỗi: ${serverMessage}`
            : "Không thể tải thông tin hóa đơn. Vui lòng thử lại.",
        );
      } finally {
        setIsLoading(false);
        setIsCreatingInvoice(false);
      }
    };

    init();
  }, [effectiveUserId, navState, navigate]);

  useEffect(() => {
    let cancelled = false;

    const hydrateNames = async () => {
      const items = (invoice as any)?.items || [];
      if (!items.length) return;

      const current = { ...readProductCatalogMap(), ...productNameByIdRef.current };
      const missingIds = Array.from(
        new Set(
          items
            .map((it: any) => String(it?.productId ?? "").trim())
            .filter((id: string) => id && !current[id]),
        ),
      );

      if (!missingIds.length) return;

      for (const pid of missingIds) {
        try {
          const p = await getProductById(pid);
          if (cancelled) return;
          if ((p as any)?.name) {
            current[pid] = String((p as any).name);
            setProductNameById((prev) => ({ ...prev, [pid]: String((p as any).name) }));
          }
        } catch {
          // ignore
        }
      }

      writeProductCatalogMap({ ...current });
    };

    hydrateNames();
    return () => {
      cancelled = true;
    };
  }, [invoice?.items]);

  const handleMomoPayment = async () => {
    if (!invoiceId) return;

    setIsOrdering(true);
    try {
      await invoiceService.checkout({ invoiceId });

      const amount = Number(invoice?.totalAmount ?? 0);
      if (!amount || Number.isNaN(amount) || amount <= 0) {
        throw new Error(`Invalid amount for MoMo payment: ${amount}`);
      }

      const momo = await MomoService.createMomoPayment({
        orderId: String(invoiceId),
        amount,
      });

      const payUrl = (momo as any)?.payUrl;
      if (payUrl) {
        window.location.href = payUrl;
        return;
      }

      throw new Error("MoMo did not return payUrl");
    } catch (err) {
      console.error("[StaffCheckout] MoMo error:", err);
      alert("Không thể tạo thanh toán MoMo. Vui lòng thử lại.");
      setIsOrdering(false);
    }
  };

  const handleCashPayment = async () => {
    if (!invoiceId) return;

    if (invoice?.status === "PAID") {
      navigate("/payment-success", {
        state: {
          invoiceId,
          orderNumber: (invoice as any)?.code || invoiceId,
          total: (invoice as any)?.totalAmount ?? 0,
          orderedAt:
            (invoice as any)?.paidAt ||
            (invoice as any)?.updatedAt ||
            (invoice as any)?.createdAt ||
            new Date().toISOString(),
          paymentMethod: "Cash",
        },
      });
      return;
    }

    setIsCashOrdering(true);
    try {
      await invoiceService.checkout({ invoiceId });

      navigate("/payment-success", {
        state: {
          invoiceId,
          orderNumber: (invoice as any)?.code || invoiceId,
          total: (invoice as any)?.totalAmount ?? 0,
          orderedAt:
            (invoice as any)?.paidAt ||
            (invoice as any)?.updatedAt ||
            (invoice as any)?.createdAt ||
            new Date().toISOString(),
          paymentMethod: "Cash",
        },
      });
    } catch (err: any) {
      const status = err?.response?.status;
      const message = String(err?.response?.data?.message || err?.message || "");

      if (status === 400 && message.toLowerCase().includes("already paid")) {
        navigate("/payment-success", {
          state: {
            invoiceId,
            orderNumber: (invoice as any)?.code || invoiceId,
            total: (invoice as any)?.totalAmount ?? 0,
            orderedAt:
              (invoice as any)?.paidAt ||
              (invoice as any)?.updatedAt ||
              (invoice as any)?.createdAt ||
              new Date().toISOString(),
            paymentMethod: "Cash",
          },
        });
        return;
      }

      console.error("[StaffCheckout] Cash error:", err);
      setIsCashOrdering(false);
    }
  };

  const getCouponDiscountLabel = (coupon: CouponResponse): string => {
    const type = String((coupon as any)?.discountType || "").toUpperCase();
    const value = Number((coupon as any)?.discountValue || 0);
    if (type.includes("PERCENT")) return `${value}%`;
    if (type.includes("FIX")) return `${formatVND(value)}đ`;
    return value ? `${value}%` : "";
  };

  const getCouponDescription = (coupon: CouponResponse): string => {
    const parts: string[] = [];
    if (Number((coupon as any)?.minOrderValue || 0) > 0) {
      parts.push(`Đơn tối thiểu ${formatVND(Number((coupon as any).minOrderValue))}đ`);
    }
    if (
      (coupon as any)?.maxDiscount !== null &&
      (coupon as any)?.maxDiscount !== undefined &&
      Number((coupon as any).maxDiscount) > 0
    ) {
      parts.push(`Giảm tối đa ${formatVND(Number((coupon as any).maxDiscount))}đ`);
    }
    if ((coupon as any)?.expiredAt) {
      parts.push(`HSD: ${String((coupon as any).expiredAt).slice(0, 10)}`);
    }
    return parts.length ? parts.join(" • ") : "Mã giảm giá khả dụng";
  };

  const subtotal = Number((invoice as any)?.subtotal ?? 0);

  const applyCouponByCode = async (code: string): Promise<boolean> => {
    if (!invoiceId) return false;

    const normalizedCode = String(code || "").trim();
    if (!normalizedCode) return false;

    let selectedCoupon = availableCoupons.find(
      (c) =>
        String((c as any)?.code || "").toLowerCase() === normalizedCode.toLowerCase(),
    );

    if (!selectedCoupon) {
      try {
        const data = await couponService.getActiveCouponsForCustomer();
        const refreshed = Array.isArray(data) ? data : [];
        setAvailableCoupons(refreshed);
        selectedCoupon = refreshed.find(
          (c) =>
            String((c as any)?.code || "").toLowerCase() ===
            normalizedCode.toLowerCase(),
        );
      } catch {
        // ignore
      }
    }

    if (!selectedCoupon) {
      alert("Không tìm thấy voucher này. Vui lòng quét đúng QR voucher của khách.");
      return false;
    }

    const type = String((selectedCoupon as any)?.discountType || "").toUpperCase();
    const value = toNumber((selectedCoupon as any)?.discountValue);
    const maxDiscount =
      (selectedCoupon as any)?.maxDiscount === null ||
      (selectedCoupon as any)?.maxDiscount === undefined
        ? null
        : toNumber((selectedCoupon as any).maxDiscount);

    let discountPercent = 0;
    if (type.includes("PERCENT")) {
      discountPercent = value > 1 ? value / 100 : value;
    } else if (type.includes("FIX")) {
      const fixed = Math.max(
        0,
        maxDiscount && maxDiscount > 0 ? Math.min(value, maxDiscount) : value,
      );
      discountPercent = subtotal > 0 ? fixed / subtotal : 0;
    } else {
      discountPercent = value > 1 ? value / 100 : value;
    }
    discountPercent = Math.max(0, Math.min(1, discountPercent));

    setIsApplyingCoupon(true);
    try {
      const updated = await invoiceService.applyCoupon({
        invoiceId,
        couponCode: normalizedCode,
        discountPercent,
      });

      if (updated) {
        setInvoice(updated);
      } else {
        throw new Error("Empty response when applying coupon");
      }

      setAppliedCoupon(normalizedCode);
      return true;
    } catch (error) {
      console.error("[StaffCheckout] Lỗi áp dụng mã giảm giá:", error);

      setInvoice((prev) => {
        if (!prev) return prev;

        const subtotalValue = Number((prev as any).subtotal ?? 0);
        let discount = subtotalValue * discountPercent;

        if (maxDiscount && maxDiscount > 0) {
          discount = Math.min(discount, maxDiscount);
        }

        const base =
          Number((prev as any).subtotal ?? 0) +
          Number((prev as any).taxAmount ?? 0) +
          Number((prev as any).shippingFee ?? 0) -
          Number((prev as any).pointsDiscount ?? 0);

        const finalAmount = Math.max(base - discount, 0);

        return {
          ...(prev as any),
          discountAmount: discount,
          totalAmount: finalAmount,
        } as any;
      });

      setAppliedCoupon(normalizedCode);
      return true;
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  useEffect(() => {
    applyCouponByCodeRef.current = applyCouponByCode;
  }, [applyCouponByCode]);

  useEffect(() => {
    if (!isQrCouponModalOpen) return;

    setQrCouponError(null);
    qrScanLockedRef.current = false;

    const scanner = new Html5QrcodeScanner(
      "qr-coupon-scanner",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false,
    );

    qrScannerRef.current = scanner;

    const onScanSuccess = async (decodedText: string) => {
      if (qrScanLockedRef.current) return;
      qrScanLockedRef.current = true;

      const code = parseCouponCodeFromQr(decodedText);
      if (!code) {
        setQrCouponError("Không đọc được mã voucher từ QR. Vui lòng thử lại.");
        qrScanLockedRef.current = false;
        return;
      }

      const ok = await applyCouponByCodeRef.current(code);
      if (ok) {
        setIsQrCouponModalOpen(false);
      } else {
        setQrCouponError("Voucher không hợp lệ hoặc không khả dụng.");
        qrScanLockedRef.current = false;
      }
    };

    const onScanFailure = () => {
      // ignore
    };

    scanner.render(onScanSuccess, onScanFailure);

    return () => {
      qrScanLockedRef.current = false;
      const current = qrScannerRef.current;
      qrScannerRef.current = null;
      if (current) {
        current.clear().catch(() => {
          // ignore
        });
      }
    };
  }, [isQrCouponModalOpen]);

  const cartItems = (invoice as any)?.items || [];
  const couponDiscount = Number((invoice as any)?.discountAmount ?? 0);
  const estimatedTax = Number((invoice as any)?.taxAmount ?? 0);
  const shippingFee = Number((invoice as any)?.shippingFee ?? 0);
  const totalAmount = Number((invoice as any)?.totalAmount ?? 0);

  if (shouldShowLoginPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Vui lòng đăng nhập để thanh toán
          </h2>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 px-6 py-2 bg-[#0df259] text-slate-900 rounded-lg font-bold hover:shadow-[0_0_20px_rgba(13,242,89,0.3)] transition-all border-0"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased">
      <div className="layout-container flex h-full grow flex-col">
        <main className="flex h-full w-full flex-1 flex-col px-10 py-10">

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {error}{" "}
              <button
                type="button"
                onClick={() => navigate(cartPath)}
                className="underline hover:no-underline bg-transparent border-0 p-0"
              >
                Quay lại giỏ hàng
              </button>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-10 items-start">
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                  Staff Checkout
                </h1>
                {(invoice as any)?.code && (
                  <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
                    Order: {String((invoice as any)?.code)}
                  </span>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    shopping_bag
                  </span>
                  <h2 className="text-lg font-bold">Review Your Items</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider text-center">
                          Quantity
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider text-right">
                          Price
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider text-right">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {isLoading || isCreatingInvoice ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-10 text-center text-slate-400"
                          >
                            <svg
                              className="w-6 h-6 animate-spin mx-auto"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                              />
                            </svg>
                            {isCreatingInvoice
                              ? "Đang tạo hóa đơn từ giỏ hàng..."
                              : "Đang tải..."}
                          </td>
                        </tr>
                      ) : cartItems.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-10 text-center text-slate-400"
                          >
                            Không có sản phẩm nào trong hóa đơn
                          </td>
                        </tr>
                      ) : (
                        cartItems.map((item: any, index: number) => (
                          <tr key={item?.id || index}>
                            <td className="px-6 py-5">
                              <div className="flex items-center gap-4">
                                <div className="size-16 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-gray-400">
                                    inventory_2
                                  </span>
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-slate-100">
                                    {item?.productName ||
                                      productNameById[String(item?.productId)] ||
                                      "Chưa có tên sản phẩm"}
                                  </p>
                                  <p className="text-sm text-slate-500">
                                    ID: {String(item?.productId ?? "")}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-center text-slate-600 dark:text-slate-400">
                              {Number(item?.quantity ?? 1)}
                            </td>
                            <td className="px-6 py-5 text-right font-medium text-slate-600 dark:text-slate-400">
                              {formatVND(Number(item?.price ?? 0))}
                            </td>
                            <td className="px-6 py-5 text-right font-bold text-slate-900 dark:text-slate-100">
                              {formatVND(
                                Number(
                                  item?.total ??
                                    Number(item?.price ?? 0) *
                                      Number(item?.quantity ?? 1),
                                ),
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <aside className="w-full lg:w-[400px] lg:sticky lg:top-10">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                  <h2 className="text-xl font-bold">Order Summary</h2>
                </div>

                <div className="p-6 space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Coupon Code
                    </label>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={appliedCoupon || ""}
                          readOnly
                          placeholder="Chỉ áp dụng bằng quét QR voucher của khách"
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 px-3 py-2 text-sm focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsQrCouponModalOpen(true)}
                      disabled={!invoiceId || isApplyingCoupon || isLoadingCoupons}
                      className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary rounded-lg transition-all bg-transparent disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined">
                        qr_code_scanner
                      </span>
                      <span className="text-sm font-bold">Quét QR</span>
                    </button>

                    {appliedCoupon && (
                      <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                        <span className="material-symbols-outlined text-sm">
                          verified
                        </span>
                        <span>{appliedCoupon} Applied!</span>
                      </div>
                    )}
                  </div>

                  {isQrCouponModalOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 py-6">
                      <button
                        type="button"
                        aria-label="Đóng"
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setIsQrCouponModalOpen(false)}
                      />

                      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                          <div>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                              Quét QR Voucher
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                              Chỉ áp dụng voucher bằng QR của khách hàng
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsQrCouponModalOpen(false)}
                            className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors border-0 bg-transparent"
                            title="Đóng"
                          >
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        </div>

                        <div className="p-4 space-y-3">
                          <div id="qr-coupon-scanner" className="w-full" />

                          <div className="text-xs text-slate-500">
                            Đưa QR voucher của khách vào khung camera để tự động áp dụng.
                          </div>

                          {qrCouponError && (
                            <div className="text-xs text-red-600">
                              {qrCouponError}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => setIsQrCouponModalOpen(false)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                          >
                            Đóng
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <hr className="border-slate-100 dark:border-slate-800" />

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>Subtotal</span>
                      <span>{formatVND(subtotal)}</span>
                    </div>
                    {appliedCoupon && couponDiscount > 0 && (
                      <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                        <span>Coupon Discount ({appliedCoupon})</span>
                        <span className="text-red-500 font-medium">
                          -{formatVND(couponDiscount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>Estimated Tax</span>
                      <span>{formatVND(estimatedTax)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>Shipping</span>
                      <span className="text-primary font-bold uppercase text-[10px]">
                        {shippingFee > 0 ? formatVND(shippingFee) : "Free"}
                      </span>
                    </div>
                    <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">
                          Total Amount
                        </p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">
                          {formatVND(totalAmount)}
                        </p>
                      </div>
                      <div className="text-right">
                        {appliedCoupon && couponDiscount > 0 ? (
                          <p className="text-[10px] font-bold text-primary uppercase">
                            You saved {formatVND(couponDiscount)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={handleCashPayment}
                        disabled={
                          isCashOrdering || isCreatingInvoice || !invoiceId || !!error
                        }
                        className="w-full flex items-center justify-center gap-2 py-4 bg-[#0df259] text-slate-900 font-black rounded-xl hover:shadow-[0_0_20px_rgba(13,242,89,0.3)] transition-all transform active:scale-[0.98] border-0 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined">payments</span>
                        {isCashOrdering
                          ? "Đang xử lý..."
                          : "Thanh toán tiền mặt"}
                      </button>
                      <button
                        type="button"
                        onClick={handleMomoPayment}
                        disabled={
                          isOrdering || isCreatingInvoice || !invoiceId || !!error
                        }
                        className="w-full flex items-center justify-center gap-2 py-4 bg-[#0df259] text-slate-900 font-black rounded-xl hover:shadow-[0_0_20px_rgba(13,242,89,0.3)] transition-all transform active:scale-[0.98] border-0 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined">
                          account_balance
                        </span>
                        {isOrdering
                          ? "Đang tạo thanh toán..."
                          : "Thanh toán chuyển khoản"}
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(cartPath)}
                        className="w-full flex items-center justify-center gap-2 py-3 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all bg-transparent"
                      >
                        Quay lại giỏ hàng
                      </button>
                    </div>

                    <div className="flex items-center justify-center gap-4 grayscale opacity-50">
                      <span className="material-symbols-outlined text-2xl">
                        credit_card
                      </span>
                      <span className="material-symbols-outlined text-2xl">
                        account_balance_wallet
                      </span>
                      <span className="material-symbols-outlined text-2xl">
                        payments
                      </span>
                    </div>

                    <p className="text-[10px] text-center text-slate-400 font-medium">
                      By placing your order, you agree to our{" "}
                      <span className="underline">Terms of Service</span> and{" "}
                      <span className="underline">Privacy Policy</span>.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-6 px-4">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="material-symbols-outlined text-lg">
                    verified_user
                  </span>
                  <span className="text-[10px] font-bold uppercase">
                    Secure Checkout
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="material-symbols-outlined text-lg">
                    local_shipping
                  </span>
                  <span className="text-[10px] font-bold uppercase">
                    Fast Delivery
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="material-symbols-outlined text-lg">
                    assignment_return
                  </span>
                  <span className="text-[10px] font-bold uppercase">
                    30-Day Returns
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-10 py-6 mt-auto">
        <div className="mx-auto max-w-[1280px] flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-xs">
          <div className="flex items-center gap-4">
            <span>© 2024 ShopEase Inc. All rights reserved.</span>
            <span className="hover:text-primary cursor-pointer">Support</span>
            <span className="hover:text-primary cursor-pointer">Track Order</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">shield</span>
              Safe &amp; Secure
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">language</span>
              English (US)
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
