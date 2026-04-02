import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Eye, Globe, MapPin, ChevronUp, ChevronDown, Settings, Users, FileText, User2, Mail, Calendar } from 'lucide-react';
import franchiseService from '@/services/franchiseService';
import { useAuth } from '@/context/AuthContext';
import {
  FranchiseStatusBadge,
  normalizeFranchiseStatus,
} from '@/components/franchise/FranchiseBadges';

const MOCK = [];
export function FranchiseView() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const u = user as any;
    
    // Extract manager email - prioritize auth context email
    const managerEmail = String(
        u?.email ||
        u?.raw?.email ||
        u?.raw?.gmail ||
        (u?.username && u.username.includes('@') ? u.username : null) || 
        "N/A"
    );
    
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [sortKey, setSortKey] = useState('updatedAt');
    const [sortDir, setSortDir] = useState('desc');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 7;
    const [franchises, setFranchises] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
      let mounted = true;
      async function load() {
        setLoading(true);
        setError('');
        try {
          const resp = await franchiseService.getManagerFranchises();
          let list: any[] = [];
          const data = resp as any;
          if (Array.isArray(resp)) {
            list = resp;
          } else if (data?.data?.content) {
            list = data.data.content;
          } else if (data?.content) {
            list = data.content;
          } else if (data?.data && Array.isArray(data.data)) {
            list = data.data;
          }
          if (mounted && Array.isArray(list)) setFranchises(list);
        } catch (err: any) {
          setError(err.message || 'Failed to load franchises');
        } finally {
          if (mounted) setLoading(false);
        }
      }
      load();
      return () => { mounted = false; };
    }, []);
    const handleSort = (key) => {
        if (key === sortKey)
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const normalizedFranchises = useMemo(() => {
      const source = franchises.length ? franchises : MOCK;
      return source.map((fr) => ({
        ...fr,
        normalizedStatus: normalizeFranchiseStatus(fr?.status),
      }));
    }, [franchises]);

    const filtered = useMemo(() => {
      let list = [...normalizedFranchises];
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(f => String(f?.franchiseCode ?? '').toLowerCase().includes(q) || String(f?.franchiseName ?? '').toLowerCase().includes(q));
        }
        if (statusFilter !== 'ALL')
            list = list.filter(f => f.normalizedStatus === statusFilter);
        list.sort((a, b) => {
            const av = sortKey === 'status' ? a.normalizedStatus : a[sortKey] ?? '';
            const bv = sortKey === 'status' ? b.normalizedStatus : b[sortKey] ?? '';
            return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
        });
        return list;
    }, [search, statusFilter, sortKey, sortDir, normalizedFranchises]);
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const getSortIcon = (col: string) => {
      if (col !== sortKey) return <ChevronUp className="w-3 h-3 opacity-20"/>;
      return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-amber-600"/> : <ChevronDown className="w-3 h-3 text-amber-600"/>;
    };
    return (<div className="space-y-6">
      {loading && (<div className="p-3 text-sm text-gray-600">Loading franchises…</div>)}
      {error && (<div className="p-3 text-sm text-red-600">{error}</div>)}

      {/* Welcome & Manager Info Section */}
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Welcome back, {u?.username || u?.raw?.username || u?.name || u?.raw?.name || 'Manager'} 👋
        </h1>
        <p className="text-sm font-medium text-gray-500 mt-1">
          Here is your franchise portfolio overview
        </p>
      </div>

      {/* Manager Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <User2 size={16} className="text-amber-600" />
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Manager ID</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{u?.id || u?.userId || u?.raw?.id || 'N/A'}</p>
          <p className="text-sm text-gray-500 mt-1">Unique identifier</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Mail size={16} className="text-amber-600" />
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{managerEmail}</p>
          <p className="text-sm text-gray-500 mt-1">Account contact</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={16} className="text-amber-600" />
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Assigned Franchises</p>
          </div>
          <p className="text-lg font-bold text-gray-900">{normalizedFranchises.filter(f => f.normalizedStatus === 'ACTIVE').length}</p>
          <p className="text-sm text-gray-500 mt-1">{normalizedFranchises.filter(f => f.normalizedStatus === 'ACTIVE').length} active franchise(s)</p>
        </div>
      </div>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Franchise Directory</h2>
        <p className="text-gray-600 mt-1">Browse and manage all your franchises</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'].map(s => {
          const count = s === 'ALL' ? normalizedFranchises.length : normalizedFranchises.filter(f => f.normalizedStatus === s).length;
            const colorMap = { ALL: 'bg-gray-50 border-gray-200 text-gray-700', ACTIVE: 'bg-green-50 border-green-200 text-green-700', PENDING: 'bg-yellow-50 border-yellow-200 text-yellow-700', SUSPENDED: 'bg-red-50 border-red-200 text-red-700' };
            return (<button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`rounded-xl p-4 border text-left transition-all ${colorMap[s]} ${statusFilter === s ? 'ring-2 ring-amber-400' : ''}`}>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm font-medium mt-0.5">{s === 'ALL' ? 'Total' : s.charAt(0) + s.slice(1).toLowerCase()}</p>
            </button>);
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or code..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"/>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {([
            { key: 'franchiseCode', label: 'Code' },
            { key: 'franchiseName', label: 'Name' },
            { key: 'region', label: 'Region' },
            { key: 'status', label: 'Status' },
            { key: 'updatedAt', label: 'Updated At' },
        ]).map(col => (<th key={col.key} onClick={() => handleSort(col.key)} className="text-left py-3 px-4 text-gray-600 font-medium cursor-pointer hover:text-amber-700 select-none">
                    <span className="flex items-center gap-1">{col.label} {getSortIcon(col.key)}</span>
                  </th>))}
                <th className="text-center py-3 px-4 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(f => {
            return (<tr key={f.franchiseId} className="border-b border-gray-100 hover:bg-amber-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-gray-700 font-medium">{f.franchiseCode}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-900">{f.franchiseName}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3"/>{f.address}</p>
                    </td>
                    <td className="py-3 px-4"><span className="flex items-center gap-1 text-gray-600"><Globe className="w-3 h-3"/>{f.region}</span></td>
                    <td className="py-3 px-4"><FranchiseStatusBadge status={f.normalizedStatus} /></td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{f.updatedAt}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => navigate(`/manager/franchise-detail?id=${f.franchiseId}`)} title="View Detail" className="p-1.5 hover:bg-gray-100 rounded-lg">
                          <Eye className="w-4 h-4 text-gray-500"/>
                        </button>
                        <button onClick={() => navigate(`/manager/contracts?franchiseId=${encodeURIComponent(String(f.franchiseId ?? ''))}`)} title="View Contracts" className="p-1.5 hover:bg-emerald-50 rounded-lg">
                          <FileText className="w-4 h-4 text-emerald-600"/>
                        </button>
                        <button onClick={() => navigate(`/manager/franchise-staff/${f.franchiseId}`)} title="Manage Staff" className="p-1.5 hover:bg-blue-50 rounded-lg">
                          <Users className="w-4 h-4 text-blue-600"/>
                        </button>
                        <button onClick={() => navigate(`/manager/franchise-config?id=${f.franchiseId}`)} title="View Config" className="p-1.5 hover:bg-amber-50 rounded-lg">
                          <Settings className="w-4 h-4 text-amber-500"/>
                        </button>
                      </div>
                    </td>
                  </tr>);
        })}
              {paged.length === 0 && (<tr><td colSpan={6} className="py-12 text-center">
                  <Building2 className="w-10 h-10 mx-auto mb-2 text-gray-300"/>
                  <p className="text-gray-500">No franchises found.</p>
                </td></tr>)}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (<div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (<button key={n} onClick={() => setPage(n)} className={`px-3 py-1.5 text-sm rounded-lg ${page === n ? 'bg-amber-600 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}>{n}</button>))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>)}
      </div>
    </div>);
}
