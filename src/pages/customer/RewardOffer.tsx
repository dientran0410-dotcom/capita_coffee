import { useEffect, useState } from "react";
import RewardCard from "../../components/RewardCard";
import { getActiveRewards } from "../../services/rewardService";
import { confirmRedeem } from "../../services/redemptionService";
import pointsBalanceService from "../../services/PointsBalanceService";
import loyaltyService from "../../services/loyaltyService";
import type { Reward } from "../../types/reward";
import type { CustomerRedemptionResponse } from "../../types/redemption";

const RewardOffer = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemingRewardId, setRedeemingRewardId] = useState<string | null>(null);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [redeemResult, setRedeemResult] = useState<CustomerRedemptionResponse | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number>(0);

  const BASE_IMAGE_URL = "/api/engagement-service/uploads/rewards/";

  // ================= FETCH API =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch rewards
        const data = await getActiveRewards();
        setRewards(data);

        // Fetch current balance
        const userStr =
          localStorage.getItem("user") ||
          sessionStorage.getItem("user") ||
          localStorage.getItem("auth_user") ||
          sessionStorage.getItem("auth_user");

        if (userStr) {
          const user = JSON.parse(userStr);
          const customerId = String(
            user?.id || user?.userId || user?.customerId || user?.raw?.id || user?.raw?.userId || ""
          ).trim();
          const franchiseId = String(
            user?.franchiseId || user?.raw?.franchiseId || localStorage.getItem("franchiseId") || ""
          ).trim();

          if (customerId && franchiseId) {
            const engagement = await loyaltyService
              .getCustomerEngagement(customerId, franchiseId)
              .catch(() => null);

            if (engagement) {
              setCurrentBalance(Number(engagement.currentPoints ?? 0));
            } else {
              // Fallback for environments still using points/balance endpoint.
              const balanceData = await pointsBalanceService.getPointsBalance(
                customerId,
                franchiseId
              );
              setCurrentBalance(Number(balanceData.currentPoints || 0));
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRewardImageSrc = (imageUrl: string) => {
    if (!imageUrl) return "/placeholder.png";
    if (imageUrl.startsWith("http") || imageUrl.startsWith("/")) return imageUrl;
    return BASE_IMAGE_URL + imageUrl;
  };

  const getQrSrc = (qrImage: string | null) => {
    if (!qrImage) return "";
    if (qrImage.startsWith("data:image")) return qrImage;
    return `data:image/png;base64,${qrImage}`;
  };

  // ================= HANDLE =================
  const handleRedeem = async (reward: Reward) => {
    try {
      setRedeemingRewardId(reward.id);
      const response = await confirmRedeem(String(reward.id));
      setSelectedReward(reward);
      setRedeemResult(response);
    } catch (error: any) {
      // Tạo thông báo chi tiết khi không đủ điểm
      let message = error?.message || "Không đủ điểm để đổi thưởng";
      
      if (error?.message?.toLowerCase().includes("not enough points")) {
        const pointsNeeded = reward.requiredPoints - currentBalance;
        message = `Điểm của bạn không đủ để đổi thưởng này.\nBạn có: ${currentBalance.toLocaleString()} điểm\nCần: ${reward.requiredPoints.toLocaleString()} điểm\nThiếu: ${pointsNeeded.toLocaleString()} điểm`;
      }
      
      alert(message);
    } finally {
      setRedeemingRewardId(null);
    }
  };

  const closeRedeemModal = () => {
    setSelectedReward(null);
    setRedeemResult(null);
  };

  // ================= UI =================
  return (
    <div className="bg-gray-50 text-gray-800 min-h-screen p-8">
      {/* BEGIN: Header with Points Card */}
      <div className="flex justify-between items-start gap-6 mb-8">
        {/* Header Section */}
        <div className="flex-1">
          <header data-purpose="page-header">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Reward Offers</h2>
              <p className="text-gray-600">Redeem your hard-earned points for delicious treats and exclusive discounts.</p>
            </div>
          </header>
        </div>

        {/* Current Points Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 min-w-max">
          <div className="text-center">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Current Points</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">{currentBalance.toLocaleString()}</p>
            <p className="text-xs text-gray-500">pts</p>
          </div>
        </div>
      </div>
      {/* END: Header with Points Card */}

      {/* LOADING */}
      {loading && (
        <div className="text-center text-gray-500">Loading rewards...</div>
      )}

      {/* EMPTY */}
      {!loading && rewards.length === 0 && (
        <div className="text-center text-gray-500">
          No rewards available.
        </div>
      )}

      {/* BEGIN: Rewards Grid */}
      {!loading && rewards.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-purpose="rewards-grid">
          {rewards.map((reward) => (
            <div key={reward.id} className="relative">
              <RewardCard
                reward={reward}
                onRedeem={handleRedeem}
              />

              {redeemingRewardId === reward.id && (
                <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center text-sm font-semibold text-gray-700">
                  Processing redemption...
                </div>
              )}
            </div>
          ))}
        </section>
      )}
      {/* END: Rewards Grid */}

      {selectedReward && redeemResult && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={closeRedeemModal}>
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900">Redeem Successful</h3>
            <p className="text-sm text-gray-600 mt-1">
              Show this QR code to claim your reward.
            </p>

            <div className="mt-4 rounded-xl border border-gray-200 p-4">
              <img
                src={getRewardImageSrc(selectedReward.imageUrl)}
                alt={selectedReward.name}
                className="w-full h-40 object-cover rounded-lg"
              />

              <div className="mt-3">
                <h4 className="font-semibold text-gray-900">{selectedReward.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{selectedReward.description}</p>
                <p className="text-sm text-gray-700 mt-2">
                  Points used: <span className="font-semibold">{redeemResult.pointsUsed.toLocaleString()}</span>
                </p>
                <p className="text-sm text-gray-700">
                  Redemption code: <span className="font-semibold">{redeemResult.redemptionCode}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-gray-300 p-4">
              {redeemResult.qrImage ? (
                <img
                  src={getQrSrc(redeemResult.qrImage)}
                  alt="Redemption QR"
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <p className="text-sm text-gray-500">QR code is not available.</p>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-lg bg-[#00875A] hover:bg-[#00704A] text-white font-semibold"
                onClick={closeRedeemModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardOffer;