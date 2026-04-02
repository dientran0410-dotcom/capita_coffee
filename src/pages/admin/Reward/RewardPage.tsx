import React, { useEffect, useMemo, useState } from 'react';
import { getRewards, deleteReward } from '../../../services/rewardService';
import franchiseService, { extractFranchiseList } from '../../../services/franchiseService';
import RewardDetailModal from '../../../components/RewardDetailModal';
import './RewardPage.css';

type FranchiseOption = { id: string; label: string };

function normalizeFranchiseOption(value: any): FranchiseOption | null {
  if (!value) return null;

  const id = String(
    value.franchiseId ??
      value.id ??
      value.branchId ??
      value.franchise_id ??
      value.branch_id ??
      '',
  ).trim();

  if (!id) return null;

  const name = String(
    value.franchiseName ??
      value.branchName ??
      value.name ??
      value.franchiseCode ??
      value.branchCode ??
      value.code ??
      '',
  ).trim();

  return { id, label: name || `Franchise #${id}` };
}

export default function RewardPage() {
  const [rewards, setRewards] = useState([]);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState<'view' | 'create' | 'edit'>('view');
  const [franchiseOptions, setFranchiseOptions] = useState<FranchiseOption[]>([]);
  const [openActionRewardId, setOpenActionRewardId] = useState<number | null>(null);

  const franchiseLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of franchiseOptions) map.set(option.id, option.label);
    return map;
  }, [franchiseOptions]);

  const getFranchiseLabel = (franchiseId: string) => {
    const label = franchiseLabelMap.get(franchiseId);
    return label || `Franchise #${franchiseId}`;
  };

  useEffect(() => {
    fetchRewards();
    void fetchFranchises();
  }, []);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('.actions-menu-wrapper')) return;
      setOpenActionRewardId(null);
    };

    document.addEventListener('mousedown', onDocumentClick);
    return () => {
      document.removeEventListener('mousedown', onDocumentClick);
    };
  }, []);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const data = await getRewards();
      setRewards(data);
    } catch (error) {
      console.error('Lỗi load reward', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFranchises = async () => {
    try {
      let rawItems: any[] = [];

      // Prefer manager list when available; fallback to admin list.
      try {
        const managerItems = await franchiseService.getManagerFranchises();
        if (Array.isArray(managerItems)) rawItems = managerItems;
      } catch {
        // ignore
      }

      if (!rawItems.length) {
        const adminRes = await franchiseService.getAdminFranchises();
        rawItems = extractFranchiseList(adminRes);
      }

      const options = rawItems
        .map(normalizeFranchiseOption)
        .filter(Boolean) as FranchiseOption[];

      const seen = new Set<string>();
      const deduped = options.filter((opt) => {
        if (!opt.id || seen.has(opt.id)) return false;
        seen.add(opt.id);
        return true;
      });

      setFranchiseOptions(deduped.sort((a, b) => a.label.localeCompare(b.label)));
    } catch (e) {
      console.error('Lỗi load franchise', e);
      setFranchiseOptions([]);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn chắc chắn muốn xoá reward?')) return;

    try {
      await deleteReward(id);
      fetchRewards();
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const handleView = (reward: any) => {
    setOpenActionRewardId(null);
  setSelectedReward(reward);
  setModalMode('view');
  setShowDetail(true);
};

const handleEdit = (reward: any) => {
    setOpenActionRewardId(null);
  setSelectedReward(reward);
  setModalMode('edit');
  setShowDetail(true);
};

const handleCreate = () => {
  setSelectedReward(null);
  setModalMode('create');
  setShowDetail(true);
};

  return (
    <div className="reward-management">
      <div className="page-header">
        <div className="header-content">
          <h1>Quản Lý Reward</h1>
          <p>Tạo và quản lý phần thưởng khách hàng</p>
        </div>
        <button className="btn-create" onClick={handleCreate}>
          <span>+</span> Tạo Reward Mới
        </button>
      </div>

      <div className="rewards-table-container">
        <table className="rewards-table">
          <thead>
            <tr>
              <th>FRANCHISE</th>
              <th>TÊN REWARD</th>
              <th>POINTS YÊU CẦU</th>
              <th>TRẠNG THÁI</th>
              <th>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                  Đang tải...
                </td>
              </tr>
            ) : rewards.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                  Không có reward nào
                </td>
              </tr>
            ) : (
              rewards.map((reward: any, index: number) => (
                <tr key={reward.id}>
                  <td>
                    <div className="reward-franchise" title={getFranchiseLabel(String(reward.franchiseId || ''))}>
                      {getFranchiseLabel(String(reward.franchiseId || ''))}
                    </div>
                  </td>
                  <td>
                    <div className="reward-name" title={reward.name}>{reward.name}</div>
                    {reward.description && (
                      <div className="reward-description" title={reward.description}>{reward.description}</div>
                    )}
                  </td>
                  <td>
                    <div className="reward-points" title={reward.requiredPoints?.toLocaleString()}>
                      {reward.requiredPoints.toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        reward.active ? 'status-active' : 'status-inactive'
                      }`}
                    >
                      {reward.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell actions-menu-wrapper">
                      <button
                        className="btn-icon more"
                        onClick={() =>
                          setOpenActionRewardId((prev) =>
                            prev === reward.id ? null : reward.id,
                          )
                        }
                        title="Thao tác"
                        aria-label="Mở menu thao tác"
                      >
                        ⋯
                      </button>

                      {openActionRewardId === reward.id && (
                        <div
                          className={`actions-dropdown ${index === rewards.length - 1 ? 'actions-dropdown-up' : ''}`}
                          role="menu"
                        >
                          <button
                            type="button"
                            className="actions-dropdown-item"
                            onClick={() => handleView(reward)}
                          >
                            Xem chi tiết
                          </button>
                          <button
                            type="button"
                            className="actions-dropdown-item"
                            onClick={() => handleEdit(reward)}
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            type="button"
                            className="actions-dropdown-item danger"
                            onClick={() => {
                              setOpenActionRewardId(null);
                              void handleDelete(reward.id);
                            }}
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showDetail && (
    <RewardDetailModal
        reward={selectedReward}
        mode={modalMode}
        onClose={() => setShowDetail(false)}
        onSuccess={fetchRewards}
    />
    )}
    </div>
  );
}