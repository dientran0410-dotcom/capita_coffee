import { useEffect, useMemo, useState } from 'react';
import { Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import './RedemptionHistory.css';
import type {
  RedemptionHistory,
  RedemptionSummary,
  RedemptionFilters,
  CustomerRedemptionResponse,
} from '../../../types/Redemption';
import { RedemptionStatus } from '../../../types/Redemption';
import { getAllRedemption } from '../../../services/redemptionService';

type RedemptionHistoryItem = RedemptionHistory & {
  rawDate: string;
  expirationDate?: string | null;
};

const EXPIRATION_DAYS = 7;

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDisplayDate = (value?: string | null) => {
  const parsed = parseDate(value);
  return parsed ? parsed.toLocaleDateString('vi-VN') : 'N/A';
};

const normalizeStatus = (status?: string): RedemptionStatus => {
  switch ((status || '').toUpperCase()) {
    case 'CLAIMED':
      return RedemptionStatus.CLAIMED;
    case 'SHIPPED':
      return RedemptionStatus.SHIPPED;
    case 'USED':
      return RedemptionStatus.USED;
    case 'EXPIRED':
      return RedemptionStatus.EXPIRED;
    case 'DELIVERED':
      return RedemptionStatus.DELIVERED;
    default:
      return RedemptionStatus.PENDING;
  }
};

const inRangeByFilter = (dateString: string, dateRange: string): boolean => {
  if (dateRange === 'All Time') return true;

  const targetDate = parseDate(dateString);
  if (!targetDate) return false;

  const now = new Date();
  const diffDays = (now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24);

  if (dateRange === 'Last 7 Days') return diffDays <= 7;
  if (dateRange === 'Last 30 Days') return diffDays <= 30;
  if (dateRange === 'Last 90 Days') return diffDays <= 90;
  if (dateRange === 'Last Year') return diffDays <= 365;

  return true;
};

const RedemptionHistoryPage = () => {
  const [history, setHistory] = useState<RedemptionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RedemptionFilters>({
    searchQuery: '',
    status: 'All',
    dateRange: 'Last 30 Days',
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllRedemption();
        const list = Array.isArray(response) ? response : [];

        const mapped = list.map((item: CustomerRedemptionResponse & { rewardName?: string; rewardIcon?: string }) => ({
          id: item.id,
          date: formatDisplayDate(item.creationDate),
          rawDate: item.creationDate,
          rewardName: item.rewardName || `Phần thưởng #${item.rewardId}`,
          rewardIcon: item.rewardIcon || '🎁',
          pointsSpent: item.pointsUsed ?? 0,
          status: normalizeStatus(item.status),
          expirationDate: item.expirationDate,
        }));

        setHistory(mapped);
      } catch (err: any) {
        setError(err?.message || 'Không thể tải lịch sử đổi thưởng.');
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchHistory();
  }, []);

  const summary: RedemptionSummary = useMemo(() => {
    const now = new Date();
    const threshold = new Date(now);
    threshold.setDate(now.getDate() + EXPIRATION_DAYS);

    const pointsExpiringSoon = history
      .filter((item) => {
        const expiration = parseDate(item.expirationDate);
        return Boolean(expiration && expiration > now && expiration <= threshold);
      })
      .reduce((total, item) => total + item.pointsSpent, 0);

    return {
      totalPointsRedeemed: history.reduce((total, item) => total + item.pointsSpent, 0),
      pointsChangePercentage: 0,
      totalRewardsClaimed: history.length,
      rewardsChangePercentage: 0,
      pointsExpiringSoon,
      expirationDays: EXPIRATION_DAYS,
    };
  }, [history]);

  // Filter the data
  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.rewardName.toLowerCase().includes(filters.searchQuery.toLowerCase());
    const matchesStatus = filters.status === 'All' || item.status === filters.status;
    const matchesDate = inRangeByFilter(item.rawDate, filters.dateRange);
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredHistory.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.searchQuery, filters.status, filters.dateRange]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getStatusClass = (status: RedemptionStatus) => {
    switch (status) {
      case RedemptionStatus.CLAIMED:
      case RedemptionStatus.DELIVERED:
        return 'status-claimed';
      case RedemptionStatus.SHIPPED:
        return 'status-shipped';
      case RedemptionStatus.USED:
        return 'status-used';
      case RedemptionStatus.EXPIRED:
        return 'status-expired';
      default:
        return '';
    }
  };

  const handleExportCSV = () => {
    // Implement CSV export logic
    console.log('Exporting to CSV...');
  };

  return (
    <div className="redemption-history-content">
        {/* Header */}
        <header className="page-header">
          <div>
            <h1 className="page-title">Lịch sử đổi thưởng</h1>
            <p className="page-subtitle">Theo dõi phần thưởng và điểm sử dụng theo thời gian.</p>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-label">Tổng Điểm Đã Đổi</div>
            <div className="summary-value">{summary.totalPointsRedeemed.toLocaleString()}</div>
            <div className="summary-change positive">
              ↗ +{summary.pointsChangePercentage}% tháng này
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Tổng Phần Thưởng Nhận</div>
            <div className="summary-value">{summary.totalRewardsClaimed}</div>
            <div className="summary-change positive">
              ↗ +{summary.rewardsChangePercentage}% tháng này
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-label">Điểm Sắp Hết Hạn</div>
            <div className="summary-value">{summary.pointsExpiringSoon}</div>
            <div className="summary-change warning">
              ⚠️ Hết hạn trong {summary.expirationDays} ngày
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm phần thưởng..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="search-input"
            />
          </div>

          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="All">Trạng thái: Tất cả</option>
            <option value={RedemptionStatus.PENDING}>Đã đặt</option>
            <option value={RedemptionStatus.USED}>Đã sử dụng</option>
            <option value={RedemptionStatus.EXPIRED}>Hết hạn</option>
          </select>

          {/* <select
            className="filter-select"
            value={filters.dateRange}
            onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
          >
            <option value="Last 7 Days">Ngày: 7 ngày qua</option>
            <option value="Last 30 Days">Ngày: 30 ngày qua</option>
            <option value="Last 90 Days">Ngày: 90 ngày qua</option>
            <option value="Last Year">Ngày: Năm qua</option>
            <option value="All Time">Ngày: Tất cả</option>
          </select> */}

          <div className="results-count">
            Hiển thị {filteredHistory.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, filteredHistory.length)} của {filteredHistory.length}
          </div>
        </div>

        {/* History Table */}
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Tên Phần Thưởng</th>
                <th>Điểm Đã Dùng</th>
                <th>Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '16px' }}>Đang tải dữ liệu...</td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '16px' }}>Không có dữ liệu đổi thưởng.</td>
                </tr>
              ) : currentItems.map((item) => (
                <tr key={item.id}>
                  <td className="date-column">{item.date}</td>
                  <td className="reward-column">
                    <div className="reward-cell">
                      <span className="reward-icon">{item.rewardIcon}</span>
                      <span className="reward-name">{item.rewardName}</span>
                    </div>
                  </td>
                  <td className="points-column">{item.pointsSpent.toLocaleString()}</td>
                  <td className="status-column">
                    <span className={`status-badge ${getStatusClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="action-column">
                    <button className="view-details-button">Xem Chi Tiết</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button
            className="pagination-button"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={18} />
          </button>

          {[...Array(totalPages)].map((_, index) => {
            const pageNum = index + 1;
            // Show first page, last page, current page, and pages around current
            if (
              pageNum === 1 ||
              pageNum === totalPages ||
              (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
            ) {
              return (
                <button
                  key={pageNum}
                  className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
              return <span key={pageNum} className="pagination-ellipsis">...</span>;
            }
            return null;
          })}

          <button
            className="pagination-button"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
  );
};

export default RedemptionHistoryPage;
