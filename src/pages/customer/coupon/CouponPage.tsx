import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Copy, TicketCheck, TicketPercent, Users } from "lucide-react";
import couponService from "../../../services/couponService";
import type { CouponResponse } from "../../../types/coupon";
import { DiscountType } from "../../../types/coupon";
import { extractUserIdFromToken } from "../../../utils/authHelpers";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const getCurrentUserId = (): string | null => {
  try {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    const tokenUserId = extractUserIdFromToken(token);
    if (tokenUserId) return tokenUserId;

    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser) as Record<string, unknown>;
      const userId = parsed.id ?? parsed.userId;
      if (typeof userId === 'string' && userId.trim()) {
        return userId.trim();
      }
      if (typeof userId === 'number' && Number.isFinite(userId)) {
        return String(userId);
      }
    }

    return null;
  } catch {
    return null;
  }
};

const CouponPage = () => {
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [applyingCode, setApplyingCode] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCoupons = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await couponService.getActiveCouponsForCustomer();
        if (!cancelled) {
          const publicCoupons = (Array.isArray(data) ? data : []).filter(
            (coupon) => coupon.isPublic,
          );
          setCoupons(publicCoupons);
        }
      } catch (err: any) {
        if (!cancelled) {
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            "Không thể tải coupon công khai.";
          setError(msg);
          setCoupons([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCoupons();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalUsage = useMemo(
    () => coupons.reduce((sum, coupon) => sum + (coupon.usedCount ?? 0), 0),
    [coupons],
  );

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 1200);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = code;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 1200);
    }
  };

  const handleApplyCoupon = async (code: string) => {
    setApplyingCode(code);
    setApplySuccess(null);
    try {
      // Lấy customerId từ token/localStorage
      const customerId = getCurrentUserId();
      if (!customerId) {
        alert('Vui lòng đăng nhập để áp dụng coupon.');
        return;
      }

      const result = await couponService.applyCoupon({
        customerId,
        couponCode: code
      });

      if (result.status.toUpperCase() === 'PENDING') {
        setApplySuccess(code);
        window.setTimeout(() => setApplySuccess(null), 3000);
      } else {
        alert(`Áp dụng thành công với trạng thái: ${result.status}`);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Không thể áp dụng coupon.";
      alert(msg);
    } finally {
      setApplyingCode(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-2">
      <div className="mb-8 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Coupon Công Khai</h1>
        <p className="mt-2 text-sm text-slate-500">
          Xem và sao chép các mã giảm giá public đang hoạt động dành cho khách
          hàng.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <TicketPercent size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Public Coupons
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-800">
              {coupons.length}
            </p>
          </div>

          <div className="rounded-xl bg-sky-50 p-4">
            <div className="flex items-center gap-2 text-sky-700">
              <Users size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Tổng lượt dùng
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-sky-800">{totalUsage}</p>
          </div>

          <div className="rounded-xl bg-amber-50 p-4">
            <div className="flex items-center gap-2 text-amber-700">
              <CalendarDays size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Trạng thái
              </span>
            </div>
            <p className="mt-2 text-lg font-bold text-amber-800">
              Đang hoạt động
            </p>
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">
          Đang tải coupon...
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && coupons.length === 0 && (
        <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">
          Hiện chưa có coupon public nào khả dụng.
        </div>
      )}

      {!loading && !error && coupons.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {coupons.map((coupon) => {
            const discountLabel = coupon.discountType === DiscountType.PERCENT
              ? `${coupon.discountValue}%`
              : coupon.discountType === DiscountType.POINT_DISCOUNT
              ? `${coupon.discountValue} điểm`
              : formatCurrency(coupon.discountValue);

            return (
              <article
                key={coupon.id}
                className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-emerald-100/60" />

                <div className="relative">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Public
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      Đã dùng {coupon.usedCount}/{coupon.usageLimit}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-extrabold tracking-wide text-slate-900">
                    {coupon.code}
                  </h3>

                  <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                    <p>
                      Giảm:{" "}
                      <span className="font-semibold text-emerald-700">
                        {discountLabel}
                      </span>
                    </p>
                    <p>
                      Đơn tối thiểu:{" "}
                      <span className="font-semibold">
                        {formatCurrency(coupon.minOrderValue)}
                      </span>
                    </p>
                    <p>
                      Giảm tối đa:{" "}
                      <span className="font-semibold">
                        {coupon.maxDiscount
                          ? formatCurrency(coupon.maxDiscount)
                          : "Không giới hạn"}
                      </span>
                    </p>
                    <p>
                      Giới hạn/user:{" "}
                      <span className="font-semibold">{coupon.userLimit}</span>
                    </p>
                    <p>
                      Hạng tối thiểu:{" "}
                      <span className="font-semibold">
                        {coupon.minTier?.name ?? "Mọi hạng"}
                      </span>
                    </p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyCode(coupon.code)}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <Copy size={14} />
                      {copiedCode === coupon.code ? "Đã copy" : "Copy mã"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyCoupon(coupon.code)}
                      disabled={applyingCode === coupon.code}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <TicketCheck size={14} />
                      {applyingCode === coupon.code
                        ? "Đang áp dụng..."
                        : applySuccess === coupon.code
                        ? "Đã áp dụng"
                        : "Áp dụng"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CouponPage;
