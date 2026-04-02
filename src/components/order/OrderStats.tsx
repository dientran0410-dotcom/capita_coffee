import type { OrderStatsPayload } from "../../services/orderService";

type OrderStatsProps = {
  stats: OrderStatsPayload;
  loading: boolean;
};

export default function OrderStats({ stats, loading }: OrderStatsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 bg-gray-100 rounded-lg shadow-md animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-10 bg-gray-300 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">

      <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-md border border-orange-200 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-600 text-xs font-semibold uppercase tracking-wide">Total COD Today</p>
            <h2 className="text-3xl font-bold text-orange-900 mt-2">{stats.totalOrders}</h2>
          </div>
          <div className="text-4xl">📦</div>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg shadow-md border border-yellow-200 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-yellow-600 text-xs font-semibold uppercase tracking-wide">Preparing</p>
            <h2 className="text-3xl font-bold text-yellow-900 mt-2">{stats.preparing}</h2>
          </div>
          <div className="text-4xl">⏳</div>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md border border-green-200 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-600 text-xs font-semibold uppercase tracking-wide">Delivered</p>
            <h2 className="text-3xl font-bold text-green-900 mt-2">{stats.delivered}</h2>
          </div>
          <div className="text-4xl">✅</div>
        </div>
      </div>

    </div>
  );
}