import { useState } from 'react';
import { Store, TrendingUp, DollarSign, Plus, Eye, CheckCircle, Clock, BarChart3, } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
export function FranchiseOperations() {
    const [activeTab, setActiveTab] = useState('overview');
    const franchises = [
        {
            id: 'FR-012',
            name: 'Downtown Coffee #12',
            owner: 'Sarah Johnson',
            location: 'New York, NY',
            status: 'Active',
            performance: 98,
            revenue: 145000,
            contractStatus: 'Active',
            contractExpiry: '2027-12-31',
            onboardingComplete: true,
        },
        {
            id: 'FR-008',
            name: 'Riverside Brew #08',
            owner: 'Michael Chen',
            location: 'Los Angeles, CA',
            status: 'Active',
            performance: 95,
            revenue: 132000,
            contractStatus: 'Active',
            contractExpiry: '2028-06-30',
            onboardingComplete: true,
        },
        {
            id: 'FR-015',
            name: 'City Center #15',
            owner: 'Emily Rodriguez',
            location: 'Chicago, IL',
            status: 'Active',
            performance: 92,
            revenue: 158000,
            contractStatus: 'Active',
            contractExpiry: '2027-09-15',
            onboardingComplete: true,
        },
        {
            id: 'FR-022',
            name: 'Harbor View #22',
            owner: 'David Park',
            location: 'Seattle, WA',
            status: 'Onboarding',
            performance: 0,
            revenue: 0,
            contractStatus: 'Pending',
            contractExpiry: '2029-03-01',
            onboardingComplete: false,
        },
    ];
    const performanceData = [
        { month: 'Jan', sales: 125000, compliance: 96 },
        { month: 'Feb', sales: 135000, compliance: 97 },
        { month: 'Mar', sales: 142000, compliance: 95 },
        { month: 'Apr', sales: 155000, compliance: 98 },
        { month: 'May', sales: 148000, compliance: 96 },
        { month: 'Jun', sales: 162000, compliance: 99 },
    ];
    const regionalData = [
        { region: 'North', franchises: 12, revenue: 1850000 },
        { region: 'South', franchises: 10, revenue: 1520000 },
        { region: 'East', franchises: 15, revenue: 2150000 },
        { region: 'West', franchises: 11, revenue: 1680000 },
    ];
    const onboardingSteps = [
        { step: 'Contract Signing', status: 'completed', date: '2026-02-10' },
        { step: 'Legal Documentation', status: 'completed', date: '2026-02-15' },
        { step: 'Location Setup', status: 'in-progress', date: 'In Progress' },
        { step: 'Staff Training', status: 'pending', date: 'Pending' },
        { step: 'Systems Integration', status: 'pending', date: 'Pending' },
        { step: 'Grand Opening', status: 'pending', date: 'Scheduled: 2026-03-15' },
    ];
    const pricingTiers = [
        {
            name: 'Standard',
            description: 'Basic coffee menu items',
            basePrice: 4.5,
            dynamicAdjustment: '+0.50',
            currentPrice: 5.0,
        },
        {
            name: 'Premium',
            description: 'Specialty coffee drinks',
            basePrice: 6.5,
            dynamicAdjustment: '+0.75',
            currentPrice: 7.25,
        },
        {
            name: 'Seasonal',
            description: 'Limited time offerings',
            basePrice: 7.0,
            dynamicAdjustment: '+1.00',
            currentPrice: 8.0,
        },
    ];
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Franchise Operations</h1>
          <p className="text-gray-600 mt-1">Manage contracts, pricing, and franchise performance</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg">
          <Plus className="w-4 h-4"/>
          Add New Franchise
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Store className="w-5 h-5 text-blue-600"/>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Franchises</p>
              <p className="text-2xl font-bold text-gray-900">{franchises.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600"/>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {franchises.filter((f) => f.status === 'Active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600"/>
            </div>
            <div>
              <p className="text-sm text-gray-600">Onboarding</p>
              <p className="text-2xl font-bold text-gray-900">
                {franchises.filter((f) => f.status === 'Onboarding').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600"/>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Performance</p>
              <p className="text-2xl font-bold text-gray-900">95%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex gap-6 px-6">
            {['overview', 'contracts', 'pricing', 'onboarding', 'analytics'].map((tab) => (<button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 border-b-2 transition-colors capitalize ${activeTab === tab
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab}
              </button>))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (<div className="space-y-6">
              {/* Franchise List */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Franchise</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {franchises.map((franchise) => (<tr key={franchise.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <p className="font-medium text-gray-900">{franchise.name}</p>
                          <p className="text-xs text-gray-500">{franchise.id}</p>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">{franchise.owner}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{franchise.location}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${franchise.performance}%` }}></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{franchise.performance}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                          ${franchise.revenue.toLocaleString()}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${franchise.status === 'Active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'}`}>
                            {franchise.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button className="text-amber-600 hover:text-amber-700 p-2 hover:bg-amber-50 rounded-lg">
                            <Eye className="w-4 h-4"/>
                          </button>
                        </td>
                      </tr>))}
                  </tbody>
                </table>
              </div>

              {/* Regional Distribution */}
              <div className="grid lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Distribution</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={regionalData}>
                      <CartesianGrid strokeDasharray="3 3"/>
                      <XAxis dataKey="region"/>
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="franchises" fill="#d97706" name="Franchises"/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trend</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3"/>
                      <XAxis dataKey="month"/>
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} name="Sales ($)"/>
                      <Line type="monotone" dataKey="compliance" stroke="#6366f1" strokeWidth={2} name="Compliance (%)"/>
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>)}

          {activeTab === 'contracts' && (<div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Contract Management</h3>
                <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm">
                  Generate Contract
                </button>
              </div>
              {franchises.map((franchise) => (<div key={franchise.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{franchise.name}</h4>
                      <p className="text-sm text-gray-600">{franchise.owner}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span className="text-gray-500">
                          Status: <span className="font-medium text-gray-900">{franchise.contractStatus}</span>
                        </span>
                        <span className="text-gray-500">
                          Expiry: <span className="font-medium text-gray-900">{franchise.contractExpiry}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                        View Contract
                      </button>
                      <button className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm">
                        Renew
                      </button>
                    </div>
                  </div>
                </div>))}
            </div>)}

          {activeTab === 'pricing' && (<div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Dynamic Pricing Tools</h3>
                <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm">
                  Update Pricing
                </button>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {pricingTiers.map((tier, index) => (<div key={index} className="p-6 border-2 border-gray-200 rounded-xl hover:border-amber-600 transition-colors">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{tier.name}</h4>
                    <p className="text-sm text-gray-600 mb-4">{tier.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Base Price:</span>
                        <span className="font-medium text-gray-900">${tier.basePrice}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Dynamic Adj:</span>
                        <span className="font-medium text-green-600">{tier.dynamicAdjustment}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-900">Current Price:</span>
                          <span className="text-xl font-bold text-amber-600">${tier.currentPrice}</span>
                        </div>
                      </div>
                    </div>
                  </div>))}
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>AI-Powered Pricing:</strong> Prices are automatically adjusted based on demand, competition, location, and market trends.
                </p>
              </div>
            </div>)}

          {activeTab === 'onboarding' && (<div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">New Franchise Onboarding</h3>
                <p className="text-sm text-gray-600">Harbor View #22 - In Progress</p>
              </div>
              <div className="space-y-3">
                {onboardingSteps.map((step, index) => (<div key={index} className={`p-4 rounded-lg border-l-4 ${step.status === 'completed'
                    ? 'bg-green-50 border-green-500'
                    : step.status === 'in-progress'
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-gray-300'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {step.status === 'completed' ? (<CheckCircle className="w-5 h-5 text-green-600"/>) : step.status === 'in-progress' ? (<Clock className="w-5 h-5 text-blue-600"/>) : (<div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>)}
                        <div>
                          <h4 className="font-semibold text-gray-900">{step.step}</h4>
                          <p className="text-sm text-gray-600">{step.date}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${step.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : step.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'}`}>
                        {step.status.replace('-', ' ')}
                      </span>
                    </div>
                  </div>))}
              </div>
            </div>)}

          {activeTab === 'analytics' && (<div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Analytics</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-8 h-8 text-green-600"/>
                    <div>
                      <p className="text-sm text-green-700">Total Revenue</p>
                      <p className="text-3xl font-bold text-gray-900">$7.2M</p>
                    </div>
                  </div>
                  <p className="text-sm text-green-700">+15.3% from last quarter</p>
                </div>

                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="w-8 h-8 text-blue-600"/>
                    <div>
                      <p className="text-sm text-blue-700">Avg Performance Score</p>
                      <p className="text-3xl font-bold text-gray-900">95.2%</p>
                    </div>
                  </div>
                  <p className="text-sm text-blue-700">Above industry standard</p>
                </div>
              </div>
            </div>)}
        </div>
      </div>
    </div>);
}
