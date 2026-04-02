import { useState } from 'react';
import { Shield, FileText, CheckCircle, XCircle, AlertTriangle, Lock, Eye, Clock, Download, Search, } from 'lucide-react';
export function Compliance() {
    const [selectedAudit, setSelectedAudit] = useState(null);
    const complianceStats = [
        { label: 'Overall Compliance', value: '97.5%', icon: Shield, color: 'bg-green-100 text-green-600' },
        { label: 'Active Audits', value: '12', icon: FileText, color: 'bg-blue-100 text-blue-600' },
        { label: 'Pending Reviews', value: '3', icon: Clock, color: 'bg-yellow-100 text-yellow-600' },
        { label: 'Critical Issues', value: '0', icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
    ];
    const regulations = [
        {
            category: 'Food Safety',
            regulations: [
                { name: 'FDA Food Safety Modernization Act (FSMA)', status: 'Compliant', lastCheck: '2026-02-20' },
                { name: 'HACCP (Hazard Analysis Critical Control Points)', status: 'Compliant', lastCheck: '2026-02-22' },
                { name: 'Local Health Department Standards', status: 'Under Review', lastCheck: '2026-02-24' },
            ],
        },
        {
            category: 'Labor & Employment',
            regulations: [
                { name: 'OSHA Workplace Safety Standards', status: 'Compliant', lastCheck: '2026-02-18' },
                { name: 'Fair Labor Standards Act (FLSA)', status: 'Compliant', lastCheck: '2026-02-21' },
                { name: 'ADA Compliance', status: 'Compliant', lastCheck: '2026-02-19' },
            ],
        },
        {
            category: 'Data Protection',
            regulations: [
                { name: 'GDPR (General Data Protection Regulation)', status: 'Compliant', lastCheck: '2026-02-23' },
                { name: 'CCPA (California Consumer Privacy Act)', status: 'Compliant', lastCheck: '2026-02-25' },
                { name: 'PCI DSS (Payment Card Industry)', status: 'Compliant', lastCheck: '2026-02-24' },
            ],
        },
    ];
    const auditTrail = [
        {
            id: 'AUD-2341',
            action: 'Supplier Approval',
            user: 'John Anderson',
            role: 'Admin',
            franchise: 'Downtown Coffee #12',
            details: 'Approved Premium Beans Co. as supplier',
            timestamp: '2026-02-25 14:32:15',
            ip: '192.168.1.45',
            status: 'success',
        },
        {
            id: 'AUD-2340',
            action: 'Order Modification',
            user: 'Sarah Johnson',
            role: 'Franchise Owner',
            franchise: 'Riverside Brew #08',
            details: 'Modified order ORD-2339 quantity',
            timestamp: '2026-02-25 13:28:42',
            ip: '192.168.1.67',
            status: 'success',
        },
        {
            id: 'AUD-2339',
            action: 'Compliance Check',
            user: 'System',
            role: 'Automated',
            franchise: 'All Locations',
            details: 'Quarterly food safety audit completed',
            timestamp: '2026-02-25 12:00:00',
            ip: 'Internal',
            status: 'success',
        },
        {
            id: 'AUD-2338',
            action: 'Access Attempt',
            user: 'Unknown User',
            role: 'N/A',
            franchise: 'City Center #15',
            details: 'Failed login attempt detected',
            timestamp: '2026-02-25 11:45:23',
            ip: '203.0.113.42',
            status: 'failed',
        },
        {
            id: 'AUD-2337',
            action: 'Data Export',
            user: 'Michael Chen',
            role: 'Manager',
            franchise: 'Harbor View #22',
            details: 'Exported customer transaction report',
            timestamp: '2026-02-25 10:15:08',
            ip: '192.168.1.89',
            status: 'success',
        },
    ];
    const blockchainLedger = [
        {
            block: '#45892',
            hash: '0x7a8f3e2b...',
            timestamp: '2026-02-25 14:32:15',
            transaction: 'Supplier Verification',
            validator: 'Node-12',
            status: 'Confirmed',
        },
        {
            block: '#45891',
            hash: '0x4b9c1d5a...',
            timestamp: '2026-02-25 13:28:42',
            transaction: 'Order Authorization',
            validator: 'Node-08',
            status: 'Confirmed',
        },
        {
            block: '#45890',
            hash: '0x2f6e8a3c...',
            timestamp: '2026-02-25 12:00:00',
            transaction: 'Audit Completion',
            validator: 'Node-15',
            status: 'Confirmed',
        },
    ];
    const accessControls = [
        {
            role: 'Admin',
            users: 8,
            permissions: ['Full System Access', 'User Management', 'Financial Reports', 'Compliance Management', 'API Access'],
        },
        {
            role: 'Franchise Owner',
            users: 48,
            permissions: ['View Own Franchise', 'Place Orders', 'View Reports', 'Customer Management'],
        },
        {
            role: 'Supplier',
            users: 23,
            permissions: ['View Assigned Orders', 'Update Order Status', 'Upload Documents'],
        },
        {
            role: 'Customer',
            users: 24567,
            permissions: ['View Profile', 'Redeem Rewards', 'View Transaction History'],
        },
    ];
    const getStatusColor = (status) => {
        switch (status) {
            case 'Compliant':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'Under Review':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Non-Compliant':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compliance & Governance</h1>
          <p className="text-gray-600 mt-1">Food safety, blockchain audit trails, and access control</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4"/>
            Export Audit Log
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg">
            <FileText className="w-4 h-4"/>
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {complianceStats.map((stat, index) => {
            const Icon = stat.icon;
            return (<div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className={`${stat.color} p-2 rounded-lg`}>
                  <Icon className="w-5 h-5"/>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>);
        })}
      </div>

      {/* Compliance Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-amber-600"/>
          <h3 className="text-lg font-semibold text-gray-900">Regulatory Compliance Status</h3>
        </div>

        <div className="space-y-6">
          {regulations.map((category, categoryIndex) => (<div key={categoryIndex}>
              <h4 className="font-semibold text-gray-900 mb-3">{category.category}</h4>
              <div className="space-y-2">
                {category.regulations.map((reg, regIndex) => (<div key={regIndex} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      {reg.status === 'Compliant' ? (<CheckCircle className="w-5 h-5 text-green-600"/>) : reg.status === 'Under Review' ? (<Clock className="w-5 h-5 text-yellow-600"/>) : (<XCircle className="w-5 h-5 text-red-600"/>)}
                      <div>
                        <p className="font-medium text-gray-900">{reg.name}</p>
                        <p className="text-sm text-gray-500">Last checked: {reg.lastCheck}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(reg.status)}`}>
                      {reg.status}
                    </span>
                  </div>))}
              </div>
            </div>))}
        </div>
      </div>

      {/* Blockchain Audit Ledger */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-600"/>
            <h3 className="text-lg font-semibold text-gray-900">Blockchain Audit Ledger</h3>
          </div>
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            Immutable Record
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Block</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hash</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validator</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {blockchainLedger.map((block, index) => (<tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono font-medium text-blue-600">{block.block}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{block.hash}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{block.timestamp}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{block.transaction}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{block.validator}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      {block.status}
                    </span>
                  </td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Trail */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Audit Trail</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
              <input type="text" placeholder="Search audit logs..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"/>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {auditTrail.map((audit) => (<div key={audit.id} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSelectedAudit(selectedAudit === audit.id ? null : audit.id)}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${audit.status === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {audit.status === 'success' ? (<CheckCircle className="w-4 h-4 text-green-600"/>) : (<XCircle className="w-4 h-4 text-red-600"/>)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{audit.action}</p>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{audit.id}</span>
                    </div>
                    <p className="text-sm text-gray-600">{audit.details}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>User: {audit.user}</span>
                      <span>•</span>
                      <span>Role: {audit.role}</span>
                      <span>•</span>
                      <span>Location: {audit.franchise}</span>
                    </div>
                    {selectedAudit === audit.id && (<div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
                        <p className="text-gray-600">
                          <span className="font-medium">Timestamp:</span> {audit.timestamp}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">IP Address:</span> {audit.ip}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Status:</span>{' '}
                          <span className={audit.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                            {audit.status.toUpperCase()}
                          </span>
                        </p>
                      </div>)}
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600 p-1">
                  <Eye className="w-4 h-4"/>
                </button>
              </div>
            </div>))}
        </div>
      </div>

      {/* Role-Based Access Control */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Lock className="w-5 h-5 text-amber-600"/>
          <h3 className="text-lg font-semibold text-gray-900">Role-Based Access Control</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {accessControls.map((control, index) => (<div key={index} className="p-4 border-2 border-gray-200 rounded-lg hover:border-amber-600 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{control.role}</h4>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  {control.users.toLocaleString()} users
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium mb-2">Permissions:</p>
                {control.permissions.map((permission, permIndex) => (<div key={permIndex} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600"/>
                    <span className="text-sm text-gray-700">{permission}</span>
                  </div>))}
              </div>
            </div>))}
        </div>
      </div>
    </div>);
}
