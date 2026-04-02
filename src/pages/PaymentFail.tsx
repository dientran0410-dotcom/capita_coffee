import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { appendPaymentResult } from "../utils/paymentHistory";

const PaymentFailed = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navState = (location.state || {}) as {
    invoiceId?: string;
    orderNumber?: string;
    total?: number;
    orderedAt?: string;
    paymentMethod?: string;
  };

  useEffect(() => {
    appendPaymentResult({
      status: 'FAILED',
      invoiceId: navState.invoiceId,
      orderNumber: navState.orderNumber,
      total: navState.total,
      orderedAt: navState.orderedAt,
      paymentMethod: navState.paymentMethod || 'MoMo',
    });
  }, [navState.invoiceId, navState.orderNumber, navState.total, navState.orderedAt, navState.paymentMethod]);

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

  const orderNumber = navState.orderNumber || navState.invoiceId || "-";
  const totalAmount = Number(navState.total ?? 0);
  const formatVND = (n: number) =>
    (Number.isFinite(n) ? n : 0).toLocaleString("vi-VN");

  const failureReasons = [
    {
      icon: "account_balance_wallet",
      title: "Số dư không đủ",
      desc: "Tài khoản của bạn không đủ số dư để thực hiện giao dịch này.",
    },
    {
      icon: "event_busy",
      title: "Thẻ hết hạn hoặc bị khóa",
      desc: "Thẻ thanh toán của bạn có thể đã hết hạn hoặc bị ngân hàng khóa tạm thời.",
    },
    {
      icon: "sync_problem",
      title: "Lỗi kết nối mạng",
      desc: "Quá trình thanh toán bị gián đoạn do sự cố kết nối đường truyền.",
    },
  ];

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
                className="absolute inline-block w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 animate-ping-slow"
                aria-hidden="true"
              />
              <span
                className="material-symbols-outlined text-red-500 text-7xl relative z-10"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                cancel
              </span>
            </div>

            <h1 className="text-2xl font-bold mb-2">Thanh toán thất bại</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Rất tiếc, giao dịch của bạn không thể hoàn tất. Vui lòng kiểm tra
              thông tin và thử lại.
            </p>

            {/* Order summary */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 mb-6 text-left border border-slate-100 dark:border-slate-700/50">
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-sm text-slate-500 dark:text-slate-400">Mã đơn hàng</span>
                <span className="text-sm font-bold">{orderNumber}</span>
              </div>
              <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                <span className="text-sm text-slate-500 dark:text-slate-400">Số tiền</span>
                <span className="text-sm font-bold text-red-500">
                  {formatVND(totalAmount)} VND
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">Trạng thái</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full">
                  <span
                    className="material-symbols-outlined text-xs"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    error
                  </span>
                  Thất bại
                </span>
              </div>
            </div>

            {/* Failure reasons */}
            <div className="text-left mb-6">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">
                Nguyên nhân có thể xảy ra
              </p>
              <ul className="space-y-3">
                {failureReasons.map((reason) => (
                  <li key={reason.icon} className="flex items-start gap-3">
                    <span
                      className="material-symbols-outlined text-red-400 text-xl mt-0.5 flex-shrink-0"
                      style={{ fontVariationSettings: "'FILL' 0" }}
                    >
                      {reason.icon}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{reason.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {reason.desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <button
                onClick={() => navigate(continueShoppingPath)}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white text-sm font-semibold py-3 px-5 rounded-xl hover:bg-primary/90 transition-colors"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                Quay về trang chủ
              </button>
              <button
                onClick={() => navigate("/")}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold py-3 px-5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="material-symbols-outlined text-base">support_agent</span>
                Liên hệ hỗ trợ
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

export default PaymentFailed;

 