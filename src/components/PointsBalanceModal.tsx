import { useState } from 'react';
import { X, Star, TrendingUp, Award, CheckCircle } from 'lucide-react';
import type { PointsBalanceResponse } from '../types/Reward';
import pointsBalanceService from '../services/PointsBalanceService';
import './PointsBalanceModal.css';

interface PointsBalanceModalProps {
  onClose: () => void;
  defaultCustomerId?: number;
  defaultFranchiseId?: number;
}

const PointsBalanceModal = ({
  onClose,
  defaultCustomerId,
  defaultFranchiseId,
}: PointsBalanceModalProps) => {
  const [customerId, setCustomerId] = useState<string>(
    defaultCustomerId ? String(defaultCustomerId) : ''
  );
  const [franchiseId, setFranchiseId] = useState<string>(
    defaultFranchiseId ? String(defaultFranchiseId) : ''
  );
  const [balance, setBalance] = useState<PointsBalanceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!customerId || !franchiseId) {
      setError('Vui lòng nhập Customer ID và Franchise ID.');
      return;
    }
    const customerIdNum = Number(customerId);
    const franchiseIdNum = Number(franchiseId);
    if (!Number.isFinite(customerIdNum) || !Number.isFinite(franchiseIdNum) || customerIdNum <= 0 || franchiseIdNum <= 0) {
      setError('Customer ID và Franchise ID phải là số hợp lệ.');
      return;
    }

    setError(null);
    setBalance(null);
    setLoading(true);
    try {
      const result = await pointsBalanceService.getPointsBalance(customerIdNum, franchiseIdNum);
      setBalance(result);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        `Không tìm thấy khách hàng ID ${customerId} tại franchise ${franchiseId}.`;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tierName: string) => {
    const name = tierName?.toLowerCase() || '';
    if (name.includes('platinum')) return '#7c3aed';
    if (name.includes('gold')) return '#d97706';
    if (name.includes('silver')) return '#6b7280';
    if (name.includes('bronze')) return '#b45309';
    return '#e63946';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content points-balance-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="pb-modal-header">
          <div className="pb-modal-title-group">
            <div className="pb-modal-icon">
              <Star size={22} />
            </div>
            <div>
              <h2 className="pb-modal-title">Points Balance</h2>
              <p className="pb-modal-subtitle">Kiểm tra số điểm tích lũy của khách hàng</p>
            </div>
          </div>
          <button className="pb-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <div className="pb-form">
          <div className="pb-form-row">
            <div className="pb-field">
              <label className="pb-label">Customer ID</label>
              <input
                type="number"
                className="pb-input"
                placeholder="Nhập Customer ID"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                min={1}
              />
            </div>
            <div className="pb-field">
              <label className="pb-label">Franchise ID</label>
              <input
                type="number"
                className="pb-input"
                placeholder="Nhập Franchise ID"
                value={franchiseId}
                onChange={(e) => setFranchiseId(e.target.value)}
                min={1}
              />
            </div>
          </div>

          <button
            className="pb-check-btn"
            onClick={handleCheck}
            disabled={loading}
          >
            <TrendingUp size={16} />
            {loading ? 'Đang kiểm tra...' : 'Kiểm tra điểm'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="pb-error">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Result */}
        {balance && (
          <div className="pb-result">
            {/* Status Badge */}
            <div className="pb-status-row">
              <span
                className={`pb-status-badge ${
                  balance.status?.toLowerCase() === 'active'
                    ? 'pb-status-active'
                    : 'pb-status-inactive'
                }`}
              >
                <CheckCircle size={12} />
                {balance.status || 'N/A'}
              </span>
              <span className="pb-meta">
                Customer #{balance.customerId} · Franchise #{balance.franchiseId}
              </span>
            </div>

            {/* Points Cards */}
            <div className="pb-points-row">
              <div className="pb-points-card pb-points-current">
                <span className="pb-points-label">Điểm hiện tại</span>
                <span className="pb-points-value">
                  {balance.currentPoints?.toLocaleString()}
                </span>
                <span className="pb-points-unit">pts</span>
              </div>
              <div className="pb-points-card pb-points-total">
                <span className="pb-points-label">Tổng điểm tích lũy</span>
                <span className="pb-points-value">
                  {balance.totalEarnedPoints?.toLocaleString()}
                </span>
                <span className="pb-points-unit">pts</span>
              </div>
            </div>

            {/* Tier Info */}
            {balance.tier && (
              <div
                className="pb-tier-card"
                style={
                  { '--tier-color': getTierColor(balance.tier.tierName) } as React.CSSProperties
                }
              >
                <div className="pb-tier-header">
                  <Award size={20} className="pb-tier-icon" />
                  <div>
                    <p className="pb-tier-label">Hạng thành viên</p>
                    <p className="pb-tier-name">{balance.tier.tierName}</p>
                  </div>
                  <div className="pb-tier-min">
                    <p className="pb-tier-min-label">Điểm tối thiểu</p>
                    <p className="pb-tier-min-value">
                      {balance.tier.minPoints?.toLocaleString()} pts
                    </p>
                  </div>
                </div>
                {balance.tier.benefits && (
                  <div className="pb-tier-benefits">
                    <p className="pb-benefits-label">Quyền lợi</p>
                    <p className="pb-benefits-text">{balance.tier.benefits}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PointsBalanceModal;
