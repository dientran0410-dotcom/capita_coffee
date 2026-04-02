import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import invoiceService from "../../../services/InvoiceService";
import MomoService from "../../../services/MomoService";
import couponService from "../../../services/couponService";
import CartService from "../../../services/CartService";
import pointsBalanceService from "../../../services/PointsBalanceService";
import loyaltyService from "../../../services/loyaltyService";
import { apiUtils } from "../../../api/axios";
import { CUSTOMER_ENGAGEMENT_REGISTER_URL } from "../../../constants/apiEndPoints";
import { getCurrentCustomerMeProfile } from "../../../services/customerService";
import { getProductById } from "../../../services/productService";
import type { Invoice } from "../../../types/Invoice";
import type { CouponResponse } from "../../../types/coupon";
import {
  extractUserId,
  extractUserIdFromToken,
  getStoredToken,
  clearAuthStorage,
} from "../../../utils/authHelpers";

const PRODUCT_CATALOG_STORAGE_KEY = "productCatalog_v1";

type ProductCatalogEntry = { id: string; name: string };

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
      if (id && name) {
        map[String(id)] = String(name);
      }
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
    // ignore storage errors
  }
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Get invoiceId or create if coming from cart
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponSearch, setCouponSearch] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [loyaltyPointsToUse, setLoyaltyPointsToUse] = useState(0);
  const [isOrdering, setIsOrdering] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  // Real coupon + loyalty points from APIs
  const [availableCoupons, setAvailableCoupons] = useState<CouponResponse[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(0);
  const [loyaltyTierName, setLoyaltyTierName] = useState<string>("");
  const [isLoadingPoints, setIsLoadingPoints] = useState(false);

  const [productNameById, setProductNameById] = useState<Record<string, string>>({});
  const productNameByIdRef = useRef<Record<string, string>>({});

  const [customerMeDetails, setCustomerMeDetails] = useState<{
    name?: string;
    phone?: string;
    address?: string;
  } | null>(null);
  const [isLoadingCustomerMeDetails, setIsLoadingCustomerMeDetails] = useState(false);

  // Prevent stale async init from overwriting a newer checkout (cart vs buy-now)
  const initSeqRef = useRef(0);

  const BUY_NOW_INTENT_KEY = "buyNowIntent_v1";
  const readBuyNowIntent = (): any | null => {
    try {
      const raw = sessionStorage.getItem(BUY_NOW_INTENT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const at = Number(parsed?.at ?? 0);
      // expire after 10 minutes
      if (!at || Date.now() - at > 10 * 60 * 1000) return null;
      if (parsed?.checkoutMode !== "buy_now" || !parsed?.buyNowItem) return null;
      return parsed;
    } catch {
      return null;
    }
  };

  const clearBuyNowIntent = () => {
    try {
      sessionStorage.removeItem(BUY_NOW_INTENT_KEY);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    productNameByIdRef.current = productNameById;
  }, [productNameById]);


  // Memoize userId to prevent unnecessary recalculations
  const userId = useMemo(() => extractUserId(user), [user]);

  // Memoize auth checks
  const hasValidToken = useMemo(() => !!getStoredToken(), []);
  const shouldShowLoginPrompt = !isAuthenticated && !hasValidToken && !userId;
  const cartPath = location.pathname.startsWith("/staff") ? "/staff/cart" : "/cart";

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
    // Accept generic UUID-like format (8-4-4-4-12). Some environments use test IDs that do not follow RFC version bits.
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
  };

  const hasNonEmptyId = (value: unknown): boolean => {
    return String(value ?? "").trim().length > 0;
  };

  const extractFranchiseId = (): string | null => {
    const stored = getStoredUserObject();
    const candidates = [
      invoice?.franchiseId,
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
      invoice?.customerId,
    ];
    for (const c of candidates) {
      const num = toPositiveInt(c);
      if (num) return num;
    }
    return null;
  };

  const extractCustomerIdForCouponCheckout = (): string | null => {
    const stored = getStoredUserObject();
    const candidates = [
      invoice?.customerId,
      (user as any)?.id,
      (user as any)?.userId,
      (user as any)?.staffId,
      (user as any)?.raw?.id,
      (user as any)?.raw?.userId,
      (user as any)?.raw?.user?.id,
      (user as any)?.raw?.user?.userId,
      (user as any)?.raw?.data?.userId,
      (stored as any)?.id,
      (stored as any)?.userId,
      (stored as any)?.staffId,
      (stored as any)?.raw?.id,
      (stored as any)?.raw?.userId,
      (stored as any)?.raw?.user?.id,
      (stored as any)?.raw?.data?.userId,
    ];

    for (const c of candidates) {
      if (c === undefined || c === null) continue;
      const value = String(c).trim();
      if (value) return value;
    }

    return null;
  };

  const resolveVariantIdForOrderItem = (item: any, index: number): string | null => {
    const fromItemCandidates = [
      item?.variantId,
      item?.productVariantId,
      item?.variant?.variantId,
      item?.variant?.id,
    ];

    for (const candidate of fromItemCandidates) {
      if (isUuid(candidate)) return String(candidate).trim();
    }

    const navState = (location.state || {}) as any;
    const cartItems = Array.isArray(navState?.cartData?.items)
      ? navState.cartData.items
      : [];

    const fromMatchedCartItem = cartItems.find((cartIt: any) => {
      const sameProduct = String(cartIt?.productId ?? "") === String(item?.productId ?? "");
      const sameQuantity = Number(cartIt?.quantity ?? -1) === Number(item?.quantity ?? -2);
      return sameProduct && sameQuantity;
    });

    const fromIndexCartItem = cartItems[index];
    const fromCartCandidates = [
      fromMatchedCartItem?.variantId,
      fromMatchedCartItem?.productVariantId,
      fromIndexCartItem?.variantId,
      fromIndexCartItem?.productVariantId,
    ];

    for (const candidate of fromCartCandidates) {
      if (isUuid(candidate)) return String(candidate).trim();
    }

    return null;
  };

  const fillMissingVariantsFromServerCart = async (
    sourceItems: any[],
    customerId: string,
  ): Promise<any[]> => {
    const nextItems = sourceItems.map((it) => ({ ...it }));
    const hasMissing = nextItems.some(
      (it) => !hasNonEmptyId(it?.variantId) && !hasNonEmptyId(it?.productVariantId),
    );

    if (!hasMissing) return nextItems;

    try {
      const cart = await CartService.getCart(customerId, true);
      const cartItems = Array.isArray((cart as any)?.items) ? (cart as any).items : [];

      nextItems.forEach((orderItem, idx) => {
        if (hasNonEmptyId(orderItem?.variantId) || hasNonEmptyId(orderItem?.productVariantId)) {
          return;
        }

        const sameProductAndQty = cartItems.find((cartIt: any) => {
          return (
            String(cartIt?.productId ?? "").trim() === String(orderItem?.productId ?? "").trim() &&
            Number(cartIt?.quantity ?? -1) === Number(orderItem?.quantity ?? -2) &&
            hasNonEmptyId(cartIt?.variantId || cartIt?.productVariantId)
          );
        });

        const sameProduct = cartItems.find((cartIt: any) => {
          return (
            String(cartIt?.productId ?? "").trim() === String(orderItem?.productId ?? "").trim() &&
            hasNonEmptyId(cartIt?.variantId || cartIt?.productVariantId)
          );
        });

        const matched = sameProductAndQty || sameProduct;
        const variantId = String(
          matched?.variantId ?? matched?.productVariantId ?? "",
        ).trim();

        if (variantId) {
          nextItems[idx].variantId = variantId;
          nextItems[idx].productVariantId = variantId;
        }
      });
    } catch (err) {
      console.warn("[Checkout] Could not fill variant IDs from cart API:", err);
    }

    return nextItems;
  };

  const buildOrderCreateRequest = (): Record<string, unknown> => {
    const mappedItems = (invoice?.items ?? []).map((item: any, index: number) => {
      const variantId = resolveVariantIdForOrderItem(item, index);

      return {
        productId: String(item?.productId ?? "").trim(),
        quantity: Number(item?.quantity ?? 0),
        price: Number(item?.price ?? 0),
        variantId: variantId || undefined,
        productVariantId: variantId || undefined,
      };
    });

    return {
      invoiceId,
      franchiseId: extractFranchiseId(),
      items: mappedItems,
      orderItems: mappedItems,
      subtotal: Number(invoice?.subtotal ?? 0),
      taxAmount: Number(invoice?.taxAmount ?? 0),
      shippingFee: Number(invoice?.shippingFee ?? 0),
      pointsDiscount: Number(invoice?.pointsDiscount ?? 0),
      totalAmount: Number(invoice?.totalAmount ?? 0),
    };
  };

  const persistCheckoutOrderRequest = () => {
    if (!invoiceId) return;
    try {
      const payload = buildOrderCreateRequest();
      localStorage.setItem(
        `checkout-order-request:${invoiceId}`,
        JSON.stringify(payload),
      );
    } catch (e) {
      if (import.meta.env.DEV) {
        console.warn("[Checkout] Failed to persist checkout-order-request", e);
      }
    }
  };

  const getCouponDiscountLabel = (coupon: CouponResponse): string => {
    const type = String(coupon?.discountType || "").toUpperCase();
    const value = Number(coupon?.discountValue || 0);
    if (type.includes("PERCENT")) return `${value}%`;
    if (type.includes("FIX")) return `${formatVND(value)}đ`;
    return value ? `${value}%` : "";
  };

  const getCouponDescription = (coupon: CouponResponse): string => {
    const parts: string[] = [];
    if (Number(coupon?.minOrderValue || 0) > 0) {
      parts.push(`Đơn tối thiểu ${formatVND(Number(coupon.minOrderValue))}đ`);
    }
    if (coupon?.maxDiscount !== null && coupon?.maxDiscount !== undefined && Number(coupon.maxDiscount) > 0) {
      parts.push(`Giảm tối đa ${formatVND(Number(coupon.maxDiscount))}đ`);
    }
    if (coupon?.expiredAt) {
      parts.push(`HSD: ${String(coupon.expiredAt).slice(0, 10)}`);
    }
    return parts.length ? parts.join(" • ") : "Mã giảm giá khả dụng";
  };

  // Load coupon list for customer
  useEffect(() => {
    let cancelled = false;

    const loadCoupons = async () => {
      setIsLoadingCoupons(true);
      try {
        const data = await couponService.getActiveCouponsForCustomer();
        const coupons = Array.isArray(data) ? data : [];

        const resolvedCustomerId = String(
          extractCustomerIdForCouponCheckout() ?? extractUserIdFromToken(getStoredToken()) ?? "",
        ).trim();

        let filteredCoupons = coupons;
        if (resolvedCustomerId) {
          try {
            const applied = await couponService.getMyAppliedCoupons(resolvedCustomerId);
            const usedCodes = new Set(
              (Array.isArray(applied) ? applied : [])
                .filter((item) => String(item?.status ?? "").toUpperCase() === "USED")
                .map((item) => String(item?.code ?? "").trim().toUpperCase())
                .filter(Boolean),
            );

            if (usedCodes.size > 0) {
              filteredCoupons = coupons.filter(
                (coupon) => !usedCodes.has(String(coupon?.code ?? "").trim().toUpperCase()),
              );
            }
          } catch {
            // If applied-coupon list fails, still allow showing active coupons.
          }
        }

        if (!cancelled) setAvailableCoupons(filteredCoupons);
      } catch (err: any) {
        console.error("[Checkout] Failed to load coupons:", err);
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
  }, [user, invoice?.customerId]);

  // Load customer delivery info (GET /api/auth-service/customers/me/details)
  useEffect(() => {
    let cancelled = false;

    const loadCustomerMeDetails = async () => {
      // Only load when we have auth context
      const token = getStoredToken();
      if (!isAuthenticated && !token) return;

      setIsLoadingCustomerMeDetails(true);
      try {
        const res = await getCurrentCustomerMeProfile();
        const data = (res as any)?.data;
        if (!cancelled) {
          setCustomerMeDetails({
            name: String(data?.name || "").trim() || undefined,
            phone: String(data?.phone || "").trim() || undefined,
            address: String(data?.address || "").trim() || undefined,
          });
        }
      } catch (err: any) {
        console.error("[Checkout] Failed to load customer me details:", err);
        const status = err?.status ?? err?.response?.status;
        if (status === 401) {
          alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          clearAuthStorage();
          navigate("/login", { replace: true });
          return;
        }
        if (!cancelled) setCustomerMeDetails(null);
      } finally {
        if (!cancelled) setIsLoadingCustomerMeDetails(false);
      }
    };

    loadCustomerMeDetails();
    return () => {
      cancelled = true;
    };
  }, [userId, isAuthenticated]);

  // Load loyalty points for customer (depends on franchiseId/customerId)
  useEffect(() => {
    let cancelled = false;

    const loadPoints = async () => {
      const franchiseId = extractFranchiseId();
      const customerId = extractCustomerIdForCouponCheckout();
      const customerIdNum = extractCustomerNumericId();

      if (!customerId || !franchiseId) {
        if (!cancelled) {
          setLoyaltyPoints(0);
          setLoyaltyTierName("");
          setLoyaltyPointsToUse(0);
          setUsePoints(false);
        }
        return;
      }

      const token = getStoredToken();
      const customerIdCandidates = Array.from(
        new Set(
          [customerId, customerIdNum ? String(customerIdNum) : null].filter(Boolean) as string[],
        ),
      );

      const registerEngagement = async (cid: string) => {
        if (!token) return;

        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
          "X-Skip-Auth": "true",
          "X-Skip-401-Redirect": "true",
          "X-User-Role": "CUSTOMER",
          "X-User-Id": cid,
        };

        const name = String((user as any)?.username || (user as any)?.name || "").trim();
        if (name) headers["X-User-Name"] = encodeURIComponent(name);

        await apiUtils.post(CUSTOMER_ENGAGEMENT_REGISTER_URL(franchiseId), undefined, {
          headers,
          skipAuth: true,
        } as any);
      };

      const applyEngagementToState = (engagement: any) => {
        const points = Number(engagement?.currentPoints ?? 0);
        if (!cancelled) {
          setLoyaltyPoints(points);
          setLoyaltyPointsToUse((prev) => Math.min(prev, points));
          setLoyaltyTierName(String(engagement?.tierName ?? ""));
          if (points <= 0) setUsePoints(false);
        }
      };

      setIsLoadingPoints(true);
      try {
        // 1) Prefer engagement API (new)
        for (const cid of customerIdCandidates) {
          try {
            const engagement = await loyaltyService.getCustomerEngagement(cid, franchiseId);
            applyEngagementToState(engagement);
            return;
          } catch (e: any) {
            const status = e?.status ?? e?.response?.status;
            const message = String(e?.message || "").toLowerCase();

            if (status === 401) throw e;

            const shouldTryRegister =
              status === 404 ||
              status === 400 ||
              message.includes("customer not found") ||
              message.includes("not found");

            if (shouldTryRegister) {
              try {
                await registerEngagement(cid);
                const engagement = await loyaltyService.getCustomerEngagement(cid, franchiseId);
                applyEngagementToState(engagement);
                return;
              } catch {
                // continue to next candidate / fallback
              }
            }
          }
        }

        // 2) Fallback: legacy points balance endpoint
        try {
          const result = await pointsBalanceService.getPointsBalance(customerId, franchiseId);
          const points = Number(result?.currentPoints ?? 0);
          if (!cancelled) {
            setLoyaltyPoints(points);
            setLoyaltyPointsToUse((prev) => Math.min(prev, points));
            setLoyaltyTierName(String(result?.tier?.tierName ?? ""));
            if (points <= 0) setUsePoints(false);
          }
          return;
        } catch {
          // ignore
        }

        if (!cancelled) {
          setLoyaltyPoints(0);
          setLoyaltyTierName("");
          setLoyaltyPointsToUse(0);
          setUsePoints(false);
        }
      } catch (err: any) {
        console.error("[Checkout] Failed to load points balance:", err);
        const status = err?.status ?? err?.response?.status;
        if (status === 401) {
          alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem điểm thưởng.");
          clearAuthStorage();
          navigate("/login", { replace: true });
          return;
        }

        if (!cancelled) {
          setLoyaltyPoints(0);
          setLoyaltyTierName("");
          setLoyaltyPointsToUse(0);
          setUsePoints(false);
        }
      } finally {
        if (!cancelled) setIsLoadingPoints(false);
      }
    };

    loadPoints();
    return () => {
      cancelled = true;
    };
  }, [invoice?.franchiseId, invoice?.customerId, user]);

  const vndPerPoint = 250;

  const formatVND = (amount: number) => amount.toLocaleString("vi-VN");

  // Early return nếu thực sự chưa authenticated
  if (shouldShowLoginPrompt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Vui lòng đăng nhập để thanh toán
          </h2>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  // Get cart/invoice data and calculate totals
  const cartItems = invoice?.items || [];
  const subtotal = invoice?.subtotal || 0;
  const couponDiscount = invoice?.discountAmount || 0;
  const loyaltyDiscount = invoice?.pointsDiscount || 0;
  const estimatedTax = invoice?.taxAmount || 0;
  const totalAmount = invoice?.totalAmount || 0;

  const { eligibleCoupons, ineligibleCoupons } = useMemo(() => {
    const eligible: CouponResponse[] = [];
    const ineligible: CouponResponse[] = [];

    const q = couponSearch.trim().toLowerCase();

    for (const coupon of availableCoupons) {
      const code = String(coupon?.code || "");
      if (q && !code.toLowerCase().includes(q)) continue;

      const min = Number((coupon as any)?.minOrderValue ?? 0);
      if (Number.isFinite(min) && min > 0 && subtotal < min) {
        ineligible.push(coupon);
      } else {
        eligible.push(coupon);
      }
    }

    return { eligibleCoupons: eligible, ineligibleCoupons: ineligible };
  }, [availableCoupons, subtotal, couponSearch]);

  // Initialize invoice on mount
  useEffect(() => {
    const initializeInvoice = async () => {
      const seq = ++initSeqRef.current;

      // Use memoized userId or try fallback only if needed
      let effectiveUserId = userId;

      if (!effectiveUserId && hasValidToken) {
        // Try to get user ID from stored user data as fallback
        const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            effectiveUserId = parsed.id || parsed.userId || parsed.staffId;
            if (process.env.NODE_ENV === 'development') {
              console.log("[Checkout] Using fallback user ID:", effectiveUserId);
            }
          } catch (e) {
            console.error("[Checkout] Failed to parse stored user:", e);
          }
        }
      }

      if (!effectiveUserId) {
        console.error("[Checkout] No user ID available, cannot initialize invoice");
        alert("Không thể xác định thông tin người dùng. Vui lòng đăng nhập lại.");
        navigate("/login", { replace: true });
        return;
      }

      try {
        setIsLoading(true);
        setInvoice(null);
        setInvoiceId(null);

        const navStateRaw = (location.state || {}) as any;
        const explicitCart =
          navStateRaw?.checkoutMode === "cart" || navStateRaw?.fromCart || navStateRaw?.fromApi;

        // Recover buy-now intent if router state is missing (but never override explicit cart checkout)
        const recoveredRaw = !explicitCart ? readBuyNowIntent() : null;
        const recoveredBuyNow =
          recoveredRaw && recoveredRaw?.customerId && String(recoveredRaw.customerId) !== String(effectiveUserId)
            ? null
            : recoveredRaw;

        const navState =
          navStateRaw && Object.keys(navStateRaw).length ? navStateRaw : recoveredBuyNow;

        const isBuyNow = navState?.checkoutMode === "buy_now" && navState?.buyNowItem;

        if (process.env.NODE_ENV === "development") {
          console.log("[Checkout] init", {
            seq,
            checkoutMode: navState?.checkoutMode,
            hasBuyNowItem: !!navState?.buyNowItem,
            explicitCart,
          });
        }

        // 1) If we have invoiceId from navigation state, load it
        const existingInvoiceId = navState?.invoiceId;
        if (existingInvoiceId && typeof existingInvoiceId === "string") {
          if (process.env.NODE_ENV === 'development') {
            console.log("[Checkout] Loading existing invoice:", existingInvoiceId);
          }
          const data = await invoiceService.getInvoice(existingInvoiceId);
          if (seq !== initSeqRef.current) return;
          setInvoice(data);
          setInvoiceId(existingInvoiceId);
          return;
        }

        // 2) "Buy now" mode: create invoice directly (no cart dependency)
        if (isBuyNow) {
          const buyItem = navState.buyNowItem;

          const variantId = buyItem?.variantId || buyItem?.productVariantId;
          const productId = buyItem?.productId;
          const quantityRaw = buyItem?.quantity ?? buyItem?.qty ?? 1;
          const quantity = Number(quantityRaw);

          if (!variantId) {
            throw new Error("Missing variantId for buy-now checkout");
          }

          if (process.env.NODE_ENV === "development") {
            console.log("[Checkout] Buy-now mode: creating invoice", {
              productId,
              variantId,
              quantity,
            });
          }

          setIsCreatingInvoice(true);

          const buyNowRes = await invoiceService.buyNow({
            customerId: String(effectiveUserId),
            productId: productId != null ? String(productId) : undefined,
            variantId: String(variantId),
            quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
          });

          if (seq !== initSeqRef.current) return;

          const createdInvoiceId = String(buyNowRes.invoiceId);
          const total = toNumber((buyNowRes as any)?.totalAmount);

          // Avoid GET /invoices/{id} which may fail (backend lazy JSON). Use BuyNowResponse to render checkout.
          setInvoice({
            id: createdInvoiceId,
            customerId: String(effectiveUserId),
            subtotal: total,
            discountAmount: 0,
            pointsDiscount: 0,
            taxAmount: 0,
            totalAmount: total,
            status: "PENDING_PAYMENT",
            items: (buyNowRes.items || []).map((it: any) => {
              const price = toNumber(it?.price);
              const qty = toNumber(it?.quantity) || 1;
              return {
                productId: String(it?.productId ?? ""),
                price,
                quantity: qty,
                total: price * qty,
              };
            }),
          } as Invoice);
          setInvoiceId(createdInvoiceId);
          clearBuyNowIntent();
          return;
        }

        // 3) Cart mode: only create invoice from cart when user came from cart page
        const cameFromCart = !!(
          navState?.checkoutMode === "cart" ||
          navState?.fromCart ||
          navState?.fromApi
        );
        if (!cameFromCart) {
          alert("Vui lòng vào giỏ hàng và nhấn Thanh toán, hoặc dùng chức năng Đặt ngay để thanh toán 1 sản phẩm.");
          navigate(cartPath, { replace: true });
          return;
        }

        if (process.env.NODE_ENV === 'development') {
          console.log("[Checkout] Creating cart invoice for customer:", effectiveUserId);
        }
        setIsCreatingInvoice(true);
        const newInvoice = await invoiceService.createInvoice({
          customerId: String(effectiveUserId),
        });
        if (seq !== initSeqRef.current) return;
        setInvoice(newInvoice);
        setInvoiceId(newInvoice.id);

      } catch (error: any) {
        console.error("Error initializing invoice:", error);

        // Check if it's a 401 error
        if (error?.response?.status === 401 || error?.status === 401) {
          console.error("[Checkout] 401 Unauthorized - token may be invalid or expired");
          alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
          clearAuthStorage();
          navigate("/login", { replace: true });
          return;
        }

        const navState = (location.state || {}) as any;
        const recovered = readBuyNowIntent();
        const isBuyNow =
          (navState?.checkoutMode === "buy_now" && navState?.buyNowItem) ||
          (recovered?.checkoutMode === "buy_now" && recovered?.buyNowItem);

        const serverMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          (typeof error?.response?.data === "string" ? error.response.data : null);

        // In buy-now, do NOT fall back to cart (avoids showing wrong item from cart)
        alert(
          serverMessage
            ? `Không thể tải thông tin hóa đơn. Lỗi: ${serverMessage}`
            : "Không thể tải thông tin hóa đơn. Vui lòng thử lại."
        );

        if (isBuyNow) {
          const homePath = location.pathname.startsWith("/staff") ? "/staff" : "/customer";
          navigate(homePath, { replace: true });
        } else {
          navigate(cartPath, { replace: true });
        }
      } finally {
        if (seq === initSeqRef.current) {
          setIsLoading(false);
          setIsCreatingInvoice(false);
        }
      }
    };

    initializeInvoice();

    return () => {
      // Invalidate any in-flight init
      initSeqRef.current++;
    };
  }, [userId, hasValidToken, location.state, navigate]);

  useEffect(() => {
    if (!invoice?.items?.length) return;

    const cachedMap = readProductCatalogMap();

    const mergeNamesIntoInvoice = (nameMap: Record<string, string>) => {
      setInvoice((prev) => {
        if (!prev?.items?.length) return prev;
        let changed = false;
        const nextItems = prev.items.map((it: any) => {
          if (it?.productName) return it;
          const resolved = nameMap[String(it?.productId ?? "")];
          if (!resolved) return it;
          changed = true;
          return { ...it, productName: resolved };
        });
        return changed ? { ...prev, items: nextItems } : prev;
      });
    };

    // Apply cached names immediately
    if (Object.keys(cachedMap).length) {
      setProductNameById((prev) => ({ ...cachedMap, ...prev }));
      mergeNamesIntoInvoice({ ...cachedMap, ...productNameByIdRef.current });
    }

    const currentMap = { ...cachedMap, ...productNameByIdRef.current };
    const missingIds = Array.from(
      new Set(
        (invoice.items as any[])
          .filter((it) => !it?.productName)
          .map((it) => String(it?.productId ?? ""))
          .filter(Boolean)
          .filter((id) => !currentMap[id]),
      ),
    );

    if (missingIds.length === 0) return;

    let cancelled = false;

    (async () => {
      const results = await Promise.allSettled(
        missingIds.map((id) => getProductById(String(id))),
      );

      const fetched: Record<string, string> = {};
      results.forEach((res, idx) => {
        if (res.status === "fulfilled") {
          fetched[missingIds[idx]] = String(res.value?.name ?? "");
        }
      });

      // Remove empty names
      Object.keys(fetched).forEach((id) => {
        if (!fetched[id]) delete fetched[id];
      });

      if (cancelled) return;
      if (Object.keys(fetched).length === 0) return;

      setProductNameById((prev) => ({ ...prev, ...fetched }));
      mergeNamesIntoInvoice({ ...currentMap, ...fetched });
      writeProductCatalogMap({ ...currentMap, ...fetched });
    })();

    return () => {
      cancelled = true;
    };
  }, [invoice?.items]);

  useEffect(() => {
    if (!isCouponModalOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsCouponModalOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isCouponModalOpen]);

  useEffect(() => {
    if (!invoiceId) return;

    const storageKey = `checkout-coupon:${invoiceId}`;
    if (appliedCoupon) {
      localStorage.setItem(storageKey, appliedCoupon.toUpperCase());
      return;
    }

    localStorage.removeItem(storageKey);
  }, [invoiceId, appliedCoupon]);

  useEffect(() => {
    if (!invoiceId) return;

    const customerId = String(extractCustomerIdForCouponCheckout() ?? "").trim();
    const storageKey = `checkout-customer:${invoiceId}`;

    if (customerId) {
      localStorage.setItem(storageKey, customerId);
      return;
    }

    localStorage.removeItem(storageKey);
  }, [invoiceId, invoice?.customerId, user]);

  const handlePlaceOrder = async () => {
    if (!invoiceId) return;

    setIsOrdering(true);
    try {
      persistCheckoutOrderRequest();

      // Ensure invoice is checked out (backend creates transaction against invoiceId)
      await invoiceService.checkout({ invoiceId });

      const amount = Number(invoice?.totalAmount ?? 0);
      if (!amount || Number.isNaN(amount) || amount <= 0) {
        throw new Error(`Invalid amount for MoMo payment: ${amount}`);
      }

      const momo = await MomoService.createMomoPayment({
        orderId: String(invoiceId),
        amount,
      });

      const payUrl = momo?.payUrl;
      if (payUrl) {
        window.location.href = payUrl;
        return;
      }

      // If backend returns QR only, at least show a clear message instead of navigating to a missing route.
      throw new Error("MoMo did not return payUrl");
    } catch (error) {
      console.error("Lỗi thanh toán chuyển khoản (MoMo):", error);
      alert("Không thể tạo thanh toán MoMo. Vui lòng thử lại.");
      setIsOrdering(false);
    }
  };

  const applyCouponByCode = async (code: string): Promise<boolean> => {
    const normalized = String(code || "").trim();
    if (!normalized || !invoiceId) return false;
    if (isApplyingCoupon) return false;

    const normalizedCode = normalized.toUpperCase();

    const selectedCoupon = availableCoupons.find(
      (c) => String(c?.code ?? "").toUpperCase() === normalizedCode,
    );

    if (!selectedCoupon) {
      alert("Không tìm thấy mã giảm giá này.");
      return false;
    }

    if (
      Number(selectedCoupon.minOrderValue || 0) > 0 &&
      subtotal < Number(selectedCoupon.minOrderValue)
    ) {
      alert(
        `Đơn hàng chưa đạt tối thiểu ${formatVND(Number(selectedCoupon.minOrderValue))}đ để dùng mã này.`,
      );
      return false;
    }

    const type = String(selectedCoupon?.discountType || "").toUpperCase();
    const value = toNumber((selectedCoupon as any)?.discountValue);
    const maxDiscount =
      selectedCoupon?.maxDiscount === null || selectedCoupon?.maxDiscount === undefined
        ? null
        : toNumber(selectedCoupon.maxDiscount);

    // Backend invoice API expects discountPercent in [0..1]
    let discountPercent = 0;
    if (type.includes("PERCENT")) {
      // discountValue is displayed as e.g. 10 (%)
      discountPercent = value > 1 ? value / 100 : value;
    } else if (type.includes("FIX")) {
      const fixed = Math.max(0, maxDiscount && maxDiscount > 0 ? Math.min(value, maxDiscount) : value);
      discountPercent = subtotal > 0 ? fixed / subtotal : 0;
    } else {
      discountPercent = value > 1 ? value / 100 : value;
    }
    discountPercent = Math.max(0, Math.min(1, discountPercent));

    setIsApplyingCoupon(true);
    try {
      const customerId = String(
        extractCustomerIdForCouponCheckout() ?? extractUserIdFromToken(getStoredToken()) ?? "",
      ).trim();

      if (!customerId) {
        alert("Không xác định được tài khoản khách hàng để áp dụng coupon.");
        return false;
      }

      // Must register coupon usage first so backend can track PENDING -> USED on checkout.
      await couponService.applyCoupon({
        customerId,
        couponCode: normalizedCode,
      });

      // Prefer backend invoice update
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
    } catch (error: any) {
      console.error("Lỗi áp dụng mã giảm giá:", error);
      const message =
        String(error?.response?.data?.message || error?.message || "").trim() ||
        "Không thể áp dụng mã giảm giá này.";
      alert(message);
      return false;
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleTogglePoints = async (checked: boolean) => {
    if (!invoiceId) return;

    if (checked && loyaltyPointsToUse > 0) {
      try {
        // Apply points and use returned invoice to update UI.
        // NOTE: getInvoice() endpoint is currently unstable (400 "no Session"), so avoid refetching.
        const updated = await invoiceService.applyPoints({
          invoiceId,
          points: loyaltyPointsToUse,
        });

        if (updated) {
          setInvoice(updated);
        }
        setUsePoints(true);
      } catch (error) {
        console.error("Lỗi áp dụng điểm thưởng:", error);
      }
    } else {
      setUsePoints(false);
    }
  };

  const handleChooseCoupon = async (code: string) => {
    const ok = await applyCouponByCode(code);
    if (ok) setIsCouponModalOpen(false);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 antialiased">
      {/* ── Main ── */}
      <main className="flex w-full flex-1 flex-col px-10 py-10">
        {/* Breadcrumb */}
        {/* <div className="flex items-center gap-2 mb-8">
          <a className="text-slate-500 text-sm font-medium hover:text-primary" href="#">Trang chủ</a>
          <span className="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
          <a className="text-slate-500 text-sm font-medium hover:text-primary" href="#">Giỏ hàng</a>
          <span className="material-symbols-outlined text-sm text-slate-400">chevron_right</span>
          <span className="text-slate-900 dark:text-white text-sm font-semibold">Thanh toán</span>
        </div> */}

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            THANH TOÁN
          </h1>
          {/* <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
            Mã đơn hàng: #SHP-8291
          </span> */}
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* ── Left column ── */}
          <div className="flex-1 w-full">
            {/* Payment Information */}
            <div className="mb-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  info
                </span>
                <h2 className="text-lg font-bold text-primary">THÔNG TIN THANH TOÁN</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">
                      MÃ ĐƠN HÀNG
                    </p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      #{invoice?.code || invoiceId || "---"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">
                      MÃ THANH TOÁN
                    </p>
                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {invoice?.paymentCode || `PAY-${invoiceId?.slice(0, 8).toUpperCase() || "---"}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">
                      SỐ TIỀN
                    </p>
                    <p className="text-xl font-bold text-primary">
                      {formatVND(invoice?.totalAmount ?? 0)} VNĐ
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">
                      TRẠNG THÁI HIỆN TẠI
                    </p>
                    <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${
                      invoice?.status === "PAID" 
                        ? "bg-green-100 text-green-700 border border-green-300" 
                        : "bg-yellow-50 text-yellow-700 border border-yellow-300"
                    }`}>
                      {invoice?.status === "PAID" ? "Đã thanh toán" : "Đang chờ thanh toán"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  shopping_bag
                </span>
                <h2 className="text-lg font-bold">KIỂM TRA SẢN PHẨM</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full table-fixed text-left">
                  <colgroup>
                    <col style={{ width: "55%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "15%" }} />
                  </colgroup>
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider">
                        Sản Phẩm
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider !text-center whitespace-nowrap align-middle">
                        Số Lượng
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider text-right whitespace-nowrap">
                        Đơn Giá
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500 tracking-wider text-right whitespace-nowrap">
                        Thành Tiền
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
                            ? "Đang tạo hóa đơn..."
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
                      cartItems.map((item, index) => (
                        <tr key={item.id || index}>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="size-16 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                                <span className="material-symbols-outlined text-gray-400">
                                  inventory_2
                                </span>
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-slate-100">
                                  {item.productName ||
                                    productNameById[String(item.productId)] ||
                                    "Chưa có tên sản phẩm"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 !text-center whitespace-nowrap align-middle text-slate-600 dark:text-slate-400">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-5 text-right whitespace-nowrap font-medium text-slate-600 dark:text-slate-400">
                            {formatVND(item.price)}
                          </td>
                          <td className="px-6 py-5 text-right whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
                            {formatVND(
                              item.total || item.price * item.quantity,
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="mt-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  location_on
                </span>
                <h2 className="text-lg font-bold text-primary">THÔNG TIN NHẬN HÀNG</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">
                      NGƯỜI NHẬN
                    </p>
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
                      <p className="text-base text-slate-900 dark:text-slate-100">
                        {invoice?.customerName ||
                          customerMeDetails?.name ||
                          (user as any)?.name ||
                          (user as any)?.username ||
                          (isLoadingCustomerMeDetails ? "Đang tải..." : "Chưa có thông tin")}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">
                      SỐ ĐIỆN THOẠI
                    </p>
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
                      <p className="text-base text-slate-900 dark:text-slate-100">
                        {invoice?.customerPhone ||
                          customerMeDetails?.phone ||
                          (user as any)?.phone ||
                          (user as any)?.phoneNumber ||
                          (isLoadingCustomerMeDetails ? "Đang tải..." : "Chưa có thông tin")}
                      </p>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">
                      ĐỊA CHỈ NHẬN HÀNG
                    </p>
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
                      <p className="text-base text-slate-900 dark:text-slate-100">
                        {invoice?.shippingAddress ||
                          invoice?.deliveryAddress ||
                          customerMeDetails?.address ||
                          (user as any)?.address ||
                          (isLoadingCustomerMeDetails ? "Đang tải..." : "Chưa có thông tin")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Loyalty banner (disabled) */}
            {/*
            <div className="mt-8 p-6 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-primary/20 p-3 rounded-full text-primary">
                  <span className="material-symbols-outlined">
                    military_tech
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    Ưu Đãi Hội Viên
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Bạn đang ở hạng {loyaltyTierName || "Hội viên"}. Dùng điểm thưởng để tiết kiệm ngay.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {loyaltyPoints.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-primary uppercase">
                  Điểm Khả Dụng
                </span>
              </div>
            </div>
            */}
          </div>

          {/* ── Right column – Order Summary ── */}
          <aside className="w-full lg:w-[400px] lg:sticky lg:top-10">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-bold">TÓM TẮT ĐƠN HÀNG</h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Coupon Code */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Mã Giảm Giá
                  </label>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={appliedCoupon || ""}
                        readOnly
                        onClick={() => {
                          setCouponSearch("");
                          setIsCouponModalOpen(true);
                        }}
                        onFocus={(e) => {
                          // Prevent mobile keyboard (this field is display-only)
                          e.currentTarget.blur();
                          setCouponSearch("");
                          setIsCouponModalOpen(true);
                        }}
                        placeholder="Chọn mã giảm giá"
                        className="w-full cursor-pointer rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCouponSearch("");
                        setIsCouponModalOpen(true);
                      }}
                      disabled={!invoiceId}
                      className="px-4 py-2 bg-[#0df259] text-slate-900 text-sm font-bold rounded-lg hover:shadow-[0_0_20px_rgba(13,242,89,0.3)] transition-all whitespace-nowrap border-0 disabled:cursor-not-allowed disabled:bg-[#0df259]/60 disabled:text-slate-900/70"
                    >
                      Chọn mã
                    </button>
                  </div>

                  {appliedCoupon && (
                    <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                      <span className="material-symbols-outlined text-sm">verified</span>
                      <span>{appliedCoupon} đã áp dụng!</span>
                    </div>
                  )}
                </div>

                {/* Coupon Modal */}
                {isCouponModalOpen && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
                    <button
                      type="button"
                      aria-label="Đóng"
                      className="absolute inset-0 bg-black/40"
                      onClick={() => setIsCouponModalOpen(false)}
                    />

                    <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
                      <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                            Chọn hoặc nhập Voucher
                          </h3>
                          <p className="mt-1 text-xs text-slate-500">
                            Vui lòng chỉ chọn 01 voucher
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsCouponModalOpen(false)}
                          className="text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors border-0 bg-transparent"
                          title="Đóng"
                        >
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>

                      <div className="p-4 max-h-[70vh] overflow-y-auto space-y-5">
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            Tìm voucher
                          </div>
                          <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                              search
                            </span>
                            <input
                              type="text"
                              value={couponSearch}
                              onChange={(e) => setCouponSearch(e.target.value)}
                              placeholder="Nhập tên/mã coupon (vd: SALE20)"
                              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                            />
                          </div>
                        </div>

                        {isApplyingCoupon && (
                          <div className="text-xs text-slate-500">Đang áp dụng voucher...</div>
                        )}

                        {isLoadingCoupons ? (
                          <div className="py-6 text-sm text-slate-500">
                            Đang tải mã giảm giá...
                          </div>
                        ) : availableCoupons.length === 0 ? (
                          <div className="py-6 text-sm text-slate-500">
                            Không có voucher cho tài khoản này.
                          </div>
                        ) : (
                          <>
                            <div>
                              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                Voucher khả dụng
                              </div>
                              <div className="mt-2 space-y-2">
                                {eligibleCoupons.length === 0 ? (
                                  <div className="text-sm text-slate-500">
                                    Không có voucher khả dụng.
                                  </div>
                                ) : (
                                  eligibleCoupons.map((coupon) => {
                                    const code = String(coupon.code || "");
                                    const selected = appliedCoupon === code;
                                    return (
                                      <button
                                        key={code}
                                        type="button"
                                        disabled={isApplyingCoupon}
                                        onClick={() => handleChooseCoupon(code)}
                                        className="w-full flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                                      >
                                        <div className="min-w-0">
                                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                            {code}
                                          </div>
                                          <div className="mt-0.5 text-xs text-slate-500">
                                            {getCouponDescription(coupon)}
                                          </div>
                                        </div>

                                        <div className="shrink-0 flex flex-col items-end gap-2">
                                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                            -{getCouponDiscountLabel(coupon)}
                                          </span>
                                          <span
                                            className={`material-symbols-outlined text-xl leading-none ${selected ? "text-primary" : "text-slate-300 dark:text-slate-600"}`}
                                          >
                                            {selected
                                              ? "radio_button_checked"
                                              : "radio_button_unchecked"}
                                          </span>
                                        </div>
                                      </button>
                                    );
                                  })
                                )}
                              </div>
                            </div>

                            {ineligibleCoupons.length > 0 && (
                              <div>
                                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                  Voucher không khả dụng
                                </div>
                                <div className="mt-2 space-y-2">
                                  {ineligibleCoupons.map((coupon) => {
                                    const code = String(coupon.code || "");
                                    const selected = appliedCoupon === code;
                                    return (
                                      <button
                                        key={code}
                                        type="button"
                                        disabled
                                        className="w-full flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 opacity-70 cursor-not-allowed text-left"
                                        title="Chưa đủ điều kiện để dùng voucher này"
                                      >
                                        <div className="min-w-0">
                                          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                            {code}
                                          </div>
                                          <div className="mt-0.5 text-xs text-slate-500">
                                            {getCouponDescription(coupon)}
                                          </div>
                                          <div className="mt-1 text-[11px] font-semibold text-amber-600">
                                            Chưa đủ điều kiện áp dụng
                                          </div>
                                        </div>

                                        <div className="shrink-0 flex flex-col items-end gap-2">
                                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                            -{getCouponDiscountLabel(coupon)}
                                          </span>
                                          <span
                                            className={`material-symbols-outlined text-xl leading-none ${selected ? "text-primary" : "text-slate-300 dark:text-slate-600"}`}
                                          >
                                            {selected
                                              ? "radio_button_checked"
                                              : "radio_button_unchecked"}
                                          </span>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Loyalty Points (disabled) */}
                {/*
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-xl">
                        stars
                      </span>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        Đổi Điểm Thưởng
                      </span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300">
                      500 điểm = 125.000
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min={0}
                      max={loyaltyPoints}
                      step={50}
                      value={loyaltyPointsToUse}
                      onChange={(e) =>
                        setLoyaltyPointsToUse(Number(e.target.value))
                      }
                      className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-500 uppercase">
                      <span>0 điểm</span>
                      <span>Dùng {loyaltyPointsToUse} điểm</span>
                      <span>{loyaltyPoints.toLocaleString()} điểm</span>
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={usePoints}
                        onChange={(e) => handleTogglePoints(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">
                      Dùng {formatVND(loyaltyPointsToUse * vndPerPoint)} giảm từ
                      điểm thưởng
                    </span>
                  </label>
                </div>
                */}

                <hr className="border-slate-100 dark:border-slate-800" />

                {/* Calculations */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>Tạm tính</span>
                    <span>{formatVND(subtotal)}</span>
                  </div>
                  {appliedCoupon && couponDiscount > 0 && (
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>Giảm giá (Mã {appliedCoupon})</span>
                      <span className="text-red-500 font-medium">
                        -{formatVND(couponDiscount)}
                      </span>
                    </div>
                  )}
                  {usePoints && (
                    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                      <span>Giảm từ điểm thưởng</span>
                      <span className="text-red-500 font-medium">
                        -{formatVND(loyaltyDiscount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>Thuế ước tính</span>
                    <span>{formatVND(estimatedTax)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>Vận chuyển</span>
                    <span className="text-primary font-bold uppercase text-[10px]">
                      Miễn phí
                    </span>
                  </div>
                  <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">
                        Tổng Thanh Toán
                      </p>
                      <p className="text-3xl font-black text-slate-900 dark:text-white">
                        {formatVND(totalAmount)}
                      </p>
                    </div>
                    {couponDiscount + loyaltyDiscount > 0 && (
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-primary uppercase">
                          Bạn tiết kiệm được{" "}
                          {formatVND(couponDiscount + loyaltyDiscount)}!
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col gap-3">
                    {/* Thanh toán tiền mặt (tạm ẩn theo yêu cầu) */}
                    <button
                      onClick={handlePlaceOrder}
                      disabled={isOrdering}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-[#0df259] text-slate-900 font-black rounded-xl hover:shadow-[0_0_20px_rgba(13,242,89,0.3)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed border-0"
                    >
                      {isOrdering ? (
                        <>
                          <svg
                            className="w-5 h-5 animate-spin"
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
                          <span>Đang xử lý...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined">
                            account_balance
                          </span>
                          Thanh toán chuyển khoản
                        </>
                      )}
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
                    Khi đặt hàng, bạn đồng ý với{" "}
                    <a className="underline" href="#">
                      Điều khoản dịch vụ
                    </a>{" "}
                    và{" "}
                    <a className="underline" href="#">
                      Chính sách bảo mật
                    </a>{" "}
                    của chúng tôi. Thanh toán được mã hoá SSL 256-bit.
                  </p>
                </div>
              </div>
            </div>

            {/* Trust badges */}
            <div className="mt-4 flex items-center justify-center gap-6 px-4">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="material-symbols-outlined text-lg">
                  verified_user
                </span>
                <span className="text-[10px] font-bold uppercase">
                  Thanh Toán Bảo Mật
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="material-symbols-outlined text-lg">
                  local_shipping
                </span>
                <span className="text-[10px] font-bold uppercase">
                  Giao Hàng Nhanh
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="material-symbols-outlined text-lg">
                  assignment_return
                </span>
                <span className="text-[10px] font-bold uppercase">
                  Đổi Trả Dễ Dàng
                </span>
              </div>
            </div>
          </aside>
        </div>

        {/* Floating back button (bottom-left) */}
        <button
          type="button"
          onClick={() => navigate("/customer")}
          className="fixed bottom-6 left-4 sm:left-8 inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-md backdrop-blur hover:bg-slate-50 dark:hover:bg-slate-800/70 transition z-20"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Quay về trang chủ
        </button>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-10 py-6 mt-auto">
        <div className="mx-auto max-w-screen-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-slate-500 text-xs">
          <div className="flex items-center gap-4">
            <span>© 2024 ShopEase Inc. Bảo lưu mọi quyền.</span>
            <a className="hover:text-primary" href="#">
              Hỗ trợ
            </a>
            <a className="hover:text-primary" href="#">
              Theo dõi đơn hàng
            </a>
          </div>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">shield</span>
              An toàn &amp; Bảo mật
            </span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">
                language
              </span>
              Tiếng Việt
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Checkout;
