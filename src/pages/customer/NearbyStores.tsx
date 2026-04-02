import { useState } from 'react';
import { MapPin, Clock, Search, Star, Phone, ChevronRight } from 'lucide-react';
const stores = [
    {
        id: 1,
        name: 'Capital Coffee - Quận 1',
        address: '123 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM',
        distance: '0.8 km',
        rating: 4.9,
        reviews: 512,
        hours: '06:30 – 22:00',
        open: true,
        phone: '028 3822 1234',
        tags: ['Không gian đẹp', 'WiFi miễn phí', 'Chỗ đậu xe'],
    },
    {
        id: 2,
        name: 'Capital Coffee - Quận 3',
        address: '45 Võ Văn Tần, P.6, Quận 3, TP.HCM',
        distance: '1.4 km',
        rating: 4.7,
        reviews: 348,
        hours: '07:00 – 22:00',
        open: true,
        phone: '028 3930 5678',
        tags: ['Ngoài trời', 'Chỗ đậu xe'],
    },
    {
        id: 3,
        name: 'Capital Coffee - Bình Thạnh',
        address: '220 Đinh Bộ Lĩnh, P.26, Bình Thạnh, TP.HCM',
        distance: '2.1 km',
        rating: 4.8,
        reviews: 290,
        hours: '06:00 – 21:30',
        open: true,
        phone: '028 3514 0091',
        tags: ['WiFi miễn phí', 'Yên tĩnh'],
    },
    {
        id: 4,
        name: 'Capital Coffee - Thủ Đức',
        address: '15 Kha Vạn Cân, P. Linh Chiểu, TP. Thủ Đức',
        distance: '5.3 km',
        rating: 4.6,
        reviews: 178,
        hours: '07:00 – 21:00',
        open: false,
        phone: '028 3897 2233',
        tags: ['Lớn', 'Chỗ đậu xe', 'Gần ĐH'],
    },
    {
        id: 5,
        name: 'Capital Coffee - Quận 7',
        address: '88 Nguyễn Thị Thập, P. Tân Phú, Quận 7, TP.HCM',
        distance: '4.7 km',
        rating: 4.8,
        reviews: 421,
        hours: '06:30 – 22:30',
        open: true,
        phone: '028 5413 7766',
        tags: ['Cao cấp', 'WiFi miễn phí', 'Chỗ đậu xe'],
    },
];
export default function NearbyStoresPage() {
    const [search, setSearch] = useState('');
    const filtered = stores.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.address.toLowerCase().includes(search.toLowerCase()));
    return (<div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cửa hàng gần bạn</h1>
        <p className="text-gray-600 mt-1">Tìm cửa hàng Capital Coffee gần nhất.</p>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên hoặc địa chỉ..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"/>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((store) => (<div key={store.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900">{store.name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5"/>{store.distance}</span>
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400"/>{store.rating} ({store.reviews})</span>
                </div>
              </div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${store.open ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {store.open ? 'Đang mở' : 'Đã đóng'}
              </span>
            </div>

            <p className="text-sm text-gray-500 flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5"/>{store.address}
            </p>

            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-500"/>{store.hours}</span>
              <span className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-amber-500"/>{store.phone}</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {store.tags.map((tag) => (<span key={tag} className="rounded-full bg-amber-50 text-amber-700 text-xs px-2.5 py-0.5 font-medium">{tag}</span>))}
            </div>

            <button className="mt-auto w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold py-2.5 transition-colors">
              Đặt hàng tại đây <ChevronRight className="w-4 h-4"/>
            </button>
          </div>))}

        {filtered.length === 0 && (<div className="col-span-full text-center py-16 text-gray-400">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30"/>
            <p>Không tìm thấy cửa hàng phù hợp.</p>
          </div>)}
      </div>
    </div>);
}
