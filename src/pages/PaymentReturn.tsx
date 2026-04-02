import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MOMO_RETURN_URL } from "../constants/apiEndPoints";
import { apiUtils } from "../api/axios";

type BackendPaymentResponse = {
    invoiceId?: string | null;
    status?: "SUCCESS" | "FAILED" | "PENDING" | null;
    message?: string | null;
};

const PaymentReturn = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const searchParams = useMemo(
        () => new URLSearchParams(location.search || ""),
        [location.search],
    );

    useEffect(() => {
        let cancelled = false;

        const routeToResult = (success: boolean, extra?: Record<string, unknown>) => {
            navigate(success ? "/payment-success" : "/payment-fail", {
                replace: true,
                state: {
                    ...(extra || {}),
                },
            });
        };

        (async () => {
            const resultCode = searchParams.get("resultCode");
            const momoOrderId = searchParams.get("orderId") || undefined;
            const amountRaw = searchParams.get("amount");
            const amount = amountRaw ? Number(amountRaw) : undefined;

            // MoMo often returns responseTime (epoch ms) on redirect
            const responseTimeRaw = searchParams.get("responseTime");
            const orderedAt = (() => {
                if (!responseTimeRaw) return undefined;
                const trimmed = String(responseTimeRaw).trim();
                if (!trimmed) return undefined;
                if (!/^\d+$/.test(trimmed)) return undefined;
                const n = Number(trimmed);
                if (!Number.isFinite(n) || n <= 0) return undefined;

                // Heuristic: 10 digits => seconds, otherwise ms
                const ms = trimmed.length <= 10 ? n * 1000 : n;
                const d = new Date(ms);
                return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
            })();

            // MoMo redirect always hits one redirectUrl; decide success/fail based on resultCode.
            // 0 = success; anything else (including user cancel/back on sandbox) => fail.
            let isSuccess = resultCode === "0";
            let invoiceId: string | undefined;

            try {
                const qs = location.search || "";
                if (qs) {
                    const data = await apiUtils.get<any>(`${MOMO_RETURN_URL}${qs}`);
                    const payload = (data?.data ?? data) as BackendPaymentResponse;
                    invoiceId = payload?.invoiceId ?? undefined;
                    if (payload?.status === "SUCCESS") isSuccess = true;
                    if (payload?.status === "FAILED") isSuccess = false;
                }
            } catch (e: any) {
                // Backend might be unreachable in local/sandbox; fall back to query params.
                if (import.meta.env.DEV) {
                    console.warn(
                        "[PaymentReturn] Failed to call backend return endpoint",
                        e,
                    );
                }
            }

            if (cancelled) return;

            if (resultCode == null) {
                setErrorMessage("Thiếu thông tin kết quả thanh toán từ MoMo.");
                routeToResult(false, {
                    orderNumber: momoOrderId,
                    total: amount,
                    invoiceId,
                    orderedAt,
                    paymentMethod: "MOMO",
                });
                return;
            }

            routeToResult(isSuccess, {
                orderNumber: momoOrderId,
                total: amount,
                invoiceId,
                orderedAt,
                paymentMethod: "MOMO",
            });
        })();

        return () => {
            cancelled = true;
        };
    }, [location.search, navigate, searchParams]);

    return (
        <div className="min-h-screen bg-background-light font-display flex items-center justify-center p-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-md w-full">
                <h1 className="text-lg font-bold text-gray-900 mb-2">Đang xử lý thanh toán...</h1>
                <p className="text-sm text-gray-500">
                    Vui lòng đợi trong giây lát, bạn sẽ được chuyển đến trang kết quả.
                </p>
                {errorMessage ? (
                    <p className="text-xs text-red-500 mt-4">{errorMessage}</p>
                ) : null}
            </div>
        </div>
    );
};

export default PaymentReturn;
