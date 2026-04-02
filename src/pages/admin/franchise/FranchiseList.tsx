import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Building2, Eye, Edit2, FileText, Settings, Globe, ChevronUp, ChevronDown, X, AlertTriangle, Ban, CheckCircle, Users, } from 'lucide-react';
import franchiseService from '@/services/franchiseService';
import { getAllCustomerProfiles } from '@/services/customerService';
import { assignStaffToFranchise } from '@/services/franchiseStaffService';
import {
  FranchiseStatusBadge,
  normalizeFranchiseStatus,
} from '@/components/franchise/FranchiseBadges';
// ── Mock Data ─────────────────────────────────────────────────────────────────
// Removed specific mock entries per request; keep an empty MOCK placeholder
const MOCK: any[] = [];
const TIMEZONES = ['Asia/Ho_Chi_Minh', 'Asia/Bangkok', 'Asia/Singapore', 'Asia/Tokyo', 'Europe/London', 'America/New_York'];
const REGIONS = ['North', 'Central', 'South'];
// ── Pre-activation checklist ───────────────────────────────────────────────────
const ACTIVATE_CHECKLIST = [
    { key: 'contract', label: 'Active contract exists', ok: (id) => id === 'fr-001' || id === 'fr-002' || id === 'fr-004' || id === 'fr-007' || id === 'fr-009' },
    { key: 'hours', label: 'Opening hours configured', ok: (id) => id !== 'fr-006' && id !== 'fr-010' },
    { key: 'menu', label: 'Menu profile assigned', ok: (id) => id !== 'fr-006' && id !== 'fr-010' && id !== 'fr-008' },
    { key: 'warehouse', label: 'Warehouse mapping configured', ok: (id) => id !== 'fr-006' && id !== 'fr-010' },
];
// ── Helpers ────────────────────────────────────────────────────────────────────
function SortIcon({ col, sortKey, sortDir }) {
    if (col !== sortKey)
        return <span className="w-3 h-3 ml-1 opacity-30"><ChevronUp className="w-3 h-3"/></span>;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 ml-1 text-amber-600"/> : <ChevronDown className="w-3 h-3 ml-1 text-amber-600"/>;
}
function readText(...values) {
    for (const value of values) {
        if (typeof value === 'string' && value.trim())
            return value.trim();
        if (typeof value === 'number' && Number.isFinite(value))
            return String(value);
    }
    return '';
}
function extractCreatedFranchiseId(response) {
    const candidates = [
        response,
        response?.data,
        response?.result,
        response?.data?.data,
        response?.data?.result,
        response?.result?.data,
        response?.result?.result,
    ];
    for (const candidate of candidates) {
        if (!candidate || typeof candidate !== 'object')
            continue;
        const id = readText(candidate.franchiseId, candidate.id);
        if (id)
            return id;
    }
    return '';
}
// ── Create Franchise Modal ─────────────────────────────────────────────────────
function CreateFranchiseModal({ onClose, existingFranchises = [] }) {
    const [form, setForm] = useState({ name: '', code: '', address: '', region: 'North', timezone: 'Asia/Ho_Chi_Minh', ownerId: '', managerUserId: '', contactInfo: '' });
    const [submitted, setSubmitted] = useState(false);
    const [createdSummary, setCreatedSummary] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [managerOptions, setManagerOptions] = useState([]);
    const [managerLoading, setManagerLoading] = useState(false);
    const [managerError, setManagerError] = useState('');
    const errors = {
        name: submitted && !form.name ? 'Franchise name is required' : '',
        code: submitted && !form.code ? 'Franchise code is required' : submitted && MOCK.some(f => f.franchiseCode === form.code) ? 'Code already exists' : '',
        address: submitted && !form.address ? 'Address is required' : '',
    };
    const selectedManager = managerOptions.find(manager => manager.userId === form.managerUserId);
    useEffect(() => {
        let mounted = true;
        async function loadManagers() {
            setManagerLoading(true);
            setManagerError('');
            try {
                const response = await getAllCustomerProfiles();
                const accounts = Array.isArray(response?.data) ? response.data : [];
                const managerAccounts = accounts.filter(account => readText(account?.role).toUpperCase() === 'MANAGER');
                const resolvedManagers = await Promise.allSettled(managerAccounts.map(async (account) => {
                    const userId = readText(account?.id);
                    if (!userId)
                        return null;
                    const profile = await franchiseService.getOwnerProfile(userId);
                    const staffId = readText(profile?.staffId, profile?.id);
                    if (!staffId)
                        return null;
                    const branchId = readText(profile?.branchId, account?.franchiseId);
                    const currentFranchise = existingFranchises.find(franchise => readText(franchise?.franchiseId, franchise?.id) === branchId);
                    return {
                        userId,
                        staffId,
                        name: readText(profile?.name, account?.name, userId) || userId,
                        email: readText(profile?.email, account?.email, '-'),
                        phone: readText(profile?.phone, account?.phone),
                        status: readText(profile?.status, account?.status),
                        staffCode: readText(profile?.staffCode),
                        branchId,
                        currentFranchiseLabel: readText(currentFranchise?.franchiseName, currentFranchise?.franchiseCode, branchId),
                    };
                }));
                const nextManagers = resolvedManagers
                    .filter(result => result.status === 'fulfilled' && result.value)
                    .map(result => result.value)
                    .filter(manager => readText(manager?.status).toUpperCase() === 'ACTIVE')
                    .sort((left, right) => left.name.localeCompare(right.name));
                if (mounted) {
                    setManagerOptions(nextManagers);
                    if (managerAccounts.length > 0 && nextManagers.length === 0) {
                        setManagerError('No active managers with staff profile were found.');
                    }
                }
            } catch (err) {
                if (mounted) {
                    setManagerOptions([]);
                    setManagerError(err?.message || 'Failed to load manager list');
                }
            } finally {
                if (mounted)
                    setManagerLoading(false);
            }
        }
        loadManagers();
        return () => { mounted = false; };
    }, [existingFranchises]);
    const handleSubmit = async () => {
        setSubmitted(true);
        setFormError('');
        if (!form.name || !form.code || !form.address) return;
        setSubmitting(true);
        try {
          const payload = {
            franchiseName: form.name,
            franchiseCode: form.code,
            address: form.address,
            region: form.region,
            timezone: form.timezone,
            ownerId: form.ownerId || undefined,
            contactInfo: form.contactInfo || ''
          };
          const resp = await franchiseService.create(payload);
          if (resp && (resp.success === true || resp.data)) {
            const createdFranchiseId = extractCreatedFranchiseId(resp);
            let assignmentMessage = '';
            if (selectedManager) {
              if (!createdFranchiseId) {
                assignmentMessage = 'Franchise was created, but returned franchiseId was missing so manager could not be assigned automatically.';
              } else {
                try {
                  await assignStaffToFranchise(createdFranchiseId, selectedManager.staffId);
                } catch (assignErr) {
                  assignmentMessage = readText(assignErr?.message) || 'Franchise was created, but manager assignment failed.';
                }
              }
            }
            setCreatedSummary({
              assignedManagerName: selectedManager?.name || '',
              assignmentMessage,
            });
          } else {
            setFormError(resp?.message || 'Failed to create franchise');
          }
        } catch (err) {
          setFormError(err?.message || 'Failed to create franchise');
        } finally {
          setSubmitting(false);
        }
    };
    if (createdSummary)
        return (<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4"/>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Franchise Created</h3>
        <p className="text-gray-600 mb-6">
          <span className="font-medium">{form.name}</span> has been created with code <span className="font-medium">{form.code}</span>.
        </p>
        {createdSummary.assignedManagerName && !createdSummary.assignmentMessage && (
          <p className="mb-4 text-sm text-emerald-700">Assigned manager: <span className="font-medium">{createdSummary.assignedManagerName}</span></p>
        )}
        {createdSummary.assignmentMessage && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-700">
            {createdSummary.assignmentMessage}
          </div>
        )}
        <button onClick={onClose} className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors">Done</button>
      </div>
    </div>);
    return (<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Create Franchise</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-500"/></button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Franchise Name */}
          <div>
            <label htmlFor="cf-name" className="block text-sm font-medium text-gray-700 mb-1">Franchise Name <span className="text-red-500">*</span></label>
            <input id="cf-name" type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Capital Coffee Hà Nội" className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}/>
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          {/* Franchise Code */}
          <div>
            <label htmlFor="cf-code" className="block text-sm font-medium text-gray-700 mb-1">Franchise Code <span className="text-red-500">*</span></label>
            <input id="cf-code" type="text" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. CC-HN-003" className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.code ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}/>
            {errors.code && <p className="text-xs text-red-600 mt-1">{errors.code}</p>}
          </div>

          {/* Address */}
          <div>
            <label htmlFor="cf-address" className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-red-500">*</span></label>
            <input id="cf-address" type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" className={`w-full px-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.address ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}/>
            {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
          </div>

          {/* Region + Timezone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cf-region" className="block text-sm font-medium text-gray-700 mb-1">Region</label>
              <select id="cf-region" value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="cf-tz" className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select id="cf-tz" value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                {TIMEZONES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Owner ID (optional) */}
          <div>
            <label htmlFor="cf-owner" className="block text-sm font-medium text-gray-700 mb-1">Owner ID <span className="text-gray-400 font-normal">(optional, ownership only)</span></label>
            <input id="cf-owner" type="text" value={form.ownerId} onChange={e => setForm(f => ({ ...f, ownerId: e.target.value }))} placeholder="user-XXX" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"/>
            <p className="mt-1 text-xs text-gray-500">This field only stores who owns the franchise. It does not decide which manager can view/manage the branch.</p>
          </div>

          {/* Assign Manager (optional) */}
          <div>
            <label htmlFor="cf-manager" className="block text-sm font-medium text-gray-700 mb-1">Assign Manager <span className="text-gray-400 font-normal">(optional)</span></label>
            <select id="cf-manager" value={form.managerUserId} onChange={e => setForm(f => ({ ...f, managerUserId: e.target.value }))} disabled={managerLoading} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50">
              <option value="">{managerLoading ? 'Loading managers...' : '-- Select manager to manage this branch --'}</option>
              {managerOptions.map(manager => <option key={manager.userId} value={manager.userId}>
                  {manager.name} - {manager.email}{manager.currentFranchiseLabel ? ` - Current branch: ${manager.currentFranchiseLabel}` : ''}
                </option>)}
            </select>
            {managerError && <p className="mt-1 text-xs text-red-600">{managerError}</p>}
            {!managerError && <p className="mt-1 text-xs text-gray-500">After creation, FE will map the selected manager to this franchise using the manager&apos;s staff profile.</p>}
            {selectedManager?.currentFranchiseLabel && (
              <p className="mt-1 text-xs text-amber-700">Selected manager is currently linked to: {selectedManager.currentFranchiseLabel}</p>
            )}
          </div>

            {/* Contact Info (optional) */}
            <div>
              <label htmlFor="cf-contact" className="block text-sm font-medium text-gray-700 mb-1">Contact Info <span className="text-gray-400 font-normal">(optional)</span></label>
              <input id="cf-contact" type="text" value={form.contactInfo} onChange={e => setForm(f => ({ ...f, contactInfo: e.target.value }))} placeholder="email | phone" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"/>
            </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
            <button onClick={onClose} disabled={submitting} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <div className="flex-1">
              {formError && <p className="text-xs text-red-600 mb-2">{formError}</p>}
              <button onClick={handleSubmit} disabled={submitting} className={`w-full py-2.5 ${submitting ? 'bg-amber-400' : 'bg-amber-600 hover:bg-amber-700'} text-white rounded-lg text-sm font-medium transition-colors`}>{submitting ? 'Creating…' : 'Create Franchise'}</button>
            </div>
        </div>
      </div>
    </div>);
}
// ── Activate Dialog ────────────────────────────────────────────────────────────
function ActivateDialog({ franchise, onClose }) {
    const checks = ACTIVATE_CHECKLIST.map(c => ({ ...c, passed: c.ok(franchise.franchiseId) }));
    const allPassed = checks.every(c => c.passed);
    const [confirmed, setConfirmed] = useState(false);
    if (confirmed)
        return (<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
        <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4"/>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Franchise Activated</h3>
        <p className="text-gray-600 mb-6"><span className="font-medium">{franchise.franchiseName}</span> is now active.</p>
        <button onClick={onClose} className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors">Done</button>
      </div>
    </div>);
    return (<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Activate Franchise</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500"/></button>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-1 text-sm">Activating: <span className="font-semibold text-gray-900">{franchise.franchiseName}</span></p>
          <p className="text-gray-500 text-xs mb-5">Current status: <span className="font-medium">{franchise.status}</span></p>

          <h3 className="text-sm font-semibold text-gray-800 mb-3">Pre-activation Checklist</h3>
          <div className="space-y-2.5">
            {checks.map(c => (<div key={c.key} className="flex items-center gap-3">
                {c.passed
                ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0"/>
                : <X className="w-5 h-5 text-red-500 flex-shrink-0"/>}
                <span className={`text-sm ${c.passed ? 'text-gray-700' : 'text-red-600 font-medium'}`}>{c.label}</span>
              </div>))}
          </div>

          {!allPassed && (<div className="mt-4 p-3 bg-red-50 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"/>
              <p className="text-sm text-red-700">Please complete all checklist items before activating.</p>
            </div>)}
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={() => allPassed && setConfirmed(true)} disabled={!allPassed} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${allPassed ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
            Activate
          </button>
        </div>
      </div>
    </div>);
}
// ── Suspend Dialog ─────────────────────────────────────────────────────────────
function SuspendDialog({ franchise, onClose }) {
    const [reason, setReason] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const error = submitted && !reason ? 'Suspension reason is required' : '';
    if (confirmed)
        return (<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center">
        <Ban className="w-14 h-14 text-red-400 mx-auto mb-4"/>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Franchise Suspended</h3>
        <p className="text-gray-600 mb-6"><span className="font-medium">{franchise.franchiseName}</span> has been suspended.</p>
        <button onClick={onClose} className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium">Done</button>
      </div>
    </div>);
    return (<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Suspend Franchise</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-500"/></button>
        </div>
        <div className="p-6">
          <div className="p-3 bg-yellow-50 rounded-lg flex items-start gap-2 mb-5">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5"/>
            <p className="text-sm text-yellow-800">Suspending this franchise will halt all operations. Please provide a reason.</p>
          </div>
          <p className="text-sm text-gray-600 mb-4">Franchise: <span className="font-semibold text-gray-900">{franchise.franchiseName}</span></p>
          <label htmlFor="suspend-reason" className="block text-sm font-medium text-gray-700 mb-1">Suspension Reason <span className="text-red-500">*</span></label>
          <textarea id="suspend-reason" rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="Describe the reason for suspending this franchise..." className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none ${error ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}/>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button onClick={() => { setSubmitted(true); if (reason)
        setConfirmed(true); }} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
            Suspend
          </button>
        </div>
      </div>
    </div>);
}
// ── Main Component ─────────────────────────────────────────────────────────────
export function FranchiseList() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [sortKey, setSortKey] = useState('updatedAt');
    const [sortDir, setSortDir] = useState('desc');
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 7;
    const [franchises, setFranchises] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const handleSort = (key) => {
        if (key === sortKey)
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    useEffect(() => {
      let mounted = true;
      async function load() {
        setLoading(true);
        setError('');
        try {
            const resp = await franchiseService.getAll();
            const list = resp?.data?.content ?? resp?.content ?? resp?.data ?? resp;
            if (mounted && Array.isArray(list)) setFranchises(list);
          } catch (err) {
          setError(err.message || 'Failed to load franchises');
        } finally {
          if (mounted) setLoading(false);
        }
      }
      load();
      return () => { mounted = false; };
    }, []);

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
        const keyword = search.toLowerCase();
        list = list.filter(f => String(f?.franchiseName ?? '').toLowerCase().includes(keyword) || String(f?.franchiseCode ?? '').toLowerCase().includes(keyword));
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
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const statusCounts = useMemo(() => {
      return {
        ALL: normalizedFranchises.length,
        ACTIVE: normalizedFranchises.filter(f => f.normalizedStatus === 'ACTIVE').length,
        PENDING: normalizedFranchises.filter(f => f.normalizedStatus === 'PENDING').length,
        SUSPENDED: normalizedFranchises.filter(f => f.normalizedStatus === 'SUSPENDED').length,
      };
    }, [normalizedFranchises]);
    return (<div className="space-y-6">
      {loading && (<div className="p-3 text-sm text-gray-600">Loading franchises…</div>)}
      {error && (<div className="p-3 text-sm text-red-600">{error}</div>)}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Franchise Management</h1>
          <p className="text-gray-600 mt-1">Manage all franchise locations — S14 View All · S12 Create</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors text-sm font-medium">
          <Plus className="w-4 h-4"/> Create Franchise
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'].map(s => (<button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            {s} <span className="ml-1 text-xs text-gray-400">({statusCounts[s]})</span>
          </button>))}
      </div>

      {/* Search + table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or code..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"/>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {([
            { key: 'franchiseCode', label: 'Code' },
            { key: 'franchiseName', label: 'Franchise Name' },
            { key: 'region', label: 'Region' },
            { key: 'status', label: 'Status' },
            { key: 'updatedAt', label: 'Updated At' },
        ]).map(col => (<th key={col.key} onClick={() => handleSort(col.key)} className="text-left py-3 px-4 text-gray-600 font-medium cursor-pointer hover:text-amber-700 select-none">
                    <span className="flex items-center gap-1">{col.label}<SortIcon col={col.key} sortKey={sortKey} sortDir={sortDir}/></span>
                  </th>))}
                <th className="text-center py-3 px-4 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(fr => {
            return (<tr key={fr.franchiseId} className="border-b border-gray-100 hover:bg-amber-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{fr.franchiseCode}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-amber-600 flex-shrink-0"/>
                        <span className="font-medium text-gray-900">{fr.franchiseName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5"/>{fr.region}</span>
                    </td>
                    <td className="py-3 px-4">
                      <FranchiseStatusBadge status={fr.normalizedStatus} />
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{fr.updatedAt}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => navigate(`/admin/franchise-detail?id=${fr.franchiseId}`)} title="View Detail" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <Eye className="w-4 h-4 text-gray-500"/>
                        </button>
                        <button title="Edit" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <Edit2 className="w-4 h-4 text-gray-500"/>
                        </button>
                        <button onClick={() => navigate(`/admin/franchise-detail?id=${fr.franchiseId}&tab=contracts`)} title="View Contracts" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <FileText className="w-4 h-4 text-gray-500"/>
                        </button>
                        <button onClick={() => navigate(`/admin/franchise-detail?id=${fr.franchiseId}&tab=config`)} title="View Configuration" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                          <Settings className="w-4 h-4 text-gray-500"/>
                        </button>
                        <button onClick={() => navigate(`/admin/franchise-staff/${fr.franchiseId}`)} title="Manage Staff" className="p-1.5 hover:bg-blue-50 rounded-lg">
                          <Users className="w-4 h-4 text-blue-600"/>
                        </button>
                      </div>
                    </td>
                  </tr>);
        })}
              {paged.length === 0 && (<tr><td colSpan={6} className="py-12 text-center text-gray-500">
                  <Building2 className="w-10 h-10 mx-auto mb-2 text-gray-300"/><p>No franchises found.</p>
                </td></tr>)}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (<div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">Previous</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (<button key={n} onClick={() => setPage(n)} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${page === n ? 'bg-amber-600 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}>{n}</button>))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">Next</button>
            </div>
          </div>)}
      </div>

      {/* Modals */}
      {showCreate && <CreateFranchiseModal onClose={() => setShowCreate(false)} existingFranchises={normalizedFranchises}/>}
    </div>);
}
