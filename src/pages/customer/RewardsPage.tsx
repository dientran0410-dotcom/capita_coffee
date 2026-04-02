import { useState } from 'react';
import { TicketPercent, Clock, Tag, ChevronRight, Copy, CheckCheck } from 'lucide-react';
const offers = [
    {
        id: 1,
        code: 'COFFEE20',
        title: 'Giảm 20% toàn bộ Cà phê',
        description: 'Áp dụng cho tất cả sản phẩm danh mục Cà phê. Không giới hạn giá trị đơn.',
        discount: '20%',
        expiry: '31/03/2026',
        category: 'Cà phê',
        hot: true,
    },
    {
        id: 2,
        code: 'FREESHIP',
        title: 'Miễn phí giao hàng',
        description: 'Miễn phí ship cho đơn hàng từ 69,000đ. Áp dụng toàn bộ cửa hàng.',
        discount: 'Miễn phí ship',
        expiry: '15/03/2026',
        category: 'Tất cả',
        hot: false,
    },
    {
        id: 3,
        code: 'TEA15',
        title: 'Giảm 15,000đ cho Trà',
        description: 'Giảm 15,000đ khi mua bất kỳ sản phẩm trà. Áp dụng tối đa 2 lần/ngày.',
        discount: '-15,000đ',
        expiry: '20/03/2026',
        category: 'Trà',
        hot: false,
    },
    {
        id: 4,
        code: 'BDAY30',
        title: 'Ưu đãi sinh nhật 30%',
        description: 'Dành riêng cho thành viên trong tháng sinh nhật. Giảm 30% toàn đơn.',
        discount: '30%',
        expiry: '31/03/2026',
        category: 'Thành viên',
        hot: true,
    },
    {
        id: 5,
        code: 'SMOOTH10',
        title: 'Giảm 10% Sinh tố',
        description: 'Áp dụng cho tất cả sinh tố. Không áp dụng kèm khuyến mãi khác.',
        discount: '10%',
        expiry: '10/04/2026',
        category: 'Sinh tố',
        hot: false,
    },
];
function OfferCard({ offer }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(offer.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (<div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-amber-600 to-amber-500 px-5 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TicketPercent className="w-5 h-5 text-white"/>
            <span className="text-white font-bold text-lg">{offer.discount}</span>
            {offer.hot && (<span className="bg-white/20 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                Hot
              </span>)}
          </div>
          <p className="text-amber-100 text-sm mt-0.5">{offer.category}</p>
        </div>
        <div className="text-right">
          <p className="text-white/80 text-xs mb-1">Mã giảm giá</p>
          <div className="flex items-center gap-1.5 bg-white/20 rounded-lg px-3 py-1.5">
            <span className="text-white font-mono font-bold text-sm tracking-widest">{offer.code}</span>
            <button onClick={handleCopy} className="text-white/80 hover:text-white transition-colors">
              {copied ? <CheckCheck className="w-3.5 h-3.5"/> : <Copy className="w-3.5 h-3.5"/>}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <p className="font-semibold text-gray-900 mb-1">{offer.title}</p>
        <p className="text-sm text-gray-500">{offer.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5"/>HSD: {offer.expiry}
          </span>
          <button className="flex items-center gap-1 text-amber-600 hover:text-amber-700 text-sm font-semibold transition-colors">
            Dùng ngay <ChevronRight className="w-4 h-4"/>
          </button>
        </div>
      </div>
    </div>);
}
export default function RewardsPage() {
    const [tab, setTab] = useState('offers');
    return (<div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Ưu đãi & Tích điểm</h1>
        <p className="text-gray-600 mt-1">Khuyến mãi và điểm thưởng dành cho bạn.</p>
      </div>

      {/* Points summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
            { label: 'Điểm hiện có', value: '2,430', sub: 'điểm tích lũy', color: 'bg-amber-600' },
            { label: 'Điểm sắp hết hạn', value: '350', sub: 'hết hạn 31/03', color: 'bg-rose-500' },
            { label: 'Điểm đã dùng', value: '1,200', sub: 'tổng đã đổi', color: 'bg-gray-400' },
        ].map((item) => (<div key={item.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}>
              <Tag className="w-5 h-5 text-white"/>
            </div>
            <div>
              <p className="text-xs text-gray-500">{item.label}</p>
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
              <p className="text-xs text-gray-400">{item.sub}</p>
            </div>
          </div>))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {['offers', 'points'].map((t) => (<button key={t} onClick={() => setTab(t)} className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${tab === t ? 'bg-amber-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-400'}`}>
            {t === 'offers' ? 'Mã giảm giá' : 'Đổi điểm'}
          </button>))}
      </div>

      {tab === 'offers' ? (<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {offers.map((o) => <OfferCard key={o.id} offer={o}/>)}
        </div>) : (<div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-30"/>
          <p className="font-medium">Tính năng đổi điểm sắp ra mắt.</p>
          <p className="text-sm mt-1">Hãy tích lũy điểm ngay hôm nay!</p>
        </div>)}
    </div>);
}
