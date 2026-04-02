import { useState, useEffect } from 'react';
import RewardCard from '../../../components/RewardCard';
import RedemptionConfirmModal from '../../../components/RedemptionConfirmModal';
import RedemptionSuccessModal from '../../../components/RedemptionSuccessModal';
import PointsBalanceModal from '../../../components/PointsBalanceModal';
import type { Reward, CustomerLoyalty, PointRange } from '../../../types/reward';
import { confirmRedeem } from '../../../services/redemptionService';
import { getActiveRewards } from '../../../services/rewardService';
import './RedeemPoints.css';

const mockCustomerLoyalty: CustomerLoyalty = {
  pointsAvailable: 24550,
  currentTier: 'Platinum Member',
  pointsToNextReward: 40,
};

const pointRanges: PointRange[] = [
  { label: 'Under 500 pts', min: 0, max: 500 },
  { label: '500 - 2,000 pts', min: 500, max: 2000 },
  { label: '2,000+ pts', min: 2000 },
];

const RedeemPoints = () => {
  const [selectedPointRange, setSelectedPointRange] = useState<PointRange | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('Recommended');

  // Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  const [currentBalance, setCurrentBalance] = useState(mockCustomerLoyalty.pointsAvailable);
  const [transactionId, setTransactionId] = useState('');
  const [qrCode, setQrCode] = useState('');

  const [rewards, setRewards] = useState<Reward[]>([]);

  const itemsPerPage = 6;

  useEffect(() => {
    fetchRewards();
  }, []);

  // ================= FETCH =================
  const fetchRewards = async () => {
    try {
      const data: Reward[] = await getActiveRewards();
      setRewards(data); // ✅ dùng trực tiếp BE
    } catch (error) {
      console.error("Fetch rewards error:", error);
    }
  };

  // ================= FILTER =================
  const filteredRewards = rewards.filter((reward) => {
    const matchesPointRange =
      !selectedPointRange ||
      (reward.requiredPoints >= selectedPointRange.min &&
        (!selectedPointRange.max ||
          reward.requiredPoints <= selectedPointRange.max));

    const matchesSearch =
      !searchQuery ||
      reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reward.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesPointRange && matchesSearch;
  });

  // ================= SORT =================
  const sortedRewards = [...filteredRewards].sort((a, b) => {
    switch (sortBy) {
      case 'Points: Low to High':
        return a.requiredPoints - b.requiredPoints;
      case 'Points: High to Low':
        return b.requiredPoints - a.requiredPoints;
      default:
        return 0;
    }
  });

  // ================= PAGINATION =================
  const totalPages = Math.ceil(sortedRewards.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRewards = sortedRewards.slice(startIndex, startIndex + itemsPerPage);

  // ================= HANDLERS =================
  const handleRedeem = (reward: Reward) => {
    setSelectedReward(reward);
    setShowConfirmModal(true);
  };

  const handleConfirmRedemption = async () => {
    if (!selectedReward) return;

    try {
      const res = await confirmRedeem(selectedReward.id);

      const txnId = res.redemptionCode || "";
      const qr = res.qrImage || "";

      setTransactionId(txnId);
      setQrCode(qr);

      // ✅ đúng field
      const newBalance = currentBalance - selectedReward.requiredPoints;
      setCurrentBalance(newBalance);

      setShowConfirmModal(false);
      setShowSuccessModal(true);

    } catch (error: any) {
      console.error("Redeem failed:", error);

      // Tạo thông báo chi tiết khi không đủ điểm
      let message = error?.message || "Không đủ điểm để đổi thưởng";
      
      if (selectedReward && error?.message?.toLowerCase().includes("not enough points")) {
        const pointsNeeded = selectedReward.requiredPoints - currentBalance;
        message = `Điểm của bạn không đủ để đổi thưởng này.\nBạn có: ${currentBalance.toLocaleString()} điểm\nCần: ${selectedReward.requiredPoints.toLocaleString()} điểm\nThiếu: ${pointsNeeded.toLocaleString()} điểm`;
      }

      alert(message);
    }
  };

  const handleCancelRedemption = () => {
    setShowConfirmModal(false);
    setSelectedReward(null);
  };

  const handleViewHistory = () => {
    setShowSuccessModal(false);
    alert('Navigate to history...');
  };

  const handleBackToRewards = () => {
    setShowSuccessModal(false);
    setSelectedReward(null);
  };

  // ================= UI =================
  return (
    <div className="redeem-points-page">
      {/* HEADER */}
      <header className="page-header">
        <span className="logo-text">FPT Rewards</span>

        <div className="user-info">
          <button onClick={() => setShowBalanceModal(true)}>
            💎 Kiểm tra điểm
          </button>
        </div>
      </header>

      {/* BALANCE */}
      <div className="balance">
        {currentBalance.toLocaleString()} Points
      </div>

      {/* SEARCH + SORT */}
      <div className="controls">
        <input
          type="text"
          placeholder="Search rewards..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option>Recommended</option>
          <option>Points: Low to High</option>
          <option>Points: High to Low</option>
        </select>
      </div>

      {/* FILTER POINT RANGE */}
      <div>
        {pointRanges.map((range) => (
          <button
            key={range.label}
            onClick={() => setSelectedPointRange(range)}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* LIST */}
      <div className="rewards-grid">
        {paginatedRewards.map((reward) => (
          <RewardCard
            key={reward.id}
            reward={reward}
            onRedeem={handleRedeem}
          />
        ))}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button key={page} onClick={() => setCurrentPage(page)}>
              {page}
            </button>
          ))}
        </div>
      )}

      {/* MODALS */}
      {showConfirmModal && selectedReward && (
        <RedemptionConfirmModal
          reward={selectedReward}
          currentBalance={currentBalance}
          onConfirm={handleConfirmRedemption}
          onCancel={handleCancelRedemption}
        />
      )}

      {showSuccessModal && selectedReward && (
        <RedemptionSuccessModal
          reward={selectedReward}
          newBalance={currentBalance}
          transactionId={transactionId}
          qrCode={qrCode}
          onViewHistory={handleViewHistory}
          onBackToRewards={handleBackToRewards}
        />
      )}

      {showBalanceModal && (
        <PointsBalanceModal
          onClose={() => setShowBalanceModal(false)}
        />
      )}
    </div>
  );
};

export default RedeemPoints;