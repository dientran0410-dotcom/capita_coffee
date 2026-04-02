import type { Reward } from '../types/reward';
import './RewardCard.css';

interface RewardCardProps {
  reward: Reward;
  onRedeem: (reward: Reward) => void;
}

// ✅ dùng env
const BASE_IMAGE_URL = import.meta.env.VITE_API_GATEWAY + "/api/engagement-service/uploads/rewards/";

const RewardCard = ({ reward, onRedeem }: RewardCardProps) => {

  // ================= IMAGE =================
  const getImageSrc = (imageUrl: string) => {
    if (!imageUrl) return "/placeholder.png";

    // full URL
    if (imageUrl.startsWith("http") || imageUrl.startsWith("/")) {
      return imageUrl;
    }

    // file từ BE
    return BASE_IMAGE_URL + imageUrl;
  };

  // ================= STATE =================
  const isDisabled = !reward.active;

  return (
    <article className={`bg-white rounded-2xl border border-gray-200 overflow-hidden card-hover transition-all duration-300 ${isDisabled ? 'opacity-60' : ''}`} data-purpose="reward-card">
      {/* IMAGE */}
      <img 
        alt={reward.name} 
        className="w-full h-48 object-cover" 
        src={getImageSrc(reward.imageUrl)} 
      />
      
      {/* CONTENT */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-900 leading-tight">
            {reward.name}
          </h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {reward.requiredPoints.toLocaleString()} pts
          </span>
        </div>
        
        <p className="text-sm text-gray-500 mb-6">
          {reward.description}
        </p>
        
        <button 
          className="w-full py-2.5 px-4 bg-[#00875A] hover:bg-[#00704A] text-white font-semibold rounded-xl transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          onClick={() => onRedeem(reward)}
          disabled={isDisabled}
        >
          {isDisabled ? 'Unavailable' : 'Redeem Offer'}
        </button>
      </div>
    </article>
  );
};

export default RewardCard;