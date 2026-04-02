import { useState } from 'react';
import { Package, AlertTriangle, CheckCircle, RefreshCw, Search, Plus, ShoppingCart, } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, } from 'recharts';
export function StoreInventory() {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const inventoryItems = [
        {
            id: 'INV-001',
            name: 'Arabica Coffee Beans',
            category: 'Beans',
            current: 32,
            min: 20,
            max: 100,
            unit: 'kg',
            status: 'healthy',
            lastRestocked: '2026-03-07',
        },
        {
            id: 'INV-002',
            name: 'Whole Milk',
            category: 'Dairy',
            current: 15,
            min: 30,
            max: 100,
            unit: 'liters',
            status: 'low',
            lastRestocked: '2026-03-08',
        },
        {
            id: 'INV-003',
            name: 'Oat Milk',
            category: 'Dairy',
            current: 22,
            min: 15,
            max: 60,
            unit: 'liters',
            status: 'healthy',
            lastRestocked: '2026-03-07',
        },
        {
            id: 'INV-004',
            name: 'Paper Cups (Medium)',
            category: 'Packaging',
            current: 380,
            min: 500,
            max: 2000,
            unit: 'units',
            status: 'critical',
            lastRestocked: '2026-03-05',
        },
        {
            id: 'INV-005',
            name: 'Paper Cups (Large)',
            category: 'Packaging',
            current: 720,
            min: 400,
            max: 2000,
            unit: 'units',
            status: 'healthy',
            lastRestocked: '2026-03-07',
        },
        {
            id: 'INV-006',
            name: 'Vanilla Syrup',
            category: 'Syrups',
            current: 4,
            min: 5,
            max: 20,
            unit: 'bottles',
            status: 'low',
            lastRestocked: '2026-03-01',
        },
        {
            id: 'INV-007',
            name: 'Caramel Syrup',
            category: 'Syrups',
            current: 8,
            min: 5,
            max: 20,
            unit: 'bottles',
            status: 'healthy',
            lastRestocked: '2026-03-01',
        },
        {
            id: 'INV-008',
            name: 'Sugar Sachets',
            category: 'Supplies',
            current: 1200,
            min: 800,
            max: 3000,
            unit: 'pcs',
            status: 'healthy',
            lastRestocked: '2026-03-06',
        },
    ];
    const stockTrend = [
        { date: '03/03', stock: 45 },
        { date: '03/04', stock: 42 },
        { date: '03/05', stock: 40 },
        { date: '03/06', stock: 38 },
        { date: '03/07', stock: 36 },
        { date: '03/08', stock: 34 },
        { date: '03/09', stock: 32 },
    ];
    const categories = ['all', 'Beans', 'Dairy', 'Packaging', 'Syrups', 'Supplies'];
    const statusConfig = {
        healthy: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Healthy' },
        low: { color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle, label: 'Low Stock' },
        critical: { color: 'bg-red-100 text-red-700', icon: AlertTriangle, label: 'Critical' },
    };
    const filtered = inventoryItems.filter((item) => {
        const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
        const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCat && matchSearch;
    });
    const healthyCount = inventoryItems.filter((i) => i.status === 'healthy').length;
    const lowCount = inventoryItems.filter((i) => i.status === 'low').length;
    const criticalCount = inventoryItems.filter((i) => i.status === 'critical').length;
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Inventory</h1>
          <p className="text-gray-600 mt-1">Riverside Brew #08 — Real-time stock levels</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors text-sm">
            <RefreshCw className="w-4 h-4"/>
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors text-sm">
            <ShoppingCart className="w-4 h-4"/>
            Request Restock
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600"/>
          </div>
          <div>
            <p className="text-sm text-gray-600">Healthy</p>
            <p className="text-2xl font-bold text-gray-900">{healthyCount} items</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className="bg-yellow-100 p-3 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-yellow-600"/>
          </div>
          <div>
            <p className="text-sm text-gray-600">Low Stock</p>
            <p className="text-2xl font-bold text-gray-900">{lowCount} items</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600"/>
          </div>
          <div>
            <p className="text-sm text-gray-600">Critical</p>
            <p className="text-2xl font-bold text-gray-900">{criticalCount} items</p>
          </div>
        </div>
      </div>

      {/* Coffee Bean Trend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Arabica Bean Stock Trend (7 Days)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={stockTrend}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="date"/>
            <YAxis unit=" kg"/>
            <Tooltip formatter={(v) => [`${v} kg`, 'Stock']}/>
            <Line type="monotone" dataKey="stock" stroke="#d97706" strokeWidth={2} dot={{ r: 4 }}/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input type="text" placeholder="Search items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"/>
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (<button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${selectedCategory === cat
                ? 'bg-amber-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {cat}
            </button>))}
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Item</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Category</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Stock Level</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Last Restocked</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
            const sc = statusConfig[item.status];
            const StatusIcon = sc.icon;
            const pct = Math.min((item.current / item.max) * 100, 100);
            let barColor = 'bg-red-500';
            if (item.status === 'healthy')
                barColor = 'bg-green-500';
            else if (item.status === 'low')
                barColor = 'bg-yellow-500';
            return (<tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400"/>
                      {item.name}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{item.category}</td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{item.current} {item.unit}</span>
                        <span>Max: {item.max}</span>
                      </div>
                      <div className="w-32 bg-gray-200 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }}/>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`flex items-center gap-1 w-fit px-2 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                      <StatusIcon className="w-3 h-3"/>
                      {sc.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{item.lastRestocked}</td>
                  <td className="py-3 px-4">
                    <button className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">
                      <Plus className="w-3 h-3"/>
                      Reorder
                    </button>
                  </td>
                </tr>);
        })}
          </tbody>
        </table>
        {filtered.length === 0 && (<div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300"/>
            <p>No items found.</p>
          </div>)}
      </div>
    </div>);
}
