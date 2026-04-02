import { useState } from 'react';
import { Settings as SettingsIcon, Globe, Bell, Lock, Database, Key, Users, Mail, Palette, Zap, Save, } from 'lucide-react';
export function Settings() {
    const [activeTab, setActiveTab] = useState('general');
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        sms: false,
        orderAlerts: true,
        stockAlerts: true,
        complianceAlerts: true,
    });
    const [language, setLanguage] = useState('en');
    const [timezone, setTimezone] = useState('America/New_York');
    const [currency, setCurrency] = useState('USD');
    const apiEndpoints = [
        {
            name: 'Order Management API',
            endpoint: 'https://api.capitalcoffee.com/v1/orders',
            status: 'Active',
            requests: '24.5K/day',
        },
        {
            name: 'Inventory API',
            endpoint: 'https://api.capitalcoffee.com/v1/inventory',
            status: 'Active',
            requests: '18.2K/day',
        },
        {
            name: 'Customer Loyalty API',
            endpoint: 'https://api.capitalcoffee.com/v1/loyalty',
            status: 'Active',
            requests: '32.8K/day',
        },
        {
            name: 'Compliance API',
            endpoint: 'https://api.capitalcoffee.com/v1/compliance',
            status: 'Active',
            requests: '5.1K/day',
        },
    ];
    const languages = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Español' },
        { code: 'fr', name: 'Français' },
        { code: 'de', name: 'Deutsch' },
        { code: 'pt', name: 'Português' },
        { code: 'zh', name: '中文' },
        { code: 'ja', name: '日本語' },
    ];
    const systemUsers = [
        { name: 'John Anderson', email: 'john.anderson@capitalcoffee.com', role: 'Admin', status: 'Active' },
        { name: 'Sarah Johnson', email: 'sarah.j@capitalcoffee.com', role: 'Franchise Owner', status: 'Active' },
        { name: 'Michael Chen', email: 'michael.c@capitalcoffee.com', role: 'Manager', status: 'Active' },
        { name: 'Emily Rodriguez', email: 'emily.r@capitalcoffee.com', role: 'Franchise Owner', status: 'Active' },
    ];
    return (<div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings & Administration</h1>
        <p className="text-gray-600 mt-1">Configure system preferences and manage users</p>
      </div>

      {/* Settings Container */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-6 px-6 overflow-x-auto">
            {[
            { id: 'general', label: 'General', icon: SettingsIcon },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'api', label: 'API Management', icon: Key },
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'security', label: 'Security', icon: Lock },
            { id: 'system', label: 'System', icon: Database },
        ].map((tab) => {
            const Icon = tab.icon;
            return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-4 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  <Icon className="w-4 h-4"/>
                  {tab.label}
                </button>);
        })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'general' && (<div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">General Settings</h3>

                {/* Language */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Globe className="w-4 h-4 inline mr-2"/>
                      Language
                    </label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                      {languages.map((lang) => (<option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                    <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="Europe/London">GMT</option>
                      <option value="Europe/Paris">CET</option>
                      <option value="Asia/Tokyo">JST</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Palette className="w-4 h-4 inline mr-2"/>
                      Theme
                    </label>
                    <div className="flex gap-4">
                      <button className="px-4 py-2 bg-amber-600 text-white rounded-lg">Light</button>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        Dark
                      </button>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                        Auto
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg">
                  <Save className="w-4 h-4"/>
                  Save Changes
                </button>
              </div>
            </div>)}

          {activeTab === 'notifications' && (<div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>

                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Notification Channels</h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-gray-600"/>
                          <div>
                            <p className="font-medium text-gray-900">Email Notifications</p>
                            <p className="text-sm text-gray-600">Receive notifications via email</p>
                          </div>
                        </div>
                        <input type="checkbox" checked={notifications.email} onChange={(e) => setNotifications({ ...notifications, email: e.target.checked })} className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"/>
                      </label>

                      <label className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Bell className="w-5 h-5 text-gray-600"/>
                          <div>
                            <p className="font-medium text-gray-900">Push Notifications</p>
                            <p className="text-sm text-gray-600">Receive browser push notifications</p>
                          </div>
                        </div>
                        <input type="checkbox" checked={notifications.push} onChange={(e) => setNotifications({ ...notifications, push: e.target.checked })} className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"/>
                      </label>

                      <label className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mail className="w-5 h-5 text-gray-600"/>
                          <div>
                            <p className="font-medium text-gray-900">SMS Notifications</p>
                            <p className="text-sm text-gray-600">Receive text message alerts</p>
                          </div>
                        </div>
                        <input type="checkbox" checked={notifications.sms} onChange={(e) => setNotifications({ ...notifications, sms: e.target.checked })} className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"/>
                      </label>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Alert Types</h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between">
                        <span className="text-gray-900">Order Alerts</span>
                        <input type="checkbox" checked={notifications.orderAlerts} onChange={(e) => setNotifications({ ...notifications, orderAlerts: e.target.checked })} className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"/>
                      </label>

                      <label className="flex items-center justify-between">
                        <span className="text-gray-900">Stock Alerts</span>
                        <input type="checkbox" checked={notifications.stockAlerts} onChange={(e) => setNotifications({ ...notifications, stockAlerts: e.target.checked })} className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"/>
                      </label>

                      <label className="flex items-center justify-between">
                        <span className="text-gray-900">Compliance Alerts</span>
                        <input type="checkbox" checked={notifications.complianceAlerts} onChange={(e) => setNotifications({ ...notifications, complianceAlerts: e.target.checked })} className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"/>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg">
                  <Save className="w-4 h-4"/>
                  Save Preferences
                </button>
              </div>
            </div>)}

          {activeTab === 'api' && (<div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">API Management</h3>

                <div className="space-y-4">
                  {apiEndpoints.map((api, index) => (<div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{api.name}</h4>
                          <p className="text-sm text-gray-600 font-mono mt-1">{api.endpoint}</p>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          {api.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Requests: {api.requests}</span>
                        <button className="text-amber-600 hover:text-amber-700 font-medium">View Docs</button>
                        <button className="text-amber-600 hover:text-amber-700 font-medium">Generate Key</button>
                      </div>
                    </div>))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Key className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"/>
                    <div>
                      <p className="font-medium text-blue-900">API Key Management</p>
                      <p className="text-sm text-blue-700 mt-1">
                        Use API keys to authenticate requests to the Capital Coffee API. Keep your keys secure and
                        rotate them regularly.
                      </p>
                      <button className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg">
                        Generate New API Key
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>)}

          {activeTab === 'users' && (<div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm">
                  Add New User
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {systemUsers.map((user, index) => (<tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.role}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-amber-600 hover:text-amber-700 text-sm font-medium mr-3">
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-700 text-sm font-medium">Disable</button>
                        </td>
                      </tr>))}
                  </tbody>
                </table>
              </div>
            </div>)}

          {activeTab === 'security' && (<div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>

                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Add an extra layer of security to your account
                    </p>
                    <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg">
                      Enable 2FA
                    </button>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Password Policy</h4>
                    <div className="space-y-2 text-sm">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked className="w-4 h-4 text-amber-600 rounded" readOnly/>
                        <span>Minimum 8 characters</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked className="w-4 h-4 text-amber-600 rounded" readOnly/>
                        <span>Require uppercase and lowercase</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked className="w-4 h-4 text-amber-600 rounded" readOnly/>
                        <span>Require numbers</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked className="w-4 h-4 text-amber-600 rounded" readOnly/>
                        <span>Require special characters</span>
                      </label>
                    </div>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Session Management</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Automatically log out inactive users after:
                    </p>
                    <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                      <option>15 minutes</option>
                      <option>30 minutes</option>
                      <option>1 hour</option>
                      <option>4 hours</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>)}

          {activeTab === 'system' && (<div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Configuration</h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-6 border-2 border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <Database className="w-6 h-6 text-blue-600"/>
                      <h4 className="font-semibold text-gray-900">Database Status</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="text-green-600 font-medium">Connected</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Storage Used:</span>
                        <span className="font-medium">142 GB / 500 GB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Connections:</span>
                        <span className="font-medium">87 / 200</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-2 border-gray-200 rounded-xl">
                    <div className="flex items-center gap-3 mb-4">
                      <Zap className="w-6 h-6 text-yellow-600"/>
                      <h4 className="font-semibold text-gray-900">Performance</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Avg Response Time:</span>
                        <span className="font-medium">142ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Uptime:</span>
                        <span className="text-green-600 font-medium">99.97%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">CPU Usage:</span>
                        <span className="font-medium">34%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"/>
                    <div>
                      <p className="font-medium text-amber-900">Scalability Options</p>
                      <p className="text-sm text-amber-700 mt-1">
                        System automatically scales to handle increased load. Current plan supports up to 100 franchises
                        and 1M transactions/month.
                      </p>
                      <button className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg">
                        Upgrade Plan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>)}
        </div>
      </div>
    </div>);
}
