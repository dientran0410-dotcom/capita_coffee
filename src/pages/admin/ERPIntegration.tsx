import { useState } from 'react';
import { Database, CreditCard, CheckCircle, TrendingUp, Settings, Cloud, Activity, DollarSign, FileText, AlertCircle, } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
export function ERPIntegration() {
    const [activeTab, setActiveTab] = useState('overview');
    const integrationStatus = [
        { system: 'SAP ERP', status: 'Connected', uptime: 99.8, lastSync: '2 min ago', color: 'green' },
        { system: 'Oracle Financials', status: 'Connected', uptime: 99.5, lastSync: '5 min ago', color: 'green' },
        { system: 'Square POS', status: 'Connected', uptime: 99.9, lastSync: '1 min ago', color: 'green' },
        { system: 'Toast POS', status: 'Syncing', uptime: 98.2, lastSync: 'In progress', color: 'yellow' },
        { system: 'QuickBooks', status: 'Connected', uptime: 99.6, lastSync: '3 min ago', color: 'green' },
        { system: 'Legacy System', status: 'Error', uptime: 85.3, lastSync: '2 hours ago', color: 'red' },
    ];
    const financialData = [
        { month: 'Jan', revenue: 185000, expenses: 120000, profit: 65000 },
        { month: 'Feb', revenue: 210000, expenses: 135000, profit: 75000 },
        { month: 'Mar', revenue: 195000, expenses: 128000, profit: 67000 },
        { month: 'Apr', revenue: 240000, expenses: 155000, profit: 85000 },
        { month: 'May', revenue: 225000, expenses: 145000, profit: 80000 },
        { month: 'Jun', revenue: 260000, expenses: 165000, profit: 95000 },
    ];
    const transactionData = [
        { type: 'Credit Card', count: 8542, amount: 425100 },
        { type: 'Debit Card', count: 6321, amount: 316050 },
        { type: 'Cash', count: 2156, amount: 107800 },
        { type: 'Mobile Payment', count: 4892, amount: 244600 },
        { type: 'Gift Card', count: 1234, amount: 61700 },
    ];
    const recentTransactions = [
        {
            id: 'TXN-8542',
            franchise: 'Downtown Coffee #12',
            type: 'Sale',
            amount: 245.50,
            method: 'Credit Card',
            status: 'Completed',
            date: '2026-02-25 14:32',
        },
        {
            id: 'TXN-8541',
            franchise: 'Riverside Brew #08',
            type: 'Refund',
            amount: -18.75,
            method: 'Credit Card',
            status: 'Processed',
            date: '2026-02-25 14:28',
        },
        {
            id: 'TXN-8540',
            franchise: 'City Center #15',
            type: 'Sale',
            amount: 412.30,
            method: 'Mobile Payment',
            status: 'Completed',
            date: '2026-02-25 14:25',
        },
        {
            id: 'TXN-8539',
            franchise: 'Harbor View #22',
            type: 'Sale',
            amount: 89.00,
            method: 'Cash',
            status: 'Reconciled',
            date: '2026-02-25 14:20',
        },
    ];
    const setupWizardSteps = [
        { step: 'Connect POS System', status: 'completed', description: 'Link your point of sale terminal' },
        { step: 'Configure Payment Gateway', status: 'completed', description: 'Set up payment processing' },
        { step: 'Map Chart of Accounts', status: 'completed', description: 'Configure accounting categories' },
        { step: 'Set Tax Rules', status: 'in-progress', description: 'Define tax calculation rules' },
        { step: 'Test Transactions', status: 'pending', description: 'Verify system integration' },
        { step: 'Go Live', status: 'pending', description: 'Activate for production use' },
    ];
    const slaMetrics = [
        { metric: 'System Uptime', current: 99.7, target: 99.5, status: 'healthy' },
        { metric: 'Transaction Speed', current: 1.2, target: 2.0, status: 'healthy', unit: 'sec' },
        { metric: 'Sync Frequency', current: 2, target: 5, status: 'healthy', unit: 'min' },
        { metric: 'Error Rate', current: 0.3, target: 1.0, status: 'healthy', unit: '%' },
    ];
    const getStatusColor = (status) => {
        switch (status) {
            case 'Connected':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'Syncing':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Error':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ERP & POS Integration</h1>
          <p className="text-gray-600 mt-1">Financial reporting and system integration</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg">
          <Settings className="w-4 h-4"/>
          Configure Systems
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600"/>
            </div>
            <div>
              <p className="text-sm text-gray-600">Connected Systems</p>
              <p className="text-2xl font-bold text-gray-900">
                {integrationStatus.filter((s) => s.status === 'Connected').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600"/>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Uptime</p>
              <p className="text-2xl font-bold text-gray-900">99.7%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <CreditCard className="w-5 h-5 text-purple-600"/>
            </div>
            <div>
              <p className="text-sm text-gray-600">Transactions Today</p>
              <p className="text-2xl font-bold text-gray-900">3,245</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600"/>
            </div>
            <div>
              <p className="text-sm text-gray-600">System Errors</p>
              <p className="text-2xl font-bold text-gray-900">
                {integrationStatus.filter((s) => s.status === 'Error').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex gap-6 px-6">
            {['overview', 'financial', 'transactions', 'pos-setup', 'monitoring'].map((tab) => (<button key={tab} onClick={() => setActiveTab(tab)} className={`py-4 border-b-2 transition-colors capitalize ${activeTab === tab
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {tab.replace('-', ' ')}
              </button>))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (<div className="space-y-6">
              {/* Integration Status */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Integration Status</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {integrationStatus.map((system, index) => (<div key={index} className="p-4 border-2 rounded-lg hover:shadow-md transition-shadow" style={{
                    borderColor: system.color === 'green' ? '#10b981' : system.color === 'yellow' ? '#f59e0b' : '#ef4444',
                }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Database className="w-5 h-5 text-gray-600"/>
                          <h4 className="font-semibold text-gray-900">{system.system}</h4>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(system.status)}`}>
                          {system.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Uptime:</span>
                          <span className="font-medium text-gray-900">{system.uptime}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Sync:</span>
                          <span className="font-medium text-gray-900">{system.lastSync}</span>
                        </div>
                      </div>
                    </div>))}
                </div>
              </div>
            </div>)}

          {activeTab === 'financial' && (<div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Financial Reporting</h3>
              
              {/* Summary Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-6 h-6 text-green-600"/>
                    <p className="text-sm text-green-700">Total Revenue (YTD)</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">$1,315,000</p>
                  <p className="text-sm text-green-700 mt-2">+18.5% vs last year</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-6 h-6 text-red-600"/>
                    <p className="text-sm text-red-700">Total Expenses (YTD)</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">$848,000</p>
                  <p className="text-sm text-red-700 mt-2">64.5% of revenue</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-6 h-6 text-blue-600"/>
                    <p className="text-sm text-blue-700">Net Profit (YTD)</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">$467,000</p>
                  <p className="text-sm text-blue-700 mt-2">35.5% margin</p>
                </div>
              </div>

              {/* Financial Chart */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Revenue, Expenses & Profit Trend</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={financialData}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="month"/>
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue"/>
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses"/>
                    <Line type="monotone" dataKey="profit" stroke="#6366f1" strokeWidth={2} name="Profit"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>)}

          {activeTab === 'transactions' && (<div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Transaction Reconciliation</h3>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                  Export Report
                </button>
              </div>

              {/* Transaction Summary */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Payment Method Distribution</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={transactionData}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="type"/>
                    <YAxis yAxisId="left" orientation="left" stroke="#d97706"/>
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981"/>
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" fill="#d97706" name="Count"/>
                    <Bar yAxisId="right" dataKey="amount" fill="#10b981" name="Amount ($)"/>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Recent Transactions Table */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Recent Transactions</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Franchise</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {recentTransactions.map((txn) => (<tr key={txn.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{txn.id}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{txn.franchise}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{txn.type}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            ${Math.abs(txn.amount).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{txn.method}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              {txn.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{txn.date}</td>
                        </tr>))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>)}

          {activeTab === 'pos-setup' && (<div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">POS Setup Wizard</h3>
                <p className="text-gray-600">Configure your point of sale system integration</p>
              </div>

              <div className="space-y-3">
                {setupWizardSteps.map((step, index) => (<div key={index} className={`p-4 rounded-lg border-l-4 ${step.status === 'completed'
                    ? 'bg-green-50 border-green-500'
                    : step.status === 'in-progress'
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-gray-300'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {step.status === 'completed' ? (<CheckCircle className="w-5 h-5 text-green-600"/>) : step.status === 'in-progress' ? (<Activity className="w-5 h-5 text-blue-600 animate-pulse"/>) : (<div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>)}
                        <div>
                          <h4 className="font-semibold text-gray-900">{step.step}</h4>
                          <p className="text-sm text-gray-600">{step.description}</p>
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

          {activeTab === 'monitoring' && (<div className="space-y-6">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-amber-600"/>
                <h3 className="text-lg font-semibold text-gray-900">Cloud Monitoring & SLA Tracking</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {slaMetrics.map((metric, index) => (<div key={index} className="p-6 border-2 border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">{metric.metric}</h4>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Healthy
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-sm text-gray-600">Current</span>
                        <span className="text-2xl font-bold text-gray-900">
                          {metric.current}
                          {metric.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{
                    width: `${Math.min((metric.current / metric.target) * 100, 100)}%`,
                }}></div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Target: {metric.target}{metric.unit}</span>
                        <span className="text-green-600 font-medium">Above Target</span>
                      </div>
                    </div>
                  </div>))}
              </div>
            </div>)}
        </div>
      </div>
    </div>);
}
