import { useEffect, useState } from "react";
import { CalendarDays, Clock, MoreVertical, QrCode, TicketCheck, X } from "lucide-react";
import couponService from "../../../services/couponService";
import type { ApplyCouponResponse, CouponQrResponse } from "../../../types/coupon";
import { extractUserIdFromToken } from "../../../utils/authHelpers";

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

const AppliedCouponsPage = () => {
  const [appliedCoupons, setAppliedCoupons] = useState<ApplyCouponResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Detail modal
  const [selectedCoupon, setSelectedCoupon] = useState<ApplyCouponResponse | null>(null);
  const [qrData, setQrData] = useState<CouponQrResponse | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

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
            "Không thể tải coupon đã áp dụng.";
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

  const handleOpenDetail = async (coupon: ApplyCouponResponse) => {
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
      const qrResponse = await couponService.generateQrForCoupon(coupon.code, coupon.couponId);
      setQrData(qrResponse);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Không thể tạo mã QR.";
      setQrError(msg);
    } finally {
      setLoadingQr(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedCoupon(null);
    setQrData(null);
    setQrError(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">Chờ xác nhận</span>;
      case 'USED':
        return <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Đã sử dụng</span>;
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
          Xem danh sách các coupon bạn đã áp dụng và trạng thái của chúng.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <TicketCheck size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Tổng số coupon
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-emerald-800">
              {appliedCoupons.length}
            </p>
          </div>

          <div className="rounded-xl bg-yellow-50 p-4">
            <div className="flex items-center gap-2 text-yellow-700">
              <Clock size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Chờ xác nhận
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-yellow-800">
              {appliedCoupons.filter(c => c.status.toUpperCase() === 'PENDING').length}
            </p>
          </div>

          <div className="rounded-xl bg-sky-50 p-4">
            <div className="flex items-center gap-2 text-sky-700">
              <CalendarDays size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Đã sử dụng
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-sky-800">
              {appliedCoupons.filter(c => c.status.toUpperCase() === 'USED').length}
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
              <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-emerald-100/60" />

              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  {getStatusBadge(coupon.status)}
                  <button
                    type="button"
                    onClick={() => handleOpenDetail(coupon)}
                    className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    title="Xem chi tiết"
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>

                <h3 className="mt-4 text-xl font-extrabold tracking-wide text-slate-900">
                  {coupon.code}
                </h3>

                <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                  <p>
                    Coupon ID:{" "}
                    <span className="font-semibold">
                      #{coupon.couponId}
                    </span>
                  </p>
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

      {/* Detail Modal */}
      {selectedCoupon && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={handleCloseDetail}
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleCloseDetail}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-slate-900">Chi Tiết Coupon</h2>
            <p className="mt-1 text-sm text-slate-500">Thông tin và mã QR của coupon</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mã Coupon</label>
                <p className="mt-1 text-lg font-bold text-slate-900">{selectedCoupon.code}</p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</label>
                <div className="mt-1">{getStatusBadge(selectedCoupon.status)}</div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ngày áp dụng</label>
                <p className="mt-1 text-sm text-slate-700">{formatDateTime(selectedCoupon.appliedAt)}</p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ngày hết hạn</label>
                <p className="mt-1 text-sm text-slate-700">{formatDateTime(selectedCoupon.expiredAt)}</p>
              </div>

              {selectedCoupon.status.toUpperCase() === 'PENDING' && (
                <div className="border-t pt-4">
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <QrCode size={14} />
                    Mã QR (Có hiệu lực 15 phút)
                  </label>

                  <div className="mt-3 flex justify-center">
                    {loadingQr && (
                      <div className="flex h-48 w-48 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
                        <p className="text-sm text-slate-500">Đang tạo QR...</p>
                      </div>
                    )}

                    {qrError && !loadingQr && (
                      <div className="flex h-48 w-48 items-center justify-center rounded-lg border-2 border-dashed border-red-300 bg-red-50">
                        <p className="text-center text-xs text-red-600">{qrError}</p>
                      </div>
                    )}

                    {qrData && !loadingQr && (
                      <div className="space-y-2">
                        <img
                          src={qrData.qrCode}
                          alt="QR Code"
                          className="h-48 w-48 rounded-lg border-2 border-slate-200"
                        />
                        <p className="text-center text-xs text-slate-500">
                          Hết hạn: {formatDateTime(qrData.expiresAt)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedCoupon.status.toUpperCase() === 'USED' && (
                <div className="border-t pt-4">
                  <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
                    <p className="text-center text-sm text-slate-500">
                      Coupon này đã được sử dụng
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleCloseDetail}
                className="w-full rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppliedCouponsPage;
