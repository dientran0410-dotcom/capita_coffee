import { useEffect, useState } from 'react';
import { Users, CheckCircle, AlertCircle, TrendingUp, ArrowLeft } from 'lucide-react';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Link } from 'react-router-dom';
import { getAdminCustomerProfileByUserId, getDashboardSummary } from "../../services/supplierService";
import "./SupplierHeaderShared.css";

interface SupplierDashboardStats {
  total: number;
  approved: number;
  suspended: number;
  deleted: number;
}

interface GrowthDataPoint {
  label: string;
  activities: number;
}

interface RecentActivity {
  action: string;
  performedAt: string;
  performedBy: string;
  supplierName: string;
}

export default function SupplierDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SupplierDashboardStats>({
    total: 0,
    approved: 0,
    suspended: 0,
    deleted: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [growthData, setGrowthData] = useState<GrowthDataPoint[]>([]);
  const [performerNames, setPerformerNames] = useState<Record<string, string>>({});

  const extractProfileName = (profile: unknown): string => {
    if (!profile || typeof profile !== 'object') {
      return '';
    }

    const root = profile as Record<string, unknown>;
    const data = root.data && typeof root.data === 'object' ? (root.data as Record<string, unknown>) : {};
    const result = root.result && typeof root.result === 'object' ? (root.result as Record<string, unknown>) : {};

    const candidates = [
      root.fullName,
      root.name,
      root.customerName,
      data.fullName,
      data.name,
      result.fullName,
      result.name,
    ];

    const match = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
    return typeof match === 'string' ? match : '';
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const summary = await getDashboardSummary();

        const supplierMetrics: SupplierDashboardStats = {
          total: Number(summary?.supplierMetrics?.total ?? 0),
          approved: Number(summary?.supplierMetrics?.approved ?? 0),
          suspended: Number(summary?.supplierMetrics?.suspended ?? 0),
          deleted: Number(summary?.supplierMetrics?.deleted ?? 0),
        };

        const activities: RecentActivity[] = Array.isArray(summary?.recentActivities)
          ? summary.recentActivities
          : [];

        setStats(supplierMetrics);
        setRecentActivities(activities.slice(0, 10));

        const performerIds = Array.from(
          new Set(
            activities
              .map((item) => String(item?.performedBy ?? '').trim())
              .filter(Boolean)
          )
        );

        if (performerIds.length > 0) {
          const performerEntries = await Promise.all(
            performerIds.map(async (userId) => {
              try {
                const profile = await getAdminCustomerProfileByUserId(userId);
                const profileName = extractProfileName(profile);
                return [userId, profileName || userId] as const;
              } catch {
                return [userId, userId] as const;
              }
            })
          );
          setPerformerNames(Object.fromEntries(performerEntries));
        } else {
          setPerformerNames({});
        }

        const sortedActivities = [...activities].sort(
          (a, b) => new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime()
        );
        const activityByDay: Record<string, number> = {};
        sortedActivities.forEach((item) => {
          const date = new Date(item.performedAt);
          if (Number.isNaN(date.getTime())) {
            return;
          }
          const label = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
          activityByDay[label] = (activityByDay[label] || 0) + 1;
        });

        const chartData: GrowthDataPoint[] = Object.entries(activityByDay)
          .map(([label, activitiesCount]) => ({ label, activities: activitiesCount }))
          .slice(-7);
        setGrowthData(chartData);
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
        setStats({
          total: 0,
          approved: 0,
          suspended: 0,
          deleted: 0,
        });
        setRecentActivities([]);
        setGrowthData([]);
        setPerformerNames({});
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const kpis = [
    { title: 'Total Suppliers', value: stats.total, change: 'All time', icon: Users, color: 'bg-blue-500', trendColor: 'text-blue-600' },
    { title: 'Approved', value: stats.approved, change: 'Active partners', icon: CheckCircle, color: 'bg-green-500', trendColor: 'text-green-600' },
    { title: 'Suspended', value: stats.suspended, change: 'Inactive', icon: AlertCircle, color: 'bg-red-500', trendColor: 'text-red-600' },
  ];

  const statusDistribution = [
    { name: 'Approved', value: stats.approved, color: '#10b981' },
    { name: 'Suspended', value: stats.suspended, color: '#ef4444' },
    { name: 'Deleted', value: stats.deleted, color: '#6b7280' },
  ].filter(item => item.value > 0);

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionBadgeClass = (action: string) => {
    if (action === 'APPROVE') return 'bg-green-100 text-green-700';
    if (action === 'CREATE') return 'bg-blue-100 text-blue-700';
    if (action === 'UPDATE') return 'bg-amber-100 text-amber-700';
    if (action === 'DELETE') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  if (loading) return <div className="p-10 text-gray-500 flex justify-center">Loading dashboard data...</div>;

  return (
    <div className="space-y-6">
      <div className="supplier-shared-header">
        <div>
          <h1 className="supplier-shared-title">Supplier Overview</h1>
          <p className="supplier-shared-subtitle">Track and manage your supply chain partners</p>
        </div>
        <Link
          to="/admin/suppliers"
          className="supplier-shared-nav-btn"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Supplier List
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
              <div className="mb-5 flex items-center justify-between">
                <div className={`${kpi.color} rounded-lg p-3 shadow-sm`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${kpi.trendColor}`}>
                  <TrendingUp className="h-4 w-4" />
                  {kpi.change}
                </div>
              </div>
              <h3 className="mb-1 text-sm font-medium uppercase tracking-wide text-gray-500">{kpi.title}</h3>
              <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Activity Trend</h3>
          <div className="h-75 w-full">
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ dy: 10 }} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ stroke: '#d1d5db', strokeWidth: 1 }} />
                  <Line type="monotone" dataKey="activities" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Actions" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">No activity data available</div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Status Distribution</h3>
          <div className="h-75 w-full">
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">No data available</div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-gray-500">No recent activities found.</p>
            ) : (
              recentActivities.map((activity, index) => (
                <div key={`${activity.performedAt}-${index}`} className="rounded-xl border border-gray-100 bg-linear-to-br from-white via-gray-50 to-slate-100 p-4">
                  <div className="flex items-start gap-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getActionBadgeClass(activity.action)}`}>
                      {activity.action}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">{activity.supplierName}</p>
                      <p className="mt-1 text-sm text-gray-600">By {performerNames[activity.performedBy] || activity.performedBy}</p>
                      <p className="mt-2 text-xs font-medium text-gray-400">{formatDateTime(activity.performedAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
      </div>
    </div>
  );
}

