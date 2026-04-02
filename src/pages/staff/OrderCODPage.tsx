import OrderStats from '@/components/order/OrderStats';
import OrderTable from '@/components/order/OrderTable';
import OrderDetailPanel from '@/components/order/OrderDetailPanel';

export default function OrderCODPage() {
  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">

      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Staff COD Orders
        </h1>
        <p className="text-gray-600 mt-1">Staff view to monitor placed COD orders and statuses</p>
      </div>

      <OrderStats />

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <OrderTable />
        </div>

        <OrderDetailPanel />
      </div>

    </div>
  );
}