import { Star, Gift, Crown, Zap, ChevronRight, CheckCircle2 } from 'lucide-react';
const tiers = [
    {
        key: 'bronze',
        name: 'Bronze',
        icon: <Star className="w-6 h-6"/>,
        color: 'from-amber-700 to-amber-600',
        textColor: 'text-amber-800',
        bgColor: 'bg-amber-50 border-amber-200',
        minPoints: 0,
        maxPoints: 999,
        perks: ['Tích 1 điểm / 1,000đ', 'Ưu đãi sinh nhật 10%', 'Truy cập ứng dụng'],
    },
    {
        key: 'silver',
        name: 'Silver',
        icon: <Zap className="w-6 h-6"/>,
        color: 'from-gray-500 to-gray-400',
        textColor: 'text-gray-700',
        bgColor: 'bg-gray-50 border-gray-200',
        minPoints: 1000,
        maxPoints: 2999,
        perks: ['Tích 1.5 điểm / 1,000đ', 'Ưu đãi sinh nhật 20%', 'Đổi điểm lấy đồ uống', 'Ưu tiên đặt hàng'],
    },
    {
        key: 'gold',
        name: 'Gold',
        icon: <Crown className="w-6 h-6"/>,
        color: 'from-yellow-500 to-amber-400',
        textColor: 'text-yellow-800',
        bgColor: 'bg-yellow-50 border-yellow-200',
        minPoints: 3000,
        maxPoints: 7999,
        perks: ['Tích 2 điểm / 1,000đ', 'Ưu đãi sinh nhật 30%', 'Free size upgrade 2x/tháng', 'Ưu tiên hỗ trợ', 'Thức uống miễn phí khi đạt hạng'],
    },
    {
        key: 'diamond',
        name: 'Diamond',
        icon: <Gift className="w-6 h-6"/>,
        color: 'from-sky-600 to-blue-500',
        textColor: 'text-blue-900',
        bgColor: 'bg-blue-50 border-blue-200',
        minPoints: 8000,
        maxPoints: Infinity,
        perks: ['Tích 3 điểm / 1,000đ', 'Ưu đãi sinh nhật 40%', 'Free size upgrade không giới hạn', 'Giao hàng miễn phí mọi lúc', 'Sản phẩm mới trải nghiệm sớm', 'Concierge riêng'],
    },
];
const currentPoints = 2430;
const currentTierKey = 'silver';
function ProgressBar({ current, max }) {
    const pct = Math.min(100, Math.round((current / max) * 100));
    return (<div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-amber-600 rounded-full transition-all" style={{ width: `${pct}%` }}/>
    </div>);
}
export default function MemberShip() {
    var _a;
    const currentTier = (_a = tiers.find((t) => t.key === currentTierKey)) !== null && _a !== void 0 ? _a : tiers[0];
    const nextTier = tiers[tiers.indexOf(currentTier) + 1];
    const pointsToNext = nextTier ? nextTier.minPoints - currentPoints : 0;
    return (<div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Thành viên</h1>
        <p className="text-gray-600 mt-1">Xem cấp độ thành viên và quyền lợi của bạn.</p>
      </div>

      {/* Current status card */}
      <div className={`bg-gradient-to-r ${currentTier.color} rounded-2xl p-6 text-white mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              {currentTier.icon}
            </div>
            <div>
              <p className="text-white/80 text-sm">Hạng hiện tại</p>
              <p className="text-2xl font-bold">{currentTier.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm">Điểm tích lũy</p>
            <p className="text-3xl font-bold">{currentPoints.toLocaleString()}</p>
          </div>
        </div>

        {nextTier && (<>
            <div className="flex justify-between text-sm text-white/80 mb-1">
              <span>{currentTier.name}</span>
              <span>{nextTier.name} – còn {pointsToNext.toLocaleString()} điểm</span>
            </div>
            <ProgressBar current={currentPoints - currentTier.minPoints} max={nextTier.minPoints - currentTier.minPoints}/>
          </>)}
      </div>

      {/* Tier breakdown */}
      <h2 className="text-base font-semibold text-gray-700 mb-4">Các cấp độ thành viên</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiers.map((tier) => {
            const isCurrent = tier.key === currentTierKey;
            return (<div key={tier.key} className={`rounded-xl border-2 p-5 ${isCurrent ? 'border-amber-500 ring-2 ring-amber-200' : tier.bgColor}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${tier.color} flex items-center justify-center text-white`}>
                  {tier.icon}
                </div>
                <div>
                  <p className={`font-bold ${tier.textColor}`}>{tier.name}</p>
                  <p className="text-xs text-gray-400">
                    {tier.maxPoints === Infinity ? `≥ ${tier.minPoints.toLocaleString()} điểm` : `${tier.minPoints.toLocaleString()} – ${tier.maxPoints.toLocaleString()} điểm`}
                  </p>
                </div>
                {isCurrent && <span className="ml-auto text-xs bg-amber-600 text-white px-2 py-0.5 rounded-full font-medium">Bạn</span>}
              </div>
              <ul className="space-y-1.5">
                {tier.perks.map((perk) => (<li key={perk} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5"/>
                    {perk}
                  </li>))}
              </ul>
              {!isCurrent && tier.minPoints > currentPoints && (<button className="mt-4 w-full flex items-center justify-center gap-1 text-amber-600 hover:text-amber-700 text-sm font-semibold transition-colors">
                  Cách bạn {(tier.minPoints - currentPoints).toLocaleString()} điểm <ChevronRight className="w-4 h-4"/>
                </button>)}
            </div>);
        })}
      </div>
    </div>);
}
