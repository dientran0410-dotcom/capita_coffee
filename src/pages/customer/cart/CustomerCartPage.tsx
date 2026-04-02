import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../../../context/AuthContext";
import CartService from "../../../services/CartService";
import type { CartResponse } from "../../../types/Cart";
import { extractUserId } from "../../../utils/authHelpers";

export default function CustomerCartPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [cartData, setCartData] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = extractUserId(user);

  // Load cart from API
  const loadCart = async (forceRefresh: boolean = false, showLoading: boolean = true) => {
    console.log('📦 loadCart called - isAuthenticated:', isAuthenticated, 'userId:', userId, 'forceRefresh:', forceRefresh);

    if (!isAuthenticated || !userId) {
      console.warn('⚠️ Not authenticated or no userId', { isAuthenticated, userId });
      setCartData(null);
      return;
    }

    try {
      // Only show loading indicator on initial load, not on refresh after actions
      if (showLoading) {
        setIsLoading(true);
      }
      setError(null);
      console.log('🔄 Calling CartService.getCart with userId:', userId);
      const cart = await CartService.getCart(userId, forceRefresh);
      console.log('✅ Cart loaded successfully:', cart);
      console.log("📦 Cart items:", cart.items);
      console.log("💰 Subtotal:", cart.subtotal);
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

  // Remove item from cart
  const handleRemoveItem = async (cartItemId: number) => {
    if (!userId) return;

    try {
      await CartService.removeCartItem(cartItemId);
      // Reload cart without showing loading indicator to prevent UI flash
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

  // Update item quantity
  const handleUpdateQuantity = async (
    cartItemId: number,
    newQuantity: number,
  ) => {
    if (!userId || newQuantity <= 0) return;

    try {
      await CartService.updateCartItem({
        cartItemId,
        quantity: newQuantity,
      });
      // Reload cart without showing loading indicator to prevent UI flash
      await loadCart(true, false);
    } catch (err) {
      console.error("Error updating quantity:", err);
      setError("Không thể cập nhật số lượng. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    console.log('🔍 useEffect triggered - isAuthenticated:', isAuthenticated, 'userId:', userId);
    // Force refresh on userId/auth change to bypass stale cache
    loadCart(!!userId);
  }, [isAuthenticated, userId]);

  // Force reload cart when page comes into focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Page came into focus - reloading cart with force refresh');
        loadCart(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId, isAuthenticated]);

  const handleCheckout = () => {
    if (!cartData || cartData.items.length === 0) return;

    // Navigate to checkout with cart data
    navigate("/customer/checkout", {
      state: {
        checkoutMode: "cart",
        cartData,
        fromApi: true,
        fromCart: true,
      },
    });
  };

  // Show login required message if not authenticated
  if (!isAuthenticated) {
    return (
      <section className="min-h-screen w-full px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <header className="flex flex-col gap-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-600">
              Customer cart
            </p>
            <h1 className="text-3xl font-bold text-gray-900">
              Giỏ hàng khách hàng
            </h1>
            <p className="text-sm text-gray-500">
              Vui lòng đăng nhập để xem giỏ hàng của bạn.
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

  const cartItems = cartData?.items || [];
  const total = cartData?.subtotal || 0;

  // Debug rendering
  console.log('🔍 Rendering cart page - cartData:', cartData, 'isLoading:', isLoading, 'error:', error);

  return (
    <section className="min-h-screen w-full px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col gap-2">
          {/* <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
            Customer cart
          </p> */}
          <h1 className="text-3xl font-bold text-gray-900">Giỏ hàng của bạn</h1>
          <p className="text-sm text-gray-500">
            Quản lý các sản phẩm trong giỏ hàng và tiến hành thanh toán.
          </p>
        </header>

        {/* Loading state */}
        {isLoading && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-8 text-center text-sm text-gray-500">
            Đang tải giỏ hàng...
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-600">
            {error}
            <button
              onClick={() => loadCart()}
              className="ml-4 underline hover:no-underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty cart */}
        {!isLoading && !error && cartItems.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-8 text-center text-sm text-gray-500">
            <p className="mb-4">Giỏ hàng của bạn đang trống.</p>
            <button
              onClick={() => navigate("/customer")}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
            >
              Khám phá sản phẩm
            </button>
          </div>
        )}

        {/* Cart items */}
        {!isLoading && !error && cartItems.length > 0 && (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.cartItemId}
                className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm"
              >
                <div className="flex-grow">
                  <p className="font-semibold text-gray-900">
                    {item.productName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {item.productPrice.toLocaleString("vi-VN")}đ / sản phẩm
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateQuantity(item.cartItemId, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1}
                      className="text-lg font-bold text-gray-500 disabled:opacity-50"
                    >
                      –
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateQuantity(item.cartItemId, item.quantity + 1)
                      }
                      className="text-lg font-bold text-gray-500"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-sm font-semibold text-gray-900 min-w-[80px] text-right">
                    {item.totalPrice.toLocaleString("vi-VN")}đ
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.cartItemId)}
                    className="text-xs font-semibold text-red-500 hover:text-red-600 min-w-[30px]"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}

            {/* Total */}
            <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-gray-900">
              <span>Tổng cộng · {cartItems.length} sản phẩm</span>
              <span className="text-lg">{total.toLocaleString("vi-VN")}đ</span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCheckout}
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                Thanh toán
              </button>
              <button
                onClick={() => navigate("/customer")}
                className="rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          </div>
        )}
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
