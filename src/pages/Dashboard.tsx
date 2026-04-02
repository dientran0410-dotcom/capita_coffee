import { Users, Package, ShoppingCart, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  // Mock data - trong thực tế sẽ fetch từ API
  const stats = [
    {
      id: 1,
      title: 'Tổng người dùng',
      value: '2,543',
      change: '+12.5%',
      icon: Users,
      color: 'blue',
    },
    {
      id: 2,
      title: 'Tổng sản phẩm',
      value: '1,284',
      change: '+8.2%',
      icon: Package,
      color: 'purple',
    },
    {
      id: 3,
      title: 'Đơn hàng',
      value: '8,432',
      change: '+23.1%',
      icon: ShoppingCart,
      color: 'green',
    },
    {
      id: 4,
      title: 'Doanh thu',
      value: '₫124.5M',
      change: '+15.3%',
      icon: DollarSign,
      color: 'orange',
    },
  ];

  const recentOrders = [
    { id: 1, customer: 'Nguyễn Văn A', product: 'Laptop Dell XPS 13', amount: '₫25,000,000', status: 'Đã giao', date: '05/03/2026' },
    { id: 2, customer: 'Trần Thị B', product: 'iPhone 15 Pro', amount: '₫28,000,000', status: 'Đang giao', date: '04/03/2026' },
    { id: 3, customer: 'Lê Văn C', product: 'Samsung Galaxy S24', amount: '₫22,000,000', status: 'Đang xử lý', date: '04/03/2026' },
    { id: 4, customer: 'Phạm Thị D', product: 'MacBook Pro M3', amount: '₫45,000,000', status: 'Đã giao', date: '03/03/2026' },
    { id: 5, customer: 'Hoàng Văn E', product: 'iPad Air', amount: '₫15,000,000', status: 'Đã giao', date: '02/03/2026' },
  ];

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Đã giao':
        return 'status-delivered';
      case 'Đang giao':
        return 'status-shipping';
      case 'Đang xử lý':
        return 'status-processing';
      default:
        return '';
    }
  };

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Chào mừng trở lại! Đây là tổng quan hệ thống của bạn.</p>
        </div>
        <div className="dashboard-date">
          <Calendar size={18} />
          <span>Hôm nay: 05/03/2026</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.id} className={`stat-card stat-card-${stat.color}`}>
              <div className="stat-icon-wrapper">
                <Icon size={24} className="stat-icon" />
              </div>
              <div className="stat-content">
                <p className="stat-label">{stat.title}</p>
                <h3 className="stat-value">{stat.value}</h3>
                <div className="stat-change">
                  <TrendingUp size={14} />
                  <span>{stat.change}</span>
                  <span className="stat-period">so với tháng trước</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Đơn hàng gần đây</h2>
          <button className="view-all-button">Xem tất cả →</button>
        </div>

        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Sản phẩm</th>
                <th>Giá trị</th>
                <th>Trạng thái</th>
                <th>Ngày</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="order-id">#{order.id.toString().padStart(5, '0')}</td>
                  <td className="customer-name">{order.customer}</td>
                  <td className="product-name">{order.product}</td>
                  <td className="order-amount">{order.amount}</td>
                  <td>
                    <span className={`order-status ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="order-date">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">Thao tác nhanh</h2>
        </div>
        
        <div className="quick-actions-grid">
          <button className="quick-action-card">
            <Package size={32} />
            <span>Thêm sản phẩm mới</span>
          </button>
          <button className="quick-action-card">
            <Users size={32} />
            <span>Quản lý người dùng</span>
          </button>
          <button className="quick-action-card">
            <ShoppingCart size={32} />
            <span>Xem đơn hàng</span>
          </button>
          <button className="quick-action-card">
            <TrendingUp size={32} />
            <span>Báo cáo thống kê</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
