import { useEffect, useState } from 'react';
import { Users, ShoppingCart, DollarSign, CheckCircle, ArrowRight, Mail, User, Building } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, } from 'recharts';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getOrderStats } from '../../services/orderService';
import { getDailyRevenueData, getHourlyRevenueData } from '../../services/revenueService';
import { getAllStaffs } from '../../services/staffService';
import { useManagerBranchSelection } from '../../hooks/useManagerBranchSelection';

interface KPI {
  title: string;
  value: string;
  icon: React.ComponentType<{ className: string }>;
  color: string;
}

interface RevenueData {
  day: string;
  revenue: number;
  orders: number;
}

export function ManagerDashboard() {
  const { user } = useAuth();
  const authFranchiseId = user?.franchiseId || user?.raw?.franchiseId || '';

  const {
    selectedBranchId,
    loading: loadingBranches,
    branches,
  } = useManagerBranchSelection(authFranchiseId as string);

  // State for KPIs
  const [orderStats, setOrderStats] = useState({ totalOrders: 0, preparing: 0, delivered: 0 });
  const [totalStaffCount, setTotalStaffCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [hourlyData, setHourlyData] = useState<Array<{ hour: string; orders: number; revenue: number; time: string }>>([]);
  const [loading, setLoading] = useState(true);


  // Fetch data on component mount or when branch changes
  useEffect(() => {
    if (loadingBranches || !selectedBranchId) {
      setLoading(true);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch order stats with error handling
        try {
          const stats = await getOrderStats();
          setOrderStats(stats);
        } catch (error) {
          console.error('Error fetching order stats:', error);
          // Set default values if stats endpoint fails
          setOrderStats({ totalOrders: 0, preparing: 0, delivered: 0 });
        }

        // Fetch total staff count
        try {
          const staffData = await getAllStaffs(0, 1000);
          setTotalStaffCount(staffData?.totalElements || 0);
        } catch (error) {
          console.error('Error fetching staff count:', error);
          setTotalStaffCount(0);
        }

        // Calculate total revenue based on delivered orders (average order value)
        const avgOrderValue = 50; // Average order value in dollars
        const totalAmt = (orderStats.delivered || 0) * avgOrderValue;
        setTotalRevenue(totalAmt);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedBranchId, loadingBranches]);

  // Generate sample chart data (replace with real data when available)
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const dailyData = await getDailyRevenueData();
        setRevenueData(dailyData);

        const hourlyData = await getHourlyRevenueData();
        setHourlyData(hourlyData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
        // Keep existing fallback data
      }
    };

    fetchChartData();
  }, []);

  // Build KPIs dynamically
  const kpis: KPI[] = [
    {
      title: "Today's Revenue",
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Orders Today',
      value: String(orderStats.totalOrders),
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Staff',
      value: String(totalStaffCount),
      icon: Users,
      color: 'bg-purple-500',
    },
    {
      title: 'Orders Completed',
      value: String(orderStats.delivered),
      icon: CheckCircle,
      color: 'bg-amber-500',
    },
  ];
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Store Dashboard</h1>
        <p className="text-gray-600 mt-1">Real-time store overview — {new Date().toLocaleDateString()}</p>
      </div>

      {/* Manager Account Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Manager Account Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <User className="w-8 h-8 text-amber-600 mb-4" />
          <div className="flex items-center justify-between">
            <h3 className="text-gray-600 text-sm font-medium">Manager Account</h3>
            <p className="text-lg font-semibold text-gray-900">
              {String(user?.username || user?.raw?.username || 'N/A')}
            </p>
          </div>
        </div>

        {/* Email Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <Mail className="w-8 h-8 text-blue-600 mb-4" />
          <div className="flex items-center justify-between">
            <h3 className="text-gray-600 text-sm font-medium">Email</h3>
            <p className="text-lg font-semibold text-gray-900 break-all">
              {String(
                (() => {
                  // Try multiple paths to get email
                  const rawData = user?.raw as any;

                  // Path 1: user.raw.data.user.email
                  if (rawData?.data?.user?.email) {
                    console.log('✅ Got email from user.raw.data.user.email:', rawData.data.user.email);
                    return rawData.data.user.email;
                  }

                  // Path 2: user.raw.email
                  if (rawData?.email) {
                    console.log('✅ Got email from user.raw.email:', rawData.email);
                    return rawData.email;
                  }

                  // Path 3: user.email
                  if (user?.email) {
                    console.log('✅ Got email from user.email:', user.email);
                    return user.email;
                  }

                  // Path 4: username
                  if (user?.username) {
                    console.log('✅ Got username:', user.username);
                    return user.username;
                  }

                  console.warn('⚠️ No email found in any path');
                  return 'N/A';
                })()
              )}
            </p>
          </div>
        </div>

        {/* Franchises Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <Building className="w-8 h-8 text-green-600 mb-4" />
          <div className="flex items-center justify-between">
            <h3 className="text-gray-600 text-sm font-medium">Franchises Managed</h3>
            <p className="text-lg font-semibold text-gray-900">
              {!loadingBranches ? (
                `${branches?.length || 0} ${branches?.length === 1 ? 'franchise' : 'franchises'}`
              ) : (
                'Loading...'
              )}
            </p>
          </div>
        </div>
      </div>

      {loadingBranches || !selectedBranchId ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-yellow-800">
          <p className="font-medium">Please select a franchise to view dashboard data.</p>
        </div>
      ) : loading ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-blue-800">
          <p className="font-medium">Loading dashboard data...</p>
        </div>
      ) : (
        <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (<div key={kpi.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${kpi.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white"/>
                </div>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">{kpi.title}</h3>
              <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
            </div>);
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Revenue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Revenue</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="day"/>
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#d97706" strokeWidth={2} name="Revenue ($)"/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Hourly Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hourly Orders Today</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="hour"/>
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#d97706" name="Orders" radius={[4, 4, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/manager/staff" className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl p-6 transition-colors group">
          <Users className="w-8 h-8 mb-3"/>
          <h4 className="font-semibold mb-1">Manage Staff</h4>
          <p className="text-sm text-amber-100">View and assign shifts</p>
          <ArrowRight className="w-5 h-5 mt-3 group-hover:translate-x-1 transition-transform"/>
        </Link>
        <Link to="/manager/inventory" className="bg-white border-2 border-gray-200 hover:border-amber-600 rounded-xl p-6 transition-colors group">
          <CheckCircle className="w-8 h-8 mb-3 text-amber-600"/>
          <h4 className="font-semibold mb-1 text-gray-900">Check Inventory</h4>
          <p className="text-sm text-gray-600">View current stock levels</p>
          <ArrowRight className="w-5 h-5 mt-3 text-amber-600 group-hover:translate-x-1 transition-transform"/>
        </Link>
      </div>
        </>
      )}
    </div>
  );
}

