import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import contractService, { type Contract } from '../../../services/ContractService';
import {
  activateFranchise,
  attachOwner,
  changeOwner,
  deactivateFranchise,
  getFranchiseDetail,
  getFranchiseOwnerProfile,
} from '../../../services/franchiseService';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Building2,
  CheckCircle,
  Clock,
  Edit2,
  FileText,
  Globe,
  MapPin,
  Plus,
  Power,
  RefreshCw,
  Shield,
  X,
} from 'lucide-react';
import {
  FranchiseStatusBadge,
  normalizeFranchiseStatus,
} from '../../../components/franchise/FranchiseBadges';
import { useAuth } from '../../../context/AuthContext';
import { extractUserId } from '../../../utils/authHelpers';

const DEFAULT_FRANCHISE = {
  franchiseId: '',
  franchiseCode: '',
  franchiseName: '',
  address: '',
  region: '',
  timezone: '',
  status: '',
  onboardingStatus: '',
  featureFlags: {},
};

const AUDIT: any[] = [];
const TODAY = new Date().toISOString().slice(0, 10);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return '';
}

function normalizeFranchisePayload(payload) {
  return {
    ...DEFAULT_FRANCHISE,
    ...(payload ?? {}),
    featureFlags: isObject(payload?.featureFlags) ? payload.featureFlags : {},
  };
}

function normalizeOwnershipStatus(value) {
  const normalized = readString(value).toUpperCase();

  if (!normalized) return 'ACTIVE';
  if (normalized === 'CURRENT') return 'ACTIVE';

  return normalized;
}

function normalizeOwnerRecord(owner, fallbackStatus = 'ACTIVE') {
  if (!isObject(owner)) return null;

  const ownerId = readString(owner.ownerId, owner.id, owner.userId);
  const name = readString(
    owner.name,
    owner.fullName,
    owner.ownerName,
    owner.username,
    owner.displayName
  );
  const email = readString(owner.email, owner.ownerEmail, owner.contactEmail);
  const role = readString(owner.role, owner.roleName, owner.ownerRole, 'Owner');
  const startDate = readString(
    owner.startDate,
    owner.assignedSince,
    owner.effectiveDate,
    owner.createdAt,
    owner.updatedAt
  );
  const status = normalizeOwnershipStatus(readString(owner.status, fallbackStatus));

  if (!ownerId && !name && !email) {
    return null;
  }

  return {
    ownerId: ownerId || name || email,
    name: name || ownerId || 'Unknown owner',
    email: email || '-',
    role,
    startDate: startDate || '-',
    status,
  };
}

function getCurrentOwner(franchise) {
  const ownerFromObject = normalizeOwnerRecord(franchise?.owner, 'ACTIVE');
  if (ownerFromObject) {
    return ownerFromObject;
  }

  const ownerId = readString(franchise?.ownerId);
  if (!ownerId) return null;

  return {
    ownerId,
    name: ownerId,
    email: '-',
    role: readString(franchise?.ownerRole, 'Owner'),
    startDate: readString(franchise?.ownerEffectiveDate, franchise?.updatedAt) || '-',
    status: 'ACTIVE',
  };
}

function isSameOwner(candidate, ownerUserId) {
  const normalizedOwnerUserId = readString(ownerUserId);
  if (!normalizedOwnerUserId || !isObject(candidate)) return false;

  const candidateIdentifiers = [
    candidate.userId,
    candidate.id,
    candidate.ownerId,
    candidate.customerId,
    candidate.staffId,
  ];

  return candidateIdentifiers.some(
    (identifier) => readString(identifier) === normalizedOwnerUserId
  );
}

function hasMeaningfulOwnerProfile(owner, ownerUserId) {
  if (!isObject(owner)) return false;

  const normalizedOwnerId = readString(
    ownerUserId,
    owner.ownerId,
    owner.userId,
    owner.id
  );
  const ownerName = readString(
    owner.name,
    owner.fullName,
    owner.ownerName,
    owner.username,
    owner.displayName
  );
  const ownerEmail = readString(owner.email, owner.ownerEmail, owner.contactEmail);
  const hasDisplayName = ownerName && ownerName !== normalizedOwnerId;
  const hasDisplayEmail = ownerEmail && ownerEmail !== '-';

  return Boolean(hasDisplayName || hasDisplayEmail);
}

function mergeOwnerProfile(owner, staffProfile) {
  if (!owner) return null;
  if (!isObject(staffProfile)) return owner;
  const profileUserId = readString(staffProfile.userId);

  if (owner.ownerId && !isSameOwner(staffProfile, owner.ownerId)) {
    return owner;
  }

  return {
    ...owner,
    ownerId: profileUserId || owner.ownerId,
    staffId: readString(staffProfile.staffId, staffProfile.id, owner.staffId),
    name: readString(staffProfile.name, owner.name) || owner.name,
    email: readString(staffProfile.email, owner.email) || owner.email,
    phone: readString(staffProfile.phone),
  };
}

function shouldShowOwnerIdentifier(owner) {
  if (!owner?.ownerId) return false;

  const normalizedName = readString(owner.name);
  const normalizedEmail = readString(owner.email);
  const hasDisplayName = normalizedName && normalizedName !== owner.ownerId;
  const hasDisplayEmail = normalizedEmail && normalizedEmail !== '-';

  return !(hasDisplayName || hasDisplayEmail);
}

function getOwnershipHistory(franchise, currentOwner) {
  const sources = [
    franchise?.ownershipHistory,
    franchise?.ownerHistory,
    franchise?.ownerships,
    franchise?.owners,
  ];

  for (const source of sources) {
    if (!Array.isArray(source) || source.length === 0) continue;

    const normalized = source
      .map((owner) => normalizeOwnerRecord(owner, 'INACTIVE'))
      .filter(Boolean);

    if (normalized.length > 0) {
      return normalized;
    }
  }

  return currentOwner ? [currentOwner] : [];
}

function getOwnerInitials(name) {
  const trimmed = readString(name);
  if (!trimmed) return 'OW';

  const initials = trimmed
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2);

  return initials || trimmed.slice(0, 2).toUpperCase();
}

function formatDisplayDate(value) {
  const input = readString(value);
  if (!input) return '-';
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return input;
  }

  return parsed.toLocaleDateString('en-CA');
}

function resolveActionUser(user) {
  return (
    readString(user?.username, user?.name, user?.email, extractUserId(user)) ||
    'admin_user'
  );
}

async function resolveOwnerProfile(ownerUserId) {
  const normalizedOwnerUserId = readString(ownerUserId);

  if (!normalizedOwnerUserId) return null;

  try {
    return await getFranchiseOwnerProfile(normalizedOwnerUserId);
  } catch {
    return null;
  }
}

