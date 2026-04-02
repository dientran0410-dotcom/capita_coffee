import { useState } from 'react';
import { Package, AlertTriangle, TrendingDown, RefreshCw, Wifi, BarChart3, Download, Search, } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
export function Inventory() {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const inventoryItems = [
        {
            id: 'INV-001',
            name: 'Arabica Coffee Beans',
            category: 'Raw Materials',
            currentStock: 450,
            minStock: 200,
            maxStock: 1000,
            unit: 'kg',
            supplier: 'Premium Beans Co.',
            lastRestocked: '2026-02-20',
            status: 'healthy',
            iotEnabled: true,
        },
        {
            id: 'INV-002',
            name: 'Robusta Coffee Beans',
            category: 'Raw Materials',
            currentStock: 180,
            minStock: 200,
            maxStock: 800,
            unit: 'kg',
            supplier: 'Global Coffee Supply',
            lastRestocked: '2026-02-15',
            status: 'low',
            iotEnabled: true,
        },
        {
            id: 'INV-003',
            name: 'Paper Cups (Medium)',
            category: 'Packaging',
            currentStock: 8500,
            minStock: 5000,
            maxStock: 20000,
            unit: 'units',
            supplier: 'PackPro Ltd.',
            lastRestocked: '2026-02-22',
            status: 'healthy',
            iotEnabled: false,
        },
        {
            id: 'INV-004',
            name: 'Espresso Machine Parts',
            category: 'Equipment',
            currentStock: 25,
            minStock: 30,
            maxStock: 100,
            unit: 'units',
            supplier: 'Equipment Express',
            lastRestocked: '2026-02-10',
            status: 'critical',
            iotEnabled: false,
        },
        {
            id: 'INV-005',
            name: 'Milk (Whole)',
            category: 'Perishables',
            currentStock: 350,
            minStock: 200,
            maxStock: 500,
            unit: 'liters',
            supplier: 'Fresh Dairy Co.',
            lastRestocked: '2026-02-25',
            status: 'healthy',
            iotEnabled: true,
        },
    ];
    const stockTrend = [
        { date: '02/18', stock: 520 },
        { date: '02/19', stock: 485 },
        { date: '02/20', stock: 450 },
        { date: '02/21', stock: 420 },
        { date: '02/22', stock: 385 },
        { date: '02/23', stock: 350 },
        { date: '02/24', stock: 320 },
    ];
    const predictiveData = [
        { week: 'Week 1', predicted: 450, actual: 445 },
        { week: 'Week 2', predicted: 420, actual: 425 },
        { week: 'Week 3', predicted: 390, actual: 385 },
        { week: 'Week 4', predicted: 360, actual: null },
    ];
    const reorderSuggestions = [
        {
            item: 'Robusta Coffee Beans',
            currentStock: 180,
            suggestedOrder: 320,
            priority: 'High',
            estimatedRunout: '3 days',
        },
        {
            item: 'Espresso Machine Parts',
            currentStock: 25,
            suggestedOrder: 50,
            priority: 'Critical',
            estimatedRunout: '2 days',
        },
        {
            item: 'Vanilla Syrup',
            currentStock: 45,
            suggestedOrder: 80,
            priority: 'Medium',
            estimatedRunout: '7 days',
        },
    ];
    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'low':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'critical':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory & Supply Chain</h1>
          <p className="text-gray-600 mt-1">IoT-enabled stock tracking and predictive analytics</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4"/>
            Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg">
            <RefreshCw className="w-4 h-4"/>
            Sync IoT Devices
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Package className="w-5 h-5 text-blue-600"/>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{inventoryItems.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600"/>
            </div>
            <div>
              <p className="text-sm text-gray-600">Critical Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {inventoryItems.filter((i) => i.status === 'critical').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Wifi className="w-5 h-5 text-green-600"/>
            </div>
            <div>
              <p className="text-sm text-gray-600">IoT Connected</p>
              <p className="text-2xl font-bold text-gray-900">
                {inventoryItems.filter((i) => i.iotEnabled).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <TrendingDown className="w-5 h-5 text-purple-600"/>
            </div>
            <div>
              <p className="text-sm text-gray-600">Reorder Alerts</p>
              <p className="text-2xl font-bold text-gray-900">{reorderSuggestions.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Stock Level Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Level Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stockTrend}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="date"/>
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="stock" stroke="#d97706" strokeWidth={2}/>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Predictive Analytics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Predictive Stockout Analytics</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={predictiveData}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="week"/>
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="predicted" fill="#6366f1" name="Predicted"/>
              <Bar dataKey="actual" fill="#10b981" name="Actual"/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reorder Suggestions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-amber-600"/>
          <h3 className="text-lg font-semibold text-gray-900">AI-Powered Reorder Suggestions</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {reorderSuggestions.map((suggestion, index) => (<div key={index} className={`p-4 rounded-lg border-l-4 ${suggestion.priority === 'Critical'
                ? 'bg-red-50 border-red-500'
                : suggestion.priority === 'High'
                    ? 'bg-yellow-50 border-yellow-500'
                    : 'bg-blue-50 border-blue-500'}`}>
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{suggestion.item}</h4>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${suggestion.priority === 'Critical'
                ? 'bg-red-200 text-red-800'
                : suggestion.priority === 'High'
                    ? 'bg-yellow-200 text-yellow-800'
                    : 'bg-blue-200 text-blue-800'}`}>
                  {suggestion.priority}
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Current: {suggestion.currentStock} units</p>
                <p>Suggested: {suggestion.suggestedOrder} units</p>
                <p className="text-red-600 font-medium">Runout: {suggestion.estimatedRunout}</p>
              </div>
              <button className="mt-3 w-full px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg transition-colors">
                Create Purchase Order
              </button>
            </div>))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
              <input type="text" placeholder="Search inventory items..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"/>
            </div>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="all">All Categories</option>
              <option value="raw">Raw Materials</option>
              <option value="packaging">Packaging</option>
              <option value="equipment">Equipment</option>
              <option value="perishables">Perishables</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Restocked</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IoT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inventoryItems.map((item) => (<tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.id}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.category}</td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">
                        {item.currentStock} {item.unit}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${item.currentStock < item.minStock
                ? 'bg-red-500'
                : item.currentStock < item.minStock * 1.5
                    ? 'bg-yellow-500'
                    : 'bg-green-500'}`} style={{
                width: `${Math.min((item.currentStock / item.maxStock) * 100, 100)}%`,
            }}></div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Min: {item.minStock} / Max: {item.maxStock}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.supplier}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.lastRestocked}</td>
                  <td className="px-6 py-4">
                    {item.iotEnabled ? (<span className="inline-flex items-center gap-1 text-xs text-green-700">
                        <Wifi className="w-3 h-3"/>
                        Connected
                      </span>) : (<span className="text-xs text-gray-400">Manual</span>)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>
    </div>);
}
