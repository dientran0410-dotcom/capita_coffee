import type { Reward } from '../types/Reward';
import './RedemptionConfirmModal.css';

interface RedemptionConfirmModalProps {
  reward: Reward;
  currentBalance: number;
  onConfirm: () => void;
  onCancel: () => void;
}

const RedemptionConfirmModal = ({
  reward,
  currentBalance,
  onConfirm,
  onCancel
}: RedemptionConfirmModalProps) => {

  // ✅ dùng requiredPoints
  const cost = reward.requiredPoints;
  const newBalance = currentBalance - cost;
  const hasSufficientPoints = currentBalance >= cost;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content redemption-confirm-modal"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="modal-header">
          <div className="modal-logo">
            <span className="modal-logo-icon">🎁</span>
            <span className="modal-logo-text">RewardHub</span>
          </div>

          <div className="current-balance-badge">
            <span className="balance-label">CURRENT BALANCE</span>
            <span className="balance-value">
              {currentBalance.toLocaleString()} Points
            </span>
          </div>
        </div>

        <h2 className="modal-title">Confirm Points Redemption</h2>

        {/* Reward Preview */}
        <div className="reward-preview">
          <img
            src={reward.imageUrl}
            alt={reward.name}
            className="reward-preview-image"
          />

          <div className="reward-badge">
            {reward.active ? 'Available' : 'Unavailable'}
          </div>

          <div className="reward-preview-info">
            <h3 className="reward-preview-name">{reward.name}</h3>
            <p className="reward-preview-desc">{reward.description}</p>
          </div>
        </div>

        {/* Points Status */}
        {hasSufficientPoints ? (
          <div className="points-status sufficient">
            <span className="status-icon">✓</span>
            <div className="status-text">
              <strong>Sufficient Points Available</strong>
              <p>You can redeem this reward immediately.</p>
            </div>
          </div>
        ) : (
          <div className="points-status insufficient">
            <span className="status-icon">⚠</span>
            <div className="status-text">
              <strong>Insufficient Points</strong>
              <p>
                You need{' '}
                {(cost - currentBalance).toLocaleString()} more points.
              </p>
            </div>
          </div>
        )}

        {/* Transaction Summary */}
        <div className="transaction-summary">
          <h4 className="summary-title">TRANSACTION SUMMARY</h4>

          <div className="summary-row">
            <span className="summary-label">Current Balance</span>
            <span className="summary-value">
              {currentBalance.toLocaleString()} pts
            </span>
          </div>

          <div className="summary-row">
            <span className="summary-label">Reward Cost</span>
            <span className="summary-value negative">
              -{cost.toLocaleString()} pts
            </span>
          </div>

          <div className="summary-divider"></div>

          <div className="summary-row summary-total">
            <span className="summary-label">New Balance</span>
            <span
              className={`summary-value ${
                newBalance >= 0 ? 'positive' : 'negative'
              }`}
            >
              {newBalance.toLocaleString()} pts
            </span>
          </div>
        </div>

        {/* Note */}
        <p className="redemption-note">
          Points will be deducted instantly after confirmation. This reward is valid across all franchises.
        </p>

        {/* Actions */}
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>

          <button
            className="btn-confirm"
            onClick={onConfirm}
            disabled={!hasSufficientPoints || !reward.active}
          >
            {hasSufficientPoints
              ? 'Confirm Redemption →'
              : 'Not Enough Points'}
          </button>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <span className="secure-icon">🔒</span>
          <span className="secure-text">Secure Transaction</span>
          <span className="transaction-id">
            TXN-REQ-{Date.now().toString().slice(-6)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RedemptionConfirmModal;