function EditIdentityDrawer({ franchise, onClose }) {
  const [form, setForm] = useState({
    name: franchise.franchiseName,
    address: franchise.address,
    region: franchise.region,
    timezone: franchise.timezone,
  });
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setDirty(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900">Edit Franchise Identity</h2>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {saved ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <CheckCircle className="mb-3 h-12 w-12 text-green-500" />
            <p className="text-lg font-semibold text-gray-900">Changes Saved</p>
            <button
              onClick={onClose}
              className="mt-6 rounded-lg bg-amber-600 px-6 py-2 font-medium text-white"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                <Shield className="h-4 w-4 flex-shrink-0" />
                Franchise Code and Status are read-only.
              </div>

              {[
                { label: 'Franchise Code', value: franchise.franchiseCode },
                { label: 'Status', value: franchise.status },
              ].map((field) => (
                <div key={field.label}>
                  <p className="mb-1 text-xs font-medium text-gray-500">{field.label}</p>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500">
                    {field.value}
                  </div>
                </div>
              ))}

              {[
                { id: 'edit-name', label: 'Franchise Name', field: 'name', value: form.name },
                {
                  id: 'edit-address',
                  label: 'Address',
                  field: 'address',
                  value: form.address,
                },
              ].map((field) => (
                <div key={field.field}>
                  <label
                    htmlFor={field.id}
                    className="mb-1 block text-xs font-medium text-gray-700"
                  >
                    {field.label}
                  </label>
                  <input
                    id={field.id}
                    type="text"
                    value={field.value}
                    onChange={(event) => handleChange(field.field, event.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              ))}

              <div>
                <label
                  htmlFor="edit-region"
                  className="mb-1 block text-xs font-medium text-gray-700"
                >
                  Region
                </label>
                <select
                  id="edit-region"
                  value={form.region}
                  onChange={(event) => handleChange('region', event.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {['North', 'Central', 'South'].map((region) => (
                    <option key={region}>{region}</option>
                  ))}
                </select>
              </div>

              {dirty && (
                <div className="flex items-center gap-2 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  You have unsaved changes.
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-gray-100 p-6">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setSaved(true)}
                className="flex-1 rounded-lg bg-amber-600 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
              >
                Save Changes
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AssignOwnerModal({
  onClose,
  action,
  onConfirm,
  submitting,
  error,
  currentOwner,
}) {
  const [form, setForm] = useState({
    targetOwnerId: '',
    role: 'OWNER',
    effectiveDate: TODAY,
  });
  const ownerLabel = action === 'assign' ? 'Owner ID' : 'New Owner ID';
  const submitLabel = action === 'assign' ? 'Assign Owner' : 'Change Owner';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900">
            {action === 'assign' ? 'Assign' : 'Change'} Franchise Owner
          </h2>
          <button onClick={onClose}>
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {action === 'change' && currentOwner?.ownerId && (
            <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
              Current owner ID:{' '}
              <span className="font-mono text-gray-900">{currentOwner.ownerId}</span>
            </div>
          )}

          <div>
            <label htmlFor="ao-owner" className="mb-1 block text-sm font-medium text-gray-700">
              {ownerLabel}
            </label>
            <input
              id="ao-owner"
              type="text"
              value={form.targetOwnerId}
              onChange={(event) =>
                setForm((current) => ({ ...current, targetOwnerId: event.target.value }))
              }
              placeholder="3fa85f64-5717-4562-b3fc-2c963f66afa6"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label htmlFor="ao-role" className="mb-1 block text-sm font-medium text-gray-700">
              Role
            </label>
            <input
              id="ao-role"
              type="text"
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({ ...current, role: event.target.value }))
              }
              placeholder="OWNER"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label htmlFor="ao-date" className="mb-1 block text-sm font-medium text-gray-700">
              Effective Date
            </label>
            <input
              id="ao-date"
              type="date"
              value={form.effectiveDate}
              onChange={(event) =>
                setForm((current) => ({ ...current, effectiveDate: event.target.value }))
              }
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 pb-6 pt-0">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(form)}
            disabled={submitting}
            className="flex-1 rounded-lg bg-amber-600 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            {submitting ? 'Processing...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FranchiseDetail() {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id') ?? 'fr-001';
  const rawTab = searchParams.get('tab');
  const initialTab =
    rawTab === 'contracts' || rawTab === 'audit'
      ? rawTab
      : 'overview';

  const [franchise, setFranchise] = useState(DEFAULT_FRANCHISE);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showEdit, setShowEdit] = useState(false);
  const [showAssignOwner, setShowAssignOwner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [ownerActionLoading, setOwnerActionLoading] = useState(false);
  const [ownerActionError, setOwnerActionError] = useState('');
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [contractsError, setContractsError] = useState('');
  const [contractsLoadedFor, setContractsLoadedFor] = useState('');

  const normalizedFranchiseStatus = normalizeFranchiseStatus(franchise.status);
  const currentOwner = mergeOwnerProfile(getCurrentOwner(franchise), ownerProfile);
  const ownershipHistory = getOwnershipHistory(franchise, currentOwner).map((owner) =>
    mergeOwnerProfile(owner, ownerProfile)
  );
  const hasCurrentOwner = Boolean(currentOwner);
  const actionUser = resolveActionUser(currentUser);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'contracts', label: 'Contracts' },
    { key: 'audit', label: 'Audit History' },
  ];

  const currentOwnerSection = (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Current Owner</h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setOwnerActionError('');
              setShowAssignOwner('assign');
            }}
            disabled={hasCurrentOwner || ownerActionLoading}
            className={`flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs ${
              hasCurrentOwner || ownerActionLoading
                ? 'cursor-not-allowed text-gray-400'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            Assign Owner
          </button>
          <button
            onClick={() => {
              setOwnerActionError('');
              setShowAssignOwner('change');
            }}
            disabled={!hasCurrentOwner || ownerActionLoading}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-white ${
              !hasCurrentOwner || ownerActionLoading
                ? 'cursor-not-allowed bg-amber-300'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Change Owner
          </button>
        </div>
      </div>

      {currentOwner ? (
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-600 font-bold text-white">
              {getOwnerInitials(currentOwner.name)}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{currentOwner.name}</p>
              <p className="text-sm text-gray-500">{currentOwner.email}</p>
              <p className="mt-0.5 text-xs text-gray-400">
                {currentOwner.role} - Since {formatDisplayDate(currentOwner.startDate)}
              </p>
              {shouldShowOwnerIdentifier(currentOwner) && (
                <p className="mt-2 font-mono text-xs text-gray-500">
                  {currentOwner.ownerId}
                </p>
              )}
              {currentOwner.phone && (
                <p className="mt-1 text-xs text-gray-500">{currentOwner.phone}</p>
              )}
            </div>
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
              Active
            </span>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            {hasCurrentOwner
              ? 'Use Change Owner to transfer ownership to another account.'
              : 'No owner has been assigned yet.'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-500">
          No owner has been assigned to this franchise yet.
        </div>
      )}
    </div>
  );

  const ownershipHistorySection = (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-semibold text-gray-900">Ownership History</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {['Owner', 'Email', 'Role', 'Start Date', 'Status'].map((header) => (
                <th
                  key={header}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ownershipHistory.length > 0 ? (
              ownershipHistory.map((owner) => (
                <tr
                  key={owner.ownerId}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="px-3 py-2.5 font-medium text-gray-900">{owner.name}</td>
                  <td className="px-3 py-2.5 text-gray-600">{owner.email}</td>
                  <td className="px-3 py-2.5 text-gray-600">{owner.role}</td>
                  <td className="px-3 py-2.5 text-gray-600">
                    {formatDisplayDate(owner.startDate)}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        owner.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {owner.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-sm text-gray-500">
                  No ownership history available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const loadFranchiseContracts = useCallback(
    async (force = false) => {
      if (!id) {
        setContracts([]);
        setContractsError('');
        setContractsLoadedFor('');
        return;
      }

      if (!force && contractsLoadedFor === id) {
        return;
      }

      setContractsLoading(true);
      setContractsError('');

      try {
        const allContracts = await contractService.getAllContracts();
        const filteredContracts = allContracts
          .filter((contract) => readString(contract?.franchiseId) === id)
          .sort((left, right) =>
            String(right.createdAt ?? '').localeCompare(String(left.createdAt ?? ''))
          );

        setContracts(filteredContracts);
        setContractsLoadedFor(id);
      } catch (err) {
        setContracts([]);
        setContractsLoadedFor('');
        setContractsError(
          err instanceof Error ? err.message : 'Failed to load contracts for this franchise'
        );
      } finally {
        setContractsLoading(false);
      }
    },
    [contractsLoadedFor, id]
  );

  useEffect(() => {
    let mounted = true;

    async function loadDetail() {
      setLoading(true);
      setError('');

      try {
        const response = await getFranchiseDetail(id);
        const payload = response?.data ?? response;

        if (mounted && payload) {
          setFranchise(normalizeFranchisePayload(payload));
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load franchise detail';
        if (mounted) {
          setError(message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;
    const ownerUserId = readString(
      franchise?.ownerId,
      franchise?.owner?.ownerId,
      franchise?.owner?.userId,
      franchise?.owner?.id
    );
    const ownerAlreadyExpanded = hasMeaningfulOwnerProfile(
      franchise?.owner,
      ownerUserId
    );

    if (!ownerUserId || ownerAlreadyExpanded) {
      setOwnerProfile(null);
      return () => {
        mounted = false;
      };
    }

    async function loadOwnerProfile() {
      try {
        const response = await resolveOwnerProfile(ownerUserId);

        if (mounted) {
          setOwnerProfile(response ?? null);
        }
      } catch {
        if (mounted) {
          setOwnerProfile(null);
        }
      }
    }

    loadOwnerProfile();

    return () => {
      mounted = false;
    };
  }, [franchise?.ownerId, franchise?.owner]);

  useEffect(() => {
    setContracts([]);
    setContractsError('');
    setContractsLoadedFor('');
    setContractsLoading(false);
  }, [id]);

  useEffect(() => {
    if (activeTab !== 'contracts') return;

    void loadFranchiseContracts();
  }, [activeTab, loadFranchiseContracts]);

  async function reloadDetail() {
    const response = await getFranchiseDetail(id);
    const payload = response?.data ?? response;

    if (payload) {
      setFranchise(normalizeFranchisePayload(payload));
    }
  }

  async function handleActivate() {
    if (actionLoading) return;

    setActionLoading(true);
    setActionMsg('');

    try {
      const response = await activateFranchise(id);
      if (response?.success === true) {
        setActionMsg('Activate successful');
        setFranchise((current) => ({ ...current, status: 'ACTIVE' }));
      } else {
        setActionMsg('Activate failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Activate failed';
      setActionMsg(message);
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionMsg(''), 3000);
    }
  }

  async function handleDeactivate() {
    if (actionLoading) return;

    setActionLoading(true);
    setActionMsg('');

    try {
      const response = await deactivateFranchise(id);
      if (response?.success === true) {
        setActionMsg('Deactivate successful');
        setFranchise((current) => ({ ...current, status: 'INACTIVE' }));
      } else {
        setActionMsg('Deactivate failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Deactivate failed';
      setActionMsg(message);
    } finally {
      setActionLoading(false);
      setTimeout(() => setActionMsg(''), 3000);
    }
  }

  async function handleOwnerSubmit(form) {
    if (ownerActionLoading || !showAssignOwner) return;

    const currentAction = showAssignOwner;
    const targetOwnerId = readString(form?.targetOwnerId);
    const role = readString(form?.role);
    const effectiveDate = readString(form?.effectiveDate);

    if (!id) {
      setOwnerActionError('Missing franchise id');
      return;
    }

    if (!targetOwnerId) {
      setOwnerActionError(
        currentAction === 'assign' ? 'Owner ID is required' : 'New owner ID is required'
      );
      return;
    }

    if (!role) {
      setOwnerActionError('Role is required');
      return;
    }

    if (!effectiveDate) {
      setOwnerActionError('Effective date is required');
      return;
    }

    setOwnerActionLoading(true);
    setOwnerActionError('');

    try {
      const response =
        currentAction === 'assign'
          ? await attachOwner(
              id,
              {
                ownerId: targetOwnerId,
                role,
                effectiveDate,
              },
              actionUser
            )
          : await changeOwner(
              id,
              {
                newOwnerId: targetOwnerId,
                role,
                effectiveDate,
              },
              actionUser
            );

      if (response?.success === false) {
        throw new Error(
          response?.message ||
            (currentAction === 'assign'
              ? 'Failed to assign owner'
              : 'Failed to change owner')
        );
      }

      await reloadDetail();
      setShowAssignOwner(null);
      setActionMsg(
        currentAction === 'assign'
          ? 'Owner assigned successfully'
          : 'Owner changed successfully'
      );
      setTimeout(() => setActionMsg(''), 3000);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : currentAction === 'assign'
            ? 'Failed to assign owner'
            : 'Failed to change owner';

      setOwnerActionError(message);
    } finally {
      setOwnerActionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {loading && <div className="p-3 text-sm text-gray-600">Loading franchise details...</div>}
      {error && <div className="p-3 text-sm text-red-600">{error}</div>}
      {actionMsg && <div className="p-3 text-sm text-green-700">{actionMsg}</div>}

      <div>
        <button
          onClick={() => navigate('/admin/franchises')}
          className="mb-4 flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-amber-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Franchise List
        </button>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-amber-100 p-3">
              <Building2 className="h-8 w-8 text-amber-600" />
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {franchise.franchiseName}
                </h1>
                <FranchiseStatusBadge
                  status={franchise.status}
                  className="px-3 py-1 text-xs font-semibold"
                />
              </div>
              <p className="mt-0.5 font-mono text-sm text-gray-500">
                {franchise.franchiseCode}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Edit2 className="h-4 w-4" />
              Edit
            </button>

            {normalizedFranchiseStatus !== 'ACTIVE' && (
              <button
                onClick={handleActivate}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white ${
                  actionLoading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                <Power className="h-4 w-4" />
                {actionLoading ? 'Processing...' : 'Activate'}
              </button>
            )}

            {normalizedFranchiseStatus === 'ACTIVE' && (
              <button
                onClick={handleDeactivate}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-white ${
                  actionLoading ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                <Ban className="h-4 w-4" />
                {actionLoading ? 'Processing...' : 'Deactivate'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-amber-600 text-amber-700'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Identity</h3>
            <dl className="space-y-3">
              {[
                { icon: Shield, label: 'Franchise ID', value: franchise.franchiseId },
                { icon: Building2, label: 'Code', value: franchise.franchiseCode },
                { icon: MapPin, label: 'Address', value: franchise.address },
                { icon: Globe, label: 'Region', value: franchise.region },
                { icon: Clock, label: 'Timezone', value: franchise.timezone },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-medium text-gray-900">{value}</p>
                  </div>
                </div>
              ))}
            </dl>
          </div>

          <div className="space-y-6">
            {currentOwnerSection}
            {ownershipHistorySection}
          </div>
        </div>
      )}

      {activeTab === 'contracts' && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900">Contracts</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void loadFranchiseContracts(true)}
                disabled={contractsLoading}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                title="Refresh contracts"
              >
                <RefreshCw
                  className={`h-4 w-4 ${contractsLoading ? 'animate-spin' : ''}`}
                />
              </button>
              <Link
                to="/admin/contracts"
                className="flex items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-700"
              >
                <FileText className="h-4 w-4" />
                View All Contracts
              </Link>
            </div>
          </div>

          {contractsError && (
            <div className="border-b border-red-100 bg-red-50 px-6 py-4 text-sm text-red-700">
              {contractsError}
            </div>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {[
                  'Contract #',
                  'Status',
                  'Start Date',
                  'End Date',
                  'Royalty Rate',
                  'Actions',
                ].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contractsLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    Loading contracts...
                  </td>
                </tr>
              ) : contracts.length > 0 ? (
                contracts.map((contract) => (
                  <tr
                    key={contract.contractId}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {contract.contractNumber}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          contract.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {contract.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{contract.startDate}</td>
                    <td className="px-4 py-3 text-gray-600">{contract.endDate}</td>
                    <td className="px-4 py-3 text-gray-600">{contract.royaltyRate}%</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/admin/contract-detail?id=${contract.contractId}`}
                        className="text-xs text-amber-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    No contracts found for this franchise.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">Audit History</h3>
          <div className="space-y-3">
            {AUDIT.map((entry, index) => (
              <div key={entry.timestamp} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-amber-500" />
                  {index < AUDIT.length - 1 && <div className="mt-1 w-px flex-1 bg-gray-200" />}
                </div>
                <div className="pb-4">
                  <p className="text-xs text-gray-500">
                    {entry.timestamp} - {entry.actor}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-gray-900">
                    {entry.action.replaceAll('_', ' ')}
                  </p>
                  <p className="text-sm text-gray-600">{entry.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showEdit && (
        <EditIdentityDrawer franchise={franchise} onClose={() => setShowEdit(false)} />
      )}
      {showAssignOwner && (
        <AssignOwnerModal
          action={showAssignOwner}
          currentOwner={currentOwner}
          error={ownerActionError}
          onClose={() => {
            if (ownerActionLoading) return;
            setOwnerActionError('');
            setShowAssignOwner(null);
          }}
          onConfirm={handleOwnerSubmit}
          submitting={ownerActionLoading}
        />
      )}
    </div>
  );
}
