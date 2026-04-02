import { useState } from 'react';
import { Package, Truck, CheckCircle2, Clock, MapPin, Phone } from 'lucide-react';
const activeOrders = [
    {
        id: 'OD-24061',
        store: 'Capital Coffee - Quận 1',
        storeAddress: '123 Nguyễn Huệ, P. Bến Nghé, Q.1, TP.HCM',
        phone: '028 3822 1234',
        status: 'preparing',
        estimatedMinutes: 12,
        items: ['Cà Phê Sữa Đá (L)', 'Bánh Croissant x1'],
        total: '89,000đ',
    },
];
const steps = [
    { key: 'ordered', label: 'Đã đặt hàng', icon: Clock },
    { key: 'preparing', label: 'Đang pha chế', icon: Package },
    { key: 'shipping', label: 'Đang giao', icon: Truck },
    { key: 'delivered', label: 'Đã nhận', icon: CheckCircle2 },
];
const stepIndex = {
    ordered: 0, preparing: 1, shipping: 2, delivered: 3,
};
export default function TrackDelivery() {
    const [trackInput, setTrackInput] = useState('');
    return (<div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Theo dõi đơn hàng</h1>
        <p className="text-gray-600 mt-1">Kiểm tra trạng thái giao hàng theo thời gian thực.</p>
      </div>

      {/* Manual track */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 max-w-xl">
        <p className="text-sm font-semibold text-gray-700 mb-3">Tra cứu theo mã đơn</p>
        <div className="flex gap-2">
          <input type="text" value={trackInput} onChange={(e) => setTrackInput(e.target.value)} placeholder="VD: OD-24061" className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"/>
          <button className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-4 py-2 transition-colors">
            Tra cứu
          </button>
        </div>
      </div>

      {/* Active orders */}
      <h2 className="text-base font-semibold text-gray-700 mb-3">Đơn đang hoạt động</h2>
      <div className="space-y-4">
        {activeOrders.map((order) => {
            var _a;
            const current = (_a = stepIndex[order.status]) !== null && _a !== void 0 ? _a : 0;
            return (<div key={order.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-bold text-gray-900">{order.id}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{order.store}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-700">{order.total}</p>
                  <p className="text-xs text-gray-400 mt-0.5">≈ {order.estimatedMinutes} phút</p>
                </div>
              </div>

              {/* Progress stepper */}
              <div className="flex items-center mb-6">
                {steps.map((step, idx) => {
                    const Icon = step.icon;
                    const done = idx <= current;
                    const isLast = idx === steps.length - 1;
                    return (<div key={step.key} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${done ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                          <Icon className="w-4 h-4"/>
                        </div>
                        <span className={`text-xs text-center leading-tight ${done ? 'text-amber-700 font-medium' : 'text-gray-400'}`}>
                          {step.label}
                        </span>
                      </div>
                      {!isLast && (<div className={`flex-1 h-1 mx-1 rounded-full mb-4 ${idx < current ? 'bg-amber-600' : 'bg-gray-100'}`}/>)}
                    </div>);
                })}
              </div>

              {/* Items */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1.5">Sản phẩm</p>
                {order.items.map((item) => (<p key={item} className="text-sm text-gray-700">{item}</p>))}
              </div>

              {/* Store info */}
              <div className="flex flex-col gap-1.5 text-sm text-gray-500">
                <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-amber-500 flex-shrink-0"/>{order.storeAddress}</span>
                <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-amber-500 flex-shrink-0"/>{order.phone}</span>
              </div>
            </div>);
        })}
      </div>
    </div>);
}
