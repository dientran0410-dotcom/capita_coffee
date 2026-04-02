import { useState } from 'react';
import { Users, Plus, Search, Phone, Mail, Clock, CheckCircle, XCircle, Edit, Star, } from 'lucide-react';
export function StaffManagement() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const staff = [
        {
            id: 'ST-001',
            name: 'Anna Nguyen',
            role: 'Barista',
            status: 'On Shift',
            phone: '+1 (555) 201-1122',
            email: 'anna.n@capitalcoffee.com',
            hireDate: '2024-06-01',
            rating: 4.9,
            hoursThisWeek: 32,
            avatar: 'AN',
        },
        {
            id: 'ST-002',
            name: 'James Park',
            role: 'Senior Barista',
            status: 'On Shift',
            phone: '+1 (555) 201-3344',
            email: 'james.p@capitalcoffee.com',
            hireDate: '2023-03-15',
            rating: 4.7,
            hoursThisWeek: 38,
            avatar: 'JP',
        },
        {
            id: 'ST-003',
            name: 'Lena Torres',
            role: 'Cashier',
            status: 'Off Shift',
            phone: '+1 (555) 201-5566',
            email: 'lena.t@capitalcoffee.com',
            hireDate: '2025-01-10',
            rating: 4.5,
            hoursThisWeek: 24,
            avatar: 'LT',
        },
        {
            id: 'ST-004',
            name: 'Kevin Zhao',
            role: 'Barista',
            status: 'On Leave',
            phone: '+1 (555) 201-7788',
            email: 'kevin.z@capitalcoffee.com',
            hireDate: '2024-09-20',
            rating: 4.6,
            hoursThisWeek: 0,
            avatar: 'KZ',
        },
        {
            id: 'ST-005',
            name: 'Mia Johnson',
            role: 'Supervisor',
            status: 'On Shift',
            phone: '+1 (555) 201-9900',
            email: 'mia.j@capitalcoffee.com',
            hireDate: '2022-11-03',
            rating: 4.8,
            hoursThisWeek: 40,
            avatar: 'MJ',
        },
        {
            id: 'ST-006',
            name: 'David Kim',
            role: 'Barista',
            status: 'Off Shift',
            phone: '+1 (555) 201-1234',
            email: 'david.k@capitalcoffee.com',
            hireDate: '2025-04-05',
            rating: 4.3,
            hoursThisWeek: 20,
            avatar: 'DK',
        },
    ];
    const statusConfig = {
        'On Shift': { color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
        'Off Shift': { color: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
        'On Leave': { color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
    };
    const filtered = staff.filter((s) => {
        const matchStatus = filterStatus === 'all' || s.status === filterStatus;
        const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.role.toLowerCase().includes(searchQuery.toLowerCase());
        return matchStatus && matchSearch;
    });
    const onShiftCount = staff.filter((s) => s.status === 'On Shift').length;
    const offShiftCount = staff.filter((s) => s.status === 'Off Shift').length;
    const onLeaveCount = staff.filter((s) => s.status === 'On Leave').length;
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">Riverside Brew #08 — {staff.length} team members</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors">
          <Plus className="w-4 h-4"/>
          Add Staff
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600"/>
          </div>
          <div>
            <p className="text-sm text-gray-600">On Shift</p>
            <p className="text-2xl font-bold text-gray-900">{onShiftCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className="bg-gray-100 p-3 rounded-lg">
            <XCircle className="w-6 h-6 text-gray-500"/>
          </div>
          <div>
            <p className="text-sm text-gray-600">Off Shift</p>
            <p className="text-2xl font-bold text-gray-900">{offShiftCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
          <div className="bg-yellow-100 p-3 rounded-lg">
            <Clock className="w-6 h-6 text-yellow-600"/>
          </div>
          <div>
            <p className="text-sm text-gray-600">On Leave</p>
            <p className="text-2xl font-bold text-gray-900">{onLeaveCount}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input type="text" placeholder="Search staff by name or role..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"/>
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm">
          <option value="all">All Status</option>
          <option value="On Shift">On Shift</option>
          <option value="Off Shift">Off Shift</option>
          <option value="On Leave">On Leave</option>
        </select>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((member) => {
            const sc = statusConfig[member.status];
            return (<div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-600 flex items-center justify-center text-white font-semibold">
                    {member.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-gray-500">{member.role}</p>
                  </div>
                </div>
                <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                  <Edit className="w-4 h-4 text-gray-500"/>
                </button>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}/>
                  {member.status}
                </span>
                <div className="flex items-center gap-1 text-sm text-amber-600 font-medium">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400"/>
                  {member.rating}
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400"/>
                  {member.phone}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400"/>
                  {member.email}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400"/>
                  {member.hoursThisWeek}h this week
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <button className="flex-1 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors">
                  View Schedule
                </button>
                <button className="flex-1 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  Edit Info
                </button>
              </div>
            </div>);
        })}
      </div>

      {filtered.length === 0 && (<div className="text-center py-12 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300"/>
          <p>No staff members found.</p>
        </div>)}
    </div>);
}
