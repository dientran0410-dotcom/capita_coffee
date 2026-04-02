import type { OrderRecord } from "../../services/orderService";

type OrderDetailPanelProps = {
  order?: OrderRecord;
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'Preparing': 'bg-yellow-100 text-yellow-800 border border-yellow-300',
    'Pending': 'bg-blue-100 text-blue-800 border border-blue-300',
    'Shipping': 'bg-purple-100 text-purple-800 border border-purple-300',
    'Delivered': 'bg-green-100 text-green-800 border border-green-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export default function OrderDetailPanel({ order }: OrderDetailPanelProps) {
  if (!order) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden p-8 text-center text-gray-500">
        <p className="text-lg font-medium mb-2">No Order Selected</p>
        <p className="text-sm">Select an order from the table to view details</p>
      </div>
    );
  }

  const orderId = order.code || order.orderNumber || order.id || '—';
  const customerName = order.customer?.name || order.recipientName || '—';
  const status = order.status || 'Pending';
  const paymentMethod = order.paymentMethod || order.paymentType || 'COD';
  const amount = order.codAmount || order.totalAmount || 0;
  const items = order.orderItems || order.items || [];

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
        <h3 className="font-bold text-white text-lg">Selected Order</h3>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <div className="border-b pb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Order ID</p>
          <p className="text-lg font-bold text-gray-900">{orderId}</p>
        </div>

        <div className="border-b pb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Customer</p>
          <p className="text-base font-medium text-gray-700">{customerName}</p>
          {order.customer?.phone && (
            <p className="text-sm text-gray-500 mt-1">{order.customer.phone}</p>
          )}
        </div>

        <div className="border-b pb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Status</p>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>

        <div className="border-b pb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Payment Method</p>
          <p className="text-base font-medium text-gray-700">{paymentMethod}</p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Amount</p>
          <p className="text-2xl font-bold text-orange-600">₫{amount.toLocaleString()}</p>
        </div>

        {items.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">Items</p>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.name || `Item ${index + 1}`} {item.quantity ? `x${item.quantity}` : ''}
                  </span>
                  {item.price && (
                    <span className="font-medium text-gray-900">₫{item.price.toLocaleString()}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 space-y-3">
        <button className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors shadow-sm">
          Mark Prepared
        </button>
        <button className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-semibold transition-colors">
          Assign Delivery
        </button>
      </div>
    </div>
  );
}
