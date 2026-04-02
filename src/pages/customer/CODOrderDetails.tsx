// const CODOrderDetails = () => {
//     return (
//         <div>
//             <h1>COD Order Details</h1>
//             {/* Add your component content here */}
//         </div>
//     );
// };
// export default CODOrderDetails;

import { useEffect, useMemo, useState } from "react";
import OrderStats from "../../components/order/OrderStats";
import OrderTable from "../../components/order/OrderTable";
import OrderDetailPanel from "../../components/order/OrderDetailPanel";
import { getOrderStats, getOrdersCOD } from "../../services/orderService";
import type { OrderRecord, OrderStatsPayload } from "../../services/orderService";

const getOrderIdentifier = (order: OrderRecord) =>
  order?.code || order?.orderNumber || order?.id;

export default function OrderCODPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [stats, setStats] = useState<OrderStatsPayload>({
    totalOrders: 0,
    preparing: 0,
    delivered: 0,
  });
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingStats(true);
    getOrderStats()
      .then((payload) => {
        setStats(payload);
      })
      .catch(() => {
        setError("Không thể tải thống kê đơn hàng");
      })
      .finally(() => {
        setLoadingStats(false);
      });
  }, []);

  useEffect(() => {
    setLoadingOrders(true);
    getOrdersCOD({ limit: 20 })
      .then(({ orders }) => {
        setOrders(orders);
        if (orders.length) {
          const firstOrderId = getOrderIdentifier(orders[0]);
          setSelectedOrderId((prev) => prev || firstOrderId || null);
        }
      })
      .catch(() => {
        setError("Không thể tải dữ liệu đơn hàng");
      })
      .finally(() => {
        setLoadingOrders(false);
      });
  }, []);

  const selectedOrder = useMemo(
    () => orders.find((order) => getOrderIdentifier(order) === selectedOrderId),
    [orders, selectedOrderId]
  );

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Staff COD Orders</h1>
        <p className="text-gray-600 mt-1">Staff view to monitor placed COD orders and statuses</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <OrderStats stats={stats} loading={loadingStats} />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <OrderTable
            orders={orders}
            selectedOrderId={selectedOrderId ?? undefined}
            isLoading={loadingOrders}
            onSelectOrder={(order) => setSelectedOrderId(getOrderIdentifier(order) || null)}
          />
        </div>

        <OrderDetailPanel order={selectedOrder ?? undefined} />
      </div>
    </div>
  );
}
