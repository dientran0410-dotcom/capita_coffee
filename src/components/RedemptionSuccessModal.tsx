import type { Reward } from '../types/Reward';
import './RedemptionSuccessModal.css';

interface RedemptionSuccessModalProps {
  reward: Reward;
  newBalance: number;
  transactionId: string;
  onViewHistory: () => void;
  onBackToRewards: () => void;
  qrCode: string;
}

const RedemptionSuccessModal = ({
  reward,
  newBalance,
  transactionId,
  onViewHistory,
  onBackToRewards,
  qrCode
}: RedemptionSuccessModalProps) => {

  const currentDate = new Date();

  const formattedDate = currentDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedTime = currentDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const handleCopyTransactionId = () => {
    navigator.clipboard.writeText(transactionId);
    alert('Transaction ID copied!');
  };

  // ✅ dùng đúng field
  const cost = reward.requiredPoints;

  return (
    <div className="modal-overlay" onClick={onBackToRewards}>
      <div
        className="modal-content redemption-success-modal"
        onClick={(e) => e.stopPropagation()}
      >

        {/* HEADER */}
        <div className="success-header">
          <div className="success-icon">
            🏆
          </div>

          <h2 className="success-title">Redemption Successful!</h2>

          <p className="success-message">
            You have successfully redeemed <strong>{reward.name}</strong>.
          </p>
        </div>

        {/* REWARD CARD */}
        <div className="reward-success-card">

          <div className="reward-card-header">
            <span className="reward-card-badge">
              {reward.name.toUpperCase()}
            </span>

            <div className="reward-card-subtitle">
              Valid across all franchise locations
            </div>
          </div>

          {/* QR */}
          <div className="reward-card-qr">
            <div className="qr-code-box">
              {qrCode ? (
                <img
                  src={qrCode}
                  alt="Reward QR Code"
                  className="qr-image"
                />
              ) : (
                <p>Generating QR...</p>
              )}
            </div>
          </div>

          {/* DETAILS */}
          <div className="reward-card-details">

            <div className="detail-row">
              <span className="detail-label">Points Deducted</span>
              <span className="detail-value negative">
                -{cost.toLocaleString()} pts
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">New Balance</span>
              <span className="detail-value positive">
                {newBalance.toLocaleString()} pts
              </span>
            </div>

            <div className="detail-divider"></div>

            <div className="detail-row">
              <span className="detail-label">Date & Time</span>
              <span className="detail-value">
                {formattedDate} • {formattedTime}
              </span>
            </div>
          </div>
        </div>

        {/* TRANSACTION */}
        <div className="transaction-id-section">
          <span className="transaction-label">TRANSACTION ID</span>

          <div className="transaction-id-box">
            <span className="transaction-id-value">{transactionId}</span>

            <button
              className="copy-btn"
              onClick={handleCopyTransactionId}
              title="Copy"
            >
              📋
            </button>
          </div>
        </div>

        {/* INSTRUCTION */}
        <div className="redemption-instructions">
          <p className="instruction-text">
            Show this QR code to the cashier to claim your reward.
          </p>

          <p className="expiry-notice">
            Expires in <strong>24 hours</strong>
          </p>
        </div>

        {/* ACTIONS */}
        <div className="success-actions">
          <button className="btn-view-history" onClick={onViewHistory}>
            🔄 View History
          </button>

          <button className="btn-back-rewards" onClick={onBackToRewards}>
            Back to Rewards
          </button>
        </div>
      </div>
    </div>
  );
};

export default RedemptionSuccessModal;