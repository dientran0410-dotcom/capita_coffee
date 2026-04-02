import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Calendar,
  CheckCircle,
  XOctagon,
  RefreshCw,
  AlertTriangle,
  X,
  Clock,
  User,
  Building2,
  Loader,
} from 'lucide-react';
import contractService, { type Contract, type RenewContractRequest, type TerminateContractRequest } from '../../../services/ContractService';

type ContractEvent = {
  eventId: string;
  eventType: string;
  performedBy: string;
  timestamp: string;
  note?: string;
};

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  ACTIVE: {
    label: 'Active',
    cls: 'bg-green-100 text-green-700 border-green-200',
  },
  DRAFT: {
    label: 'Draft',
    cls: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  PENDING_ACTIVATION: {
    label: 'Pending Activation',
    cls: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  EXPIRED: {
    label: 'Expired',
    cls: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  TERMINATED: {
    label: 'Terminated',
    cls: 'bg-red-100 text-red-700 border-red-200',
  },
};

const EVENT_ICONS: Record<string, string> = {
  CREATED: '📄',
  ACTIVATED: '✅',
  RENEWED: '🔄',
  TERMINATED: '🚫',
  SUBMITTED_FOR_ACTIVATION: '📤',
  UPDATED: '✏️',
};

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
}

function extractContract(payload: unknown): Contract | null {
  if (!payload || typeof payload !== 'object') return null;
  const obj = payload as Record<string, unknown>;
  if (obj?.data && typeof obj.data === 'object') {
    const data = obj.data as Record<string, unknown>;
    if (data?.data) {
      // Safe cast: we assume the backend returns the correct Contract shape
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.data as any as Contract;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data as any as Contract;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return obj as any as Contract;
}

function getContractFranchiseName(contract: Contract): string {
  const obj = contract as unknown as Record<string, unknown>;
  const name = obj?.franchiseName;
  return typeof name === 'string' ? name : 'N/A';
}

// ── Activate Dialog ────────────────────────────────────────────────────────────
function ActivateDialog({
  contract,
  onClose,
  onSuccess,
}: Readonly<{
  contract: Contract;
  onClose: () => void;
  onSuccess: () => void;
}>) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleActivate = async () => {
    setLoading(true);
    setError('');
    try {
      await contractService.activateContract(contract.contractId);
      setDone(true);
      onSuccess();
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to activate contract');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
          <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
          <p className="text-lg font-semibold text-gray-900">Contract Activated!</p>
          <p className="mt-1 text-sm text-gray-500">
            {contract.contractNumber} is now active.
          </p>
          <button
            onClick={onClose}
            className="mt-5 w-full rounded-lg bg-amber-600 py-2 font-medium text-white"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900">Activate Contract</h2>
          <button onClick={onClose} type="button">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-3 p-6">
          <p className="text-sm text-gray-600">
            Activate{' '}
            <strong className="text-gray-900">{contract.contractNumber}</strong> for
            franchise <strong>{contract.franchiseCode}</strong>?
          </p>
          <p className="text-sm text-gray-600">
            Period: <strong>{contract.startDate}</strong> →{' '}
            <strong>{contract.endDate}</strong>
          </p>

          {error ? (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : (
            <div className="rounded-lg bg-yellow-50 p-3">
              <p className="text-sm text-yellow-700">
                Once activated, this contract becomes the binding agreement for the
                franchise.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            disabled={loading}
            type="button"
            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleActivate}
            disabled={loading}
            type="button"
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white ${
              loading
                ? 'cursor-not-allowed bg-green-400'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading && <Loader className="h-4 w-4 animate-spin" />}
            Activate
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Renew Dialog ───────────────────────────────────────────────────────────────
function RenewDialog({
  contract,
  onClose,
  onSuccess,
}: Readonly<{
  contract: Contract;
  onClose: () => void;
  onSuccess: () => void;
}>) {
  const [newEndDate, setNewEndDate] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const errorMsg =
    submitted && (!newEndDate || newEndDate <= contract.endDate)
      ? 'New end date must be after current end date'
      : '';

  const handleRenew = async () => {
    setSubmitted(true);
    if (!errorMsg && newEndDate) {
      setLoading(true);
      setError('');
      try {
        const payload: RenewContractRequest = {
          newEndDate,
        };
        await contractService.renewContract(contract.contractId, payload);
        setDone(true);
        onSuccess();
      } catch (err: unknown) {
        const message = getErrorMessage(err, 'Failed to renew contract');
        setError(message);
      } finally {
        setLoading(false);
      }
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
          <RefreshCw className="mx-auto mb-3 h-12 w-12 text-amber-500" />
          <p className="text-lg font-semibold text-gray-900">Contract Renewed!</p>
          <p className="mt-1 text-sm text-gray-500">
            New end date: <strong>{newEndDate}</strong>
          </p>
          <button
            onClick={onClose}
            type="button"
            className="mt-5 w-full rounded-lg bg-amber-600 py-2 font-medium text-white"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900">Renew Contract</h2>
          <button onClick={onClose} type="button">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex justify-between rounded-lg bg-gray-50 p-3 text-sm">
            <span className="text-gray-500">Current end date</span>
            <span className="font-semibold text-gray-900">{contract.endDate}</span>
          </div>

          <div>
            <label
              htmlFor="rd-end"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              New End Date <span className="text-red-500">*</span>
            </label>
            <input
              id="rd-end"
              type="date"
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
              min={contract.endDate}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                errorMsg ? 'border-red-400 bg-red-50' : 'border-gray-200'
              }`}
            />
            {errorMsg && <p className="mt-1 text-xs text-red-600">{errorMsg}</p>}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            disabled={loading}
            type="button"
            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleRenew}
            disabled={loading}
            type="button"
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white ${
              loading
                ? 'cursor-not-allowed bg-amber-400'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {loading && <Loader className="h-4 w-4 animate-spin" />}
            Renew
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Terminate Dialog ───────────────────────────────────────────────────────────
function TerminateDialog({
  contract,
  onClose,
  onSuccess,
}: Readonly<{
  contract: Contract;
  onClose: () => void;
  onSuccess: () => void;
}>) {
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const errorMsg = submitted && !reason ? 'Termination reason is required' : '';

  const handleTerminate = async () => {
    setSubmitted(true);
    if (!errorMsg && reason) {
      setLoading(true);
      setError('');
      try {
        const payload: TerminateContractRequest = {
          terminationReason: reason,
        };
        await contractService.terminateContract(contract.contractId, payload);
        setDone(true);
        onSuccess();
      } catch (err: unknown) {
        const message = getErrorMessage(err, 'Failed to terminate contract');
        setError(message);
      } finally {
        setLoading(false);
      }
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
          <XOctagon className="mx-auto mb-3 h-12 w-12 text-red-400" />
          <p className="text-lg font-semibold text-gray-900">Terminated</p>
          <p className="mt-1 text-sm text-gray-500">
            {contract.contractNumber} has been terminated.
          </p>
          <button
            onClick={onClose}
            type="button"
            className="mt-5 w-full rounded-lg bg-gray-700 py-2 font-medium text-white"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900">Terminate Contract</h2>
          <button onClick={onClose} type="button">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex gap-2 rounded-lg bg-red-50 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-700">
              <strong>Irreversible action.</strong> The contract will be permanently
              terminated and cannot be reactivated.
            </p>
          </div>

          <div>
            <label
              htmlFor="td-reason"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              id="td-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe why this contract is being terminated..."
              className={`w-full resize-none rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                errorMsg ? 'border-red-400 bg-red-50' : 'border-gray-200'
              }`}
            />
            {errorMsg && <p className="mt-1 text-xs text-red-600">{errorMsg}</p>}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            disabled={loading}
            type="button"
            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleTerminate}
            disabled={loading}
            type="button"
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white ${
              loading
                ? 'cursor-not-allowed bg-red-400'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {loading && <Loader className="h-4 w-4 animate-spin" />}
            Terminate Contract
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function ContractDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id') ?? '';

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showActivate, setShowActivate] = useState(false);
  const [showRenew, setShowRenew] = useState(false);
  const [showTerminate, setShowTerminate] = useState(false);

  const fetchContract = useCallback(async () => {
    if (!id) {
      setError('No contract ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await contractService.getContractById(id);
      const data = extractContract(response);
      setContract(data);
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to load contract');
      setError(message);
      setContract(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContract();
  }, [id, fetchContract]);

  const handleRefresh = async () => {
    await fetchContract();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader className="mx-auto mb-2 h-8 w-8 animate-spin text-amber-600" />
          <p className="text-gray-600">Loading contract...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate(-1)}
          type="button"
          className="mb-4 flex items-center gap-2 font-medium text-amber-700 hover:text-amber-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <AlertTriangle className="mb-2 h-6 w-6 text-red-600" />
          <p className="text-red-800">{error || 'Contract not found'}</p>
          <button
            onClick={handleRefresh}
            type="button"
            className="mt-2 text-sm text-red-700 underline hover:text-red-900"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const sc = STATUS_CFG[contract.status] ?? STATUS_CFG.DRAFT;

  const canActivate =
    contract.status === 'DRAFT' || contract.status === 'PENDING_ACTIVATION';
  const canRenew = contract.status === 'ACTIVE';
  const canTerminate =
    contract.status === 'ACTIVE' || contract.status === 'DRAFT';

  const events: ContractEvent[] = Array.isArray(
    (contract as unknown as Record<string, unknown>)?.events
  )
    ? ((contract as unknown as Record<string, unknown>).events as ContractEvent[])
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/contracts')}
            type="button"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {contract.contractNumber}
              </h1>
              <span
                className={`rounded-full border px-3 py-1 text-sm font-medium ${sc.cls}`}
              >
                {sc.label}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {contract.franchiseCode} · {getContractFranchiseName(contract)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            type="button"
            className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`}
            />
          </button>

          {canActivate && (
            <button
              onClick={() => setShowActivate(true)}
              type="button"
              className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" />
              Activate
            </button>
          )}

          {canRenew && (
            <button
              onClick={() => setShowRenew(true)}
              type="button"
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              <RefreshCw className="h-4 w-4" />
              Renew
            </button>
          )}

          {canTerminate && (
            <button
              onClick={() => setShowTerminate(true)}
              type="button"
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <XOctagon className="h-4 w-4" />
              Terminate
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
              <FileText className="h-4 w-4 text-amber-600" />
              Contract Information
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Contract ID', value: contract.contractId as ReactNode },
                { label: 'Contract Number', value: contract.contractNumber as ReactNode },
                { label: 'Franchise Code', value: contract.franchiseCode as ReactNode },
                {
                  label: 'Franchise Name',
                  value: getContractFranchiseName(contract) as ReactNode,
                },
                { label: 'Royalty Rate', value: `${contract.royaltyRate}%` as ReactNode },
                {
                  label: 'Status',
                  value: (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${sc.cls}`}
                    >
                      {sc.label}
                    </span>
                  ),
                },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-gray-50 p-3">
                  <p className="mb-0.5 text-xs text-gray-500">{item.label}</p>
                  <div className="text-sm font-medium text-gray-900">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
              <Calendar className="h-4 w-4 text-amber-600" />
              Contract Duration
            </h2>

            <div className="flex items-center gap-4">
              <div className="flex-1 rounded-xl bg-amber-50 p-4 text-center">
                <p className="mb-1 text-xs text-amber-600">Start Date</p>
                <p className="text-xl font-bold text-amber-700">{contract.startDate}</p>
              </div>
              <div className="font-bold text-gray-400">→</div>
              <div className="flex-1 rounded-xl bg-gray-50 p-4 text-center">
                <p className="mb-1 text-xs text-gray-500">End Date</p>
                <p className="text-xl font-bold text-gray-700">{contract.endDate}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
              <Clock className="h-4 w-4 text-amber-600" />
              Event History
            </h2>

            {events.length === 0 ? (
              <p className="text-sm text-gray-500">No event history available.</p>
            ) : (
              <div className="space-y-4">
                {events.map((ev, index) => (
                  <div key={ev.eventId ?? `${ev.eventType}-${index}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-base">
                        {EVENT_ICONS[ev.eventType] ?? '📋'}
                      </div>
                      <div className="mt-1 w-px flex-1 bg-gray-200" />
                    </div>

                    <div className="pb-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {ev.eventType.replaceAll('_', ' ')}
                      </p>
                      {ev.note && (
                        <p className="mt-0.5 text-xs text-gray-500">{ev.note}</p>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-400">{ev.performedBy}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{ev.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
              <Building2 className="h-4 w-4 text-amber-600" />
              Franchise
            </h2>

            <p className="text-sm font-semibold text-gray-900">
              {getContractFranchiseName(contract)}
            </p>
            <p className="mt-1 text-xs text-gray-500">{contract.franchiseCode}</p>

            <button
              onClick={() =>
                navigate(`/admin/franchise-detail?id=${contract.franchiseId}`)
              }
              type="button"
              className="mt-3 w-full rounded-lg bg-amber-50 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
            >
              View Franchise
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-gray-900">Metadata</h2>

            {[
              { label: 'Created By', value: contract.createdBy ?? 'N/A' },
              { label: 'Created At', value: contract.createdAt ?? 'N/A' },
              { label: 'Last Updated', value: contract.updatedAt ?? 'N/A' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex justify-between border-b border-gray-100 py-2 last:border-0"
              >
                <span className="text-xs text-gray-500">{item.label}</span>
                <span className="text-xs font-medium text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showActivate && (
        <ActivateDialog
          contract={contract}
          onClose={() => setShowActivate(false)}
          onSuccess={() => {
            setShowActivate(false);
            handleRefresh();
          }}
        />
      )}

      {showRenew && (
        <RenewDialog
          contract={contract}
          onClose={() => setShowRenew(false)}
          onSuccess={() => {
            setShowRenew(false);
            handleRefresh();
          }}
        />
      )}

      {showTerminate && (
        <TerminateDialog
          contract={contract}
          onClose={() => setShowTerminate(false)}
          onSuccess={() => {
            setShowTerminate(false);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}

export default ContractDetail;