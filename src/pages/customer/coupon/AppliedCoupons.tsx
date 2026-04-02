import { useEffect, useState } from "react";
import { MoreVertical, X, QrCode, Clock } from "lucide-react";
import couponService from "../../../services/couponService";
import type { ApplyCouponResponse, CouponQrResponse } from "../../../types/coupon";
import { extractUserIdFromToken } from "../../../utils/authHelpers";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const formatDateTime = (dateValue?: string | null) => {
  if (!dateValue) return '—';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN');
};

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

const AppliedCoupons = () => {
  const [appliedCoupons, setAppliedCoupons] = useState<ApplyCouponResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<ApplyCouponResponse | null>(null);
  const [qrData, setQrData] = useState<CouponQrResponse | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadAppliedCoupons = async () => {
      setLoading(true);
      setError(null);
      try {
        // Lấy customerId từ JWT token
        const customerId = getCurrentUserId();
        if (!customerId) {
          throw new Error('Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.');
        }

        const data = await couponService.getMyAppliedCoupons(customerId);
        if (!cancelled) {
          setAppliedCoupons(Array.isArray(data) ? data : []);
        }
      } catch (err: any) {
        if (!cancelled) {
          const msg =
            err?.response?.data?.message ||
            err?.message ||
            "Không thể tải danh sách coupon đã áp dụng.";
          setError(msg);
          setAppliedCoupons([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAppliedCoupons();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleViewDetail = async (coupon: ApplyCouponResponse) => {
    setSelectedCoupon(coupon);
    setQrData(null);
    setQrError(null);

    // Chỉ tạo mã QR nếu status là PENDING
    if (coupon.status.toUpperCase() !== 'PENDING') {
      setLoadingQr(false);
      return;
    }

    setLoadingQr(true);

    try {
      const qr = await couponService.generateQrForCoupon(coupon.code, coupon.couponId);
      setQrData(qr);
      setQrExpiresAt(qr.expiresAt);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Không thể tạo QR code.";
      setQrError(msg);
    } finally {
      setLoadingQr(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedCoupon(null);
    setQrData(null);
    setQrError(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">Chờ sử dụng</span>;
      case 'USED':
        return <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Đã dùng</span>;
      case 'EXPIRED':
        return <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Hết hạn</span>;
      default:
        return <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-2">
      <div className="mb-8 rounded-2xl border border-slate-100 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Coupon Đã Áp Dụng
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Xem danh sách các coupon bạn đã áp dụng và mã QR để sử dụng tại quầy.
        </p>
      </div>

      {loading && (
        <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">
          Đang tải danh sách coupon...
        </div>
      )}

      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && appliedCoupons.length === 0 && (
        <div className="rounded-xl bg-white p-6 text-sm text-slate-500 shadow-sm">
          Bạn chưa áp dụng coupon nào.
        </div>
      )}

      {!loading && !error && appliedCoupons.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {appliedCoupons.map((coupon) => (
            <article
              key={coupon.id}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-blue-100/60" />

              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  {getStatusBadge(coupon.status)}
                  <button
                    type="button"
                    onClick={() => handleViewDetail(coupon)}
                    className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    title="Xem chi tiết"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>

                <h3 className="mt-4 text-xl font-extrabold tracking-wide text-slate-900">
                  {coupon.code}
                </h3>

                <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                  <p>
                    Ngày áp dụng:{" "}
                    <span className="font-semibold">
                      {formatDateTime(coupon.appliedAt)}
                    </span>
                  </p>
                  <p>
                    Ngày hết hạn:{" "}
                    <span className="font-semibold">
                      {formatDateTime(coupon.expiredAt)}
                    </span>
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal chi tiết coupon với QR code */}
      {selectedCoupon && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleCloseModal}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleCloseModal}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-slate-900">Chi Tiết Coupon</h2>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mã Coupon</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">{selectedCoupon.code}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng Thái</p>
                <div className="mt-1">
                  {getStatusBadge(selectedCoupon.status)}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ngày Áp Dụng</p>
                <p className="mt-1 text-sm text-slate-700">{formatDateTime(selectedCoupon.appliedAt)}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ngày Hết Hạn</p>
                <p className="mt-1 text-sm text-slate-700">{formatDateTime(selectedCoupon.expiredAt)}</p>
              </div>

              {selectedCoupon.status.toUpperCase() === 'PENDING' && (
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center gap-2 text-slate-700">
                    <QrCode size={18} />
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mã QR (Có hiệu lực 15 phút)</p>
                  </div>

                  {loadingQr && (
                    <div className="mt-3 text-center text-sm text-slate-500">
                      Đang tạo mã QR...
                    </div>
                  )}

                  {qrError && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {qrError}
                    </div>
                  )}

                  {qrData && (
                    <div className="mt-3">
                      <div className="flex justify-center rounded-lg bg-slate-50 p-4">
                        <img src={qrData.qrCode} alt="QR Code" className="h-48 w-48" />
                      </div>
                      {qrExpiresAt && (
                        <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-slate-500">
                          <Clock size={14} />
                          <span>Hết hạn lúc: {formatDateTime(qrExpiresAt)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {selectedCoupon.status.toUpperCase() === 'USED' && (
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
                    <p className="text-center text-sm text-slate-500">
                      Coupon này đã được sử dụng
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppliedCoupons;
