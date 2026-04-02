import { useState, useMemo } from 'react';
import { ShieldCheck, X, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_REQUESTS = [
    { requestId: 'sr-001', franchiseId: 'fr-003', franchiseCode: 'CC-HCM-001', franchiseName: 'Capital Coffee District 1', supplierId: 'sp-003', supplierName: 'Sweet Syrups JSC', supplierCategory: 'Syrups & Flavours', action: 'ADD', requestedBy: 'manager.hcm001@capitalcoffee.com', requestedAt: '2026-03-10 09:15', status: 'PENDING' },
    { requestId: 'sr-002', franchiseId: 'fr-008', franchiseCode: 'CC-BD-001', franchiseName: 'Capital Coffee Bình Dương', supplierId: 'sp-005', supplierName: 'CleanBrew Equipment', supplierCategory: 'Equipment', action: 'ADD', requestedBy: 'manager.bd001@capitalcoffee.com', requestedAt: '2026-03-09 14:30', status: 'PENDING' },
    { requestId: 'sr-003', franchiseId: 'fr-001', franchiseCode: 'CC-HN-001', franchiseName: 'Capital Coffee Hoàn Kiếm', supplierId: 'sp-002', supplierName: 'Dairy Fresh Vietnam', supplierCategory: 'Dairy', action: 'REMOVE', requestedBy: 'manager.hn001@capitalcoffee.com', requestedAt: '2026-03-08 11:00', status: 'PENDING' },
    { requestId: 'sr-004', franchiseId: 'fr-004', franchiseCode: 'CC-HCM-002', franchiseName: 'Capital Coffee District 7', supplierId: 'sp-001', supplierName: 'FreshBean Co. Ltd.', supplierCategory: 'Coffee Beans', action: 'ADD', requestedBy: 'manager.hcm002@capitalcoffee.com', requestedAt: '2026-03-05 10:20', status: 'APPROVED', reviewedBy: 'logistics@capitalcoffee.com', reviewedAt: '2026-03-06 14:00', comment: 'Approved. Supplier meets quality standards.' },
    { requestId: 'sr-005', franchiseId: 'fr-007', franchiseCode: 'CC-HP-001', franchiseName: 'Capital Coffee Hải Phòng', supplierId: 'sp-006', supplierName: 'IceBlock Vietnam', supplierCategory: 'Ice & Disposables', action: 'ADD', requestedBy: 'manager.hp001@capitalcoffee.com', requestedAt: '2026-03-04 16:45', status: 'REJECTED', reviewedBy: 'logistics@capitalcoffee.com', reviewedAt: '2026-03-05 09:30', comment: 'Rejected. Supplier does not meet food safety certification requirements.' },
];
const STATUS_CFG = {
    PENDING: { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700' },
    APPROVED: { label: 'Approved', cls: 'bg-green-100 text-green-700' },
    REJECTED: { label: 'Rejected', cls: 'bg-red-100 text-red-700' },
};
// ── Approve Dialog ─────────────────────────────────────────────────────────────
function ApproveDialog({ req, onClose }) {
    const [comment, setComment] = useState('');
    const [done, setDone] = useState(false);
    if (done)
        return (<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3"/>
        <p className="font-semibold text-gray-900">Request Approved</p>
        <p className="text-sm text-gray-500 mt-1">{req.supplierName} has been added to {req.franchiseCode}</p>
        <button onClick={onClose} className="mt-4 w-full py-2 bg-amber-600 text-white rounded-lg font-medium">Done</button>
      </div>
    </div>);
    return (<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Approve Supplier Request</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500"/></button>
        </div>
        <div className="p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400 mb-0.5">Franchise</p><p className="font-medium text-gray-900">{req.franchiseCode}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400 mb-0.5">Supplier</p><p className="font-medium text-gray-900">{req.supplierName}</p></div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400 mb-0.5">Action</p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${req.action === 'ADD' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{req.action}</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-400 mb-0.5">Category</p><p className="font-medium text-gray-900">{req.supplierCategory}</p></div>
          </div>
          <div>
            <label htmlFor="approve-comment" className="block text-sm font-medium text-gray-700 mb-1">Approval Comment (optional)</label>
            <textarea id="approve-comment" rows={3} value={comment} onChange={e => setComment(e.target.value)} placeholder="Add any notes for this approval..." className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"/>
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={() => setDone(true)} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">Approve</button>
        </div>
      </div>
    </div>);
}
// ── Reject Dialog ─────────────────────────────────────────────────────────────
function RejectDialog({ req, onClose }) {
    const [reason, setReason] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [done, setDone] = useState(false);
    const error = submitted && !reason ? 'Rejection reason is required' : '';
    if (done)
        return (<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3"/>
        <p className="font-semibold text-gray-900">Request Rejected</p>
        <button onClick={onClose} className="mt-4 w-full py-2 bg-gray-700 text-white rounded-lg font-medium">Close</button>
      </div>
    </div>);
    return (<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Reject Supplier Request</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500"/></button>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-gray-600">Rejecting request to <strong>{req.action === 'ADD' ? 'add' : 'remove'}</strong> <strong>{req.supplierName}</strong> for <strong>{req.franchiseCode}</strong>.</p>
          <div>
            <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-700 mb-1">Reason <span className="text-red-500">*</span></label>
            <textarea id="reject-reason" rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain why this request is being rejected..." className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}/>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={() => { setSubmitted(true); if (reason)
        setDone(true); }} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium">Reject</button>
        </div>
      </div>
    </div>);
}
// ── Main Component ─────────────────────────────────────────────────────────────
export function SupplierMappingApproval() {
    const [statusFilter, setStatusFilter] = useState('PENDING');
    const [search, setSearch] = useState('');
    const [approveTarget, setApproveTarget] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);
    const pendingCount = MOCK_REQUESTS.filter(r => r.status === 'PENDING').length;
    const filtered = useMemo(() => {
        let list = [...MOCK_REQUESTS];
        if (statusFilter !== 'ALL')
            list = list.filter(r => r.status === statusFilter);
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(r => r.franchiseCode.toLowerCase().includes(q) ||
                r.supplierName.toLowerCase().includes(q));
        }
        return list;
    }, [statusFilter, search]);
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supplier Mapping Approval</h1>
          <p className="text-gray-600 mt-1">S32 – Review and approve/reject franchise supplier mapping requests (Logistics Admin)</p>
        </div>
        {pendingCount > 0 && (<div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"/>
            <span className="text-sm font-semibold text-yellow-700">{pendingCount} pending review</span>
          </div>)}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        {([
            { status: 'PENDING', label: 'Pending', color: 'amber' },
            { status: 'APPROVED', label: 'Approved', color: 'green' },
            { status: 'REJECTED', label: 'Rejected', color: 'red' },
        ]).map(s => {
            const count = MOCK_REQUESTS.filter(r => r.status === s.status).length;
            const colorMap = { amber: 'bg-amber-50 text-amber-700 border-amber-200', green: 'bg-green-50 text-green-700 border-green-200', red: 'bg-red-50 text-red-700 border-red-200' };
            return (<div key={s.status} className={`rounded-xl p-4 border ${colorMap[s.color]}`}>
              <p className="text-3xl font-bold">{count}</p>
              <p className="text-sm font-medium mt-0.5">{s.label}</p>
            </div>);
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(s => (<button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === s ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
              {s}
            </button>))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search franchise or supplier..." className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"/>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Filter className="w-4 h-4"/> {filtered.length} result(s)
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Request ID</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Franchise</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Supplier</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Action</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Requested By</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Requested At</th>
              <th className="text-left py-3 px-4 text-gray-600 font-medium">Status</th>
              <th className="text-center py-3 px-4 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => {
            const sc = STATUS_CFG[r.status];
            return (<tr key={r.requestId} className="border-b border-gray-100 hover:bg-amber-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{r.requestId}</td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{r.franchiseCode}</p>
                    <p className="text-xs text-gray-400">{r.franchiseName}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-900">{r.supplierName}</p>
                    <p className="text-xs text-gray-400">{r.supplierCategory}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.action === 'ADD' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.action}</span>
                  </td>
                  <td className="py-3 px-4 text-xs text-gray-500">{r.requestedBy}</td>
                  <td className="py-3 px-4 text-xs text-gray-500">{r.requestedAt}</td>
                  <td className="py-3 px-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${sc.cls}`}>{sc.label}</span></td>
                  <td className="py-3 px-4">
                    {r.status === 'PENDING' ? (<div className="flex items-center justify-center gap-2">
                        <button onClick={() => setApproveTarget(r)} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium">
                          <CheckCircle className="w-3 h-3"/> Approve
                        </button>
                        <button onClick={() => setRejectTarget(r)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium">
                          <XCircle className="w-3 h-3"/> Reject
                        </button>
                      </div>) : (<div className="text-center">
                        <p className="text-xs text-gray-500">{r.reviewedBy}</p>
                        <p className="text-xs text-gray-400">{r.reviewedAt}</p>
                      </div>)}
                  </td>
                </tr>);
        })}
            {filtered.length === 0 && (<tr><td colSpan={8} className="py-12 text-center">
                <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-gray-300"/>
                <p className="text-gray-500">No requests found.</p>
              </td></tr>)}
          </tbody>
        </table>
      </div>

      {approveTarget && <ApproveDialog req={approveTarget} onClose={() => setApproveTarget(null)}/>}
      {rejectTarget && <RejectDialog req={rejectTarget} onClose={() => setRejectTarget(null)}/>}
    </div>);
}
