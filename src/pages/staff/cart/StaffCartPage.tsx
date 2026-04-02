import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../../context/AuthContext";
import CartService from "../../../services/CartService";
import invoiceService from "../../../services/InvoiceService";
import MomoService from "../../../services/MomoService";
import CustomerModal from "../../../components/staff/CustomerModal";
import type { CartResponse } from "../../../types/Cart";
import { extractUserId } from "../../../utils/authHelpers";

export default function StaffCartPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [cartData, setCartData] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isPayingCash, setIsPayingCash] = useState(false);
  const [isPayingMomo, setIsPayingMomo] = useState(false);
  
  // Customer selection modal states
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id?: string;
    name: string;
    phone: string;
  } | null>(null);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<"cash" | "momo" | null>(null);

  const userId = extractUserId(user);

  // Load cart from API
  const loadCart = async (
    forceRefresh: boolean = false,
    showLoading: boolean = true,
  ) => {
    if (!isAuthenticated || !userId) {
      setCartData(null);
      return;
    }

    try {
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);
      const cart = await CartService.getCart(userId, forceRefresh);
      setCartData(cart);
    } catch (err) {
      console.error("❌ Error loading cart:", err);
      setError("Không thể tải giỏ hàng. Vui lòng thử lại.");
      setCartData(null);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  const handleRemoveItem = async (cartItemId: number) => {
    if (!userId) return;

    try {
      await CartService.removeCartItem(cartItemId);
      await loadCart(true, false);
      toast.success("Đã xóa sản phẩm", {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (err) {
      console.error("Error removing item:", err);
      setError("Không thể xóa sản phẩm. Vui lòng thử lại.");
    }
  };

  const handleUpdateQuantity = async (cartItemId: number, newQuantity: number) => {
    if (!userId || newQuantity <= 0) return;

    try {
      await CartService.updateCartItem({
        cartItemId,
        quantity: newQuantity,
      });
      await loadCart(true, false);
    } catch (err) {
      console.error("Error updating quantity:", err);
      setError("Không thể cập nhật số lượng. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    loadCart(!!userId);
  }, [isAuthenticated, userId]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadCart(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [userId, isAuthenticated]);

  const cartItems = cartData?.items || [];

  const formatVnd = (value: number) =>
    `${Number(value ?? 0).toLocaleString("vi-VN")}đ`;

  const subtotal = useMemo(() => Number(cartData?.subtotal ?? 0) || 0, [cartData?.subtotal]);
  const total = useMemo(() => subtotal, [subtotal]);

  // When customer modal is closed after selection, process the payment
  const processCashPayment = async (customer: { id?: string; name: string; phone: string }) => {
    if (!isAuthenticated || !userId) {
      toast.error("Vui lòng đăng nhập để thanh toán", { autoClose: 2500 });
      return;
    }

    if (!cartItems.length) return;

    setIsPayingCash(true);
    try {
      // Invoice API still needs a customerId; fallback to staff only for invoice creation.
      const invoiceCustomerId = customer.id || userId;
      const invoice = await invoiceService.createInvoice({ customerId: invoiceCustomerId });
      const invoiceId = String((invoice as any)?.id ?? "").trim();
      if (!invoiceId) {
        throw new Error("Không tạo được hóa đơn (invoiceId rỗng)");
      }

      await invoiceService.checkout({ invoiceId });

      navigate("/staff/payment-success", {
        state: {
          invoiceId,
          orderNumber: (invoice as any)?.code || invoiceId,
          total: Number((invoice as any)?.totalAmount ?? total) || 0,
          orderedAt:
            (invoice as any)?.paidAt ||
            (invoice as any)?.updatedAt ||
            (invoice as any)?.createdAt ||
            new Date().toISOString(),
          paymentMethod: "Cash",
          customerId: customer.id,
          customerPhone: customer.phone,
        },
      });
    } catch (err) {
      console.error("[StaffCartPage] Cash payment error:", err);
      toast.error("❌ Không thể thanh toán tiền mặt. Vui lòng thử lại.", {
        autoClose: 4000,
      });
      setIsPayingCash(false);
    }
  };

  const processMomoPayment = async (customer: { id?: string; name: string; phone: string }) => {
    if (!isAuthenticated || !userId) {
      toast.error("Vui lòng đăng nhập để thanh toán", { autoClose: 2500 });
      return;
    }

    if (!cartItems.length) return;

    setIsPayingMomo(true);
    try {
      // Invoice API still needs a customerId; fallback to staff only for invoice creation.
      const invoiceCustomerId = customer.id || userId;
      const invoice = await invoiceService.createInvoice({ customerId: invoiceCustomerId });
      const invoiceId = String((invoice as any)?.id ?? "").trim();
      if (!invoiceId) {
        throw new Error("Không tạo được hóa đơn (invoiceId rỗng)");
      }

      await invoiceService.checkout({ invoiceId });

      const amount = Number((invoice as any)?.totalAmount ?? 0);
      if (!amount || Number.isNaN(amount) || amount <= 0) {
        throw new Error(`Invalid amount for MoMo payment: ${amount}`);
      }

      // Mark this MoMo flow as STAFF so PaymentReturn can route to PaymentSuccessStaff.
      sessionStorage.setItem("payment_success_role", "staff");
      sessionStorage.setItem("pending_invoice_id", invoiceId);
      sessionStorage.setItem("pending_customer_phone", customer.phone);
      if (customer.id) {
        sessionStorage.setItem("pending_customer_id", customer.id);
      } else {
        sessionStorage.removeItem("pending_customer_id");
      }

      const momo = await MomoService.createMomoPayment({
        orderId: invoiceId,
        amount,
      });

      const payUrl = (momo as any)?.payUrl;
      if (payUrl) {
        window.location.href = payUrl;
        return;
      }

      throw new Error("MoMo did not return payUrl");
    } catch (err) {
      console.error("[StaffCartPage] MoMo payment error:", err);
      toast.error("❌ Không thể tạo thanh toán MoMo. Vui lòng thử lại.", {
        autoClose: 4000,
      });
      setIsPayingMomo(false);
    }
  };

  const handleCashPayment = async () => {
    if (!cartItems.length) return;
    setShowCustomerModal(true);
    setPendingPaymentMethod("cash");
  };

  const handleMomoPayment = async () => {
    if (!cartItems.length) return;
    setShowCustomerModal(true);
    setPendingPaymentMethod("momo");
  };

  const handleCustomerSelected = async (customer: { id?: string; name: string; phone: string }) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);

    // Process payment after a short delay
    setTimeout(async () => {
      if (pendingPaymentMethod === "cash") {
        await processCashPayment(customer);
      } else if (pendingPaymentMethod === "momo") {
        await processMomoPayment(customer);
      }
      setPendingPaymentMethod(null);
    }, 100);
  };

  const handleCustomerModalSkip = () => {
    setShowCustomerModal(false);
    setPendingPaymentMethod(null);
  };

  if (!isAuthenticated) {
    return (
      <section className="min-h-screen w-full px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <header className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">
              Staff cart
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng</h1>
            <p className="text-sm text-gray-500">
              Vui lòng đăng nhập để xem giỏ hàng.
            </p>
          </header>
          <div className="rounded-2xl border border-gray-300 bg-white/70 p-8 text-center">
            <button
              onClick={() => navigate("/login")}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              Đăng nhập
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen w-full bg-zinc-50 px-4 py-10 sm:px-6 lg:px-8">
      {/* Customer Selection Modal */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSelectCustomer={handleCustomerSelected}
        onSkip={handleCustomerModalSkip}
      />

      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl bg-white border border-zinc-100 shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-zinc-100">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-extrabold tracking-tight">Active Order</h1>
              <span className="text-xs font-bold text-zinc-500 bg-gray-100 px-2 py-1 rounded">
                #{cartData?.cartId ? `CART-${cartData.cartId}` : "—"}
              </span>
            </div>
            <p className="text-sm text-zinc-500">Quản lý đơn và thanh toán.</p>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
                <button
                  onClick={() => loadCart()}
                  className="ml-2 underline hover:no-underline"
                >
                  Thử lại
                </button>
              </div>
            )}
          </div>

          <div className="p-6 space-y-4 max-h-[55vh] overflow-y-auto">
            {isLoading ? (
              <div className="text-sm text-zinc-500">Đang tải giỏ hàng...</div>
            ) : cartItems.length === 0 ? (
              <div className="text-sm text-zinc-500">
                Chưa có sản phẩm trong đơn.
                <div className="mt-4">
                  <button
                    onClick={() => navigate("/staff")}
                    className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 transition"
                  >
                    Chọn sản phẩm
                  </button>
                </div>
              </div>
            ) : (
              cartItems.map((item) => (
                <div className="flex gap-4" key={item.cartItemId}>
                  <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {(item as any)?.productImage ? (
                      <img
                        className="w-full h-full object-cover"
                        src={(item as any).productImage}
                        alt={item.productName}
                      />
                    ) : (
                      <span className="material-symbols-outlined text-3xl text-emerald-300">
                        coffee
                      </span>
                    )}
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between mb-1 gap-2">
                      <h4 className="font-bold text-sm truncate">
                        {item.productName}
                      </h4>
                      <span className="font-bold text-sm">
                        {formatVnd(Number(item.totalPrice ?? 0))}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500 mb-2 italic">
                      {formatVnd(Number(item.productPrice ?? 0))} / item
                    </p>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 bg-gray-100 px-2 py-1 rounded-full">
                        <button
                          className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-xs shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          type="button"
                          disabled={(item.quantity ?? 1) <= 1}
                          onClick={() =>
                            handleUpdateQuantity(
                              item.cartItemId,
                              Math.max(1, (item.quantity ?? 1) - 1),
                            )
                          }
                        >
                          -
                        </button>
                        <span className="text-xs font-bold">{item.quantity}</span>
                        <button
                          className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs shadow-sm"
                          type="button"
                          onClick={() =>
                            handleUpdateQuantity(item.cartItemId, (item.quantity ?? 1) + 1)
                          }
                        >
                          +
                        </button>
                      </div>

                      <button
                        className="text-red-600"
                        type="button"
                        onClick={() => handleRemoveItem(item.cartItemId)}
                        title="Xóa"
                      >
                        <span className="material-symbols-outlined text-lg">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-zinc-50 border-t border-zinc-100">
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm text-zinc-500">
                <span>Subtotal</span>
                <span className="font-bold">{formatVnd(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xl font-extrabold text-gray-900 pt-2 border-t border-zinc-200">
                <span>Total</span>
                <span className="text-emerald-700">{formatVnd(total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-white border border-zinc-200 hover:border-emerald-500 hover:text-emerald-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
                onClick={handleCashPayment}
                disabled={!cartItems.length || isPayingCash || isPayingMomo}
              >
                <span className="material-symbols-outlined text-xl">payments</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {isPayingCash ? "Đang xử lý" : "Tiền mặt"}
                </span>
              </button>

              <button
                className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-white border border-zinc-200 hover:border-emerald-500 hover:text-emerald-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                type="button"
                onClick={handleMomoPayment}
                disabled={!cartItems.length || isPayingCash || isPayingMomo}
              >
                <span className="material-symbols-outlined text-xl">qr_code_2</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {isPayingMomo ? "Đang xử lý" : "MoMo"}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate("/staff")}
              className="mt-4 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition"
            >
              Tiếp tục chọn món
            </button>
          </div>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 9999 }}
      />
    </section>
  );
}
