import { useState } from 'react';
import { DollarSign, TrendingUp, Coffee, ShoppingBag, Download, } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, } from 'recharts';
export function SalesReport() {
    const [period, setPeriod] = useState('week');
    const weeklyData = [
        { label: 'Mon', revenue: 3800, orders: 105, avgOrder: 36.2 },
        { label: 'Tue', revenue: 4100, orders: 118, avgOrder: 34.7 },
        { label: 'Wed', revenue: 3950, orders: 110, avgOrder: 35.9 },
        { label: 'Thu', revenue: 4320, orders: 128, avgOrder: 33.8 },
        { label: 'Fri', revenue: 5200, orders: 155, avgOrder: 33.5 },
        { label: 'Sat', revenue: 6100, orders: 182, avgOrder: 33.5 },
        { label: 'Sun', revenue: 5700, orders: 165, avgOrder: 34.5 },
    ];
    const monthlyData = [
        { label: 'Week 1', revenue: 27150, orders: 770 },
        { label: 'Week 2', revenue: 29400, orders: 825 },
        { label: 'Week 3', revenue: 31200, orders: 880 },
        { label: 'Week 4', revenue: 33170, orders: 963 },
    ];
    const chartData = period === 'week' ? weeklyData : monthlyData;
    const topProducts = [
        { name: 'Americano', sold: 312, revenue: 1560, color: '#78350f' },
        { name: 'Latte', sold: 278, revenue: 1946, color: '#b45309' },
        { name: 'Cappuccino', sold: 245, revenue: 1715, color: '#d97706' },
        { name: 'Espresso', sold: 198, revenue: 990, color: '#f59e0b' },
        { name: 'Frappuccino', sold: 134, revenue: 1206, color: '#fbbf24' },
    ];
    const kpis = [
        {
            title: period === 'week' ? 'Weekly Revenue' : 'Monthly Revenue',
            value: period === 'week' ? '$33,170' : '$120,920',
            change: '+11.3%',
            trend: 'up',
            icon: DollarSign,
        },
        {
            title: period === 'week' ? 'Weekly Orders' : 'Monthly Orders',
            value: period === 'week' ? '963' : '3,438',
            change: '+8.7%',
            trend: 'up',
            icon: ShoppingBag,
        },
        {
            title: 'Avg Order Value',
            value: '$34.44',
            change: '+2.4%',
            trend: 'up',
            icon: TrendingUp,
        },
        {
            title: 'Top Seller',
            value: 'Americano',
            change: '312 cups',
            trend: 'up',
            icon: Coffee,
        },
    ];
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Report</h1>
          <p className="text-gray-600 mt-1">Riverside Brew #08 — Performance Analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-gray-200 rounded-lg flex overflow-hidden">
            <button onClick={() => setPeriod('week')} className={`px-4 py-2 text-sm font-medium transition-colors ${period === 'week' ? 'bg-amber-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              Week
            </button>
            <button onClick={() => setPeriod('month')} className={`px-4 py-2 text-sm font-medium transition-colors ${period === 'month' ? 'bg-amber-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              Month
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors text-sm">
            <Download className="w-4 h-4"/>
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (<div key={kpi.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-amber-100 p-3 rounded-lg">
                  <Icon className="w-6 h-6 text-amber-600"/>
                </div>
                <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <TrendingUp className="w-4 h-4"/>
                  {kpi.change}
                </div>
              </div>
              <h3 className="text-gray-600 text-sm mb-1">{kpi.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            </div>);
        })}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="label"/>
              <YAxis />
              <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']}/>
              <Line type="monotone" dataKey="revenue" stroke="#d97706" strokeWidth={2} dot={{ r: 4 }}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Order Volume */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Volume</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="label"/>
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#d97706" name="Orders" radius={[4, 4, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Product</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={topProducts} cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} dataKey="sold">
                {topProducts.map((entry) => (<Cell key={entry.name} fill={entry.color}/>))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products This {period === 'week' ? 'Week' : 'Month'}</h3>
          <div className="space-y-3">
            {topProducts.map((product, index) => (<div key={product.name} className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{product.name}</span>
                    <span className="text-sm font-semibold text-gray-700">${product.revenue.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{
                width: `${(product.sold / topProducts[0].sold) * 100}%`,
                backgroundColor: product.color,
            }}/>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{product.sold} cups sold</p>
                </div>
              </div>))}
          </div>
        </div>
      </div>
    </div>);
}
