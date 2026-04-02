import type { OrderRecord } from "../../services/orderService";

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'Preparing': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    'Pending': 'bg-blue-100 text-blue-800 border border-blue-300',
    'Shipping': 'bg-purple-100 text-purple-800 border border-purple-300',
    'Delivered': 'bg-green-100 text-green-800 border border-green-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

type OrderTableProps = {
  orders: OrderRecord[];
  selectedOrderId?: string;
  isLoading: boolean;
  onSelectOrder: (order: OrderRecord) => void;
};

export default function OrderTable({ orders, selectedOrderId, isLoading, onSelectOrder }: OrderTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 p-8 text-center text-gray-500">
        No orders found
      </div>
    );
  }

  const getOrderId = (order: OrderRecord) => order?.code || order?.orderNumber || order?.id || '';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-gray-200">
          <tr>
            <th className="p-4 text-left text-sm font-semibold text-gray-700">Order ID</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-700">Customer</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-700">Payment</th>
            <th className="p-4 text-left text-sm font-semibold text-gray-700">Status</th>
            <th className="p-4 text-center text-sm font-semibold text-gray-700">Action</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {orders.map((order) => {
            const orderId = getOrderId(order);
            const isSelected = orderId === selectedOrderId;
            return (
              <tr
                key={orderId}
                className={`hover:bg-gray-50 transition-colors duration-150 cursor-pointer ${isSelected ? 'bg-orange-50' : ''}`}
                onClick={() => onSelectOrder(order)}
              >
                <td className="p-4 text-sm font-medium text-gray-900">{orderId}</td>
                <td className="p-4 text-sm text-gray-600">
                  {order.customer?.name || order.recipientName || '—'}
                </td>
                <td className="p-4 text-sm">
                  <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium border border-indigo-300">
                    {order.paymentMethod || order.paymentType || 'COD'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status || 'Pending')}`}>
                    {order.status || 'Pending'}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <button
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-3 py-1 rounded transition-colors text-sm font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectOrder(order);
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
