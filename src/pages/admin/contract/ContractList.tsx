import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  FileText,
  Eye,
  Power,
  RefreshCw,
  XOctagon,
  ChevronUp,
  ChevronDown,
  X,
  AlertTriangle,
  CheckCircle,
  Loader,
} from 'lucide-react';
import contractService, { type Contract, type CreateContractRequest, type RenewContractRequest, type TerminateContractRequest } from '../../../services/ContractService';
import api from '../../../api/axios';

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: 'Active', cls: 'bg-green-100 text-green-700' },
  DRAFT: { label: 'Draft', cls: 'bg-gray-100 text-gray-600' },
  PENDING_ACTIVATION: {
    label: 'Pending Activation',
    cls: 'bg-yellow-100 text-yellow-700',
  },
  EXPIRED: { label: 'Expired', cls: 'bg-orange-100 text-orange-700' },
  TERMINATED: { label: 'Terminated', cls: 'bg-red-100 text-red-700' },
};

const VISIBLE_STATUS_TABS = ['ALL', 'ACTIVE', 'DRAFT', 'EXPIRED'] as const;

type SortKey =
  | 'contractNumber'
  | 'franchiseCode'
  | 'status'
  | 'startDate'
  | 'endDate'
  | 'createdAt';

// ── Helper ───────────────────────────────────────────────────────────────────
function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
}

function getTodayDateInputValue(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ── Create Contract Modal ─────────────────────────────────────────────────────
function CreateContractModal({
  onClose,
  onSuccess,
}: Readonly<{ onClose: () => void; onSuccess: () => void }>) {
  const todayDate = useMemo(() => getTodayDateInputValue(), []);
  const [form, setForm] = useState({
    franchiseId: '',
    contractNumber: '',
    startDate: todayDate,
    endDate: '',
    royaltyRate: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [franchises, setFranchises] = useState<Array<any>>([]);
  const [franchiseLoading, setFranchiseLoading] = useState(false);

  const getEndDateError = (): string => {
    if (!submitted) return '';
    if (!form.endDate) return 'End date is required';
    if (form.startDate && form.endDate && form.endDate <= form.startDate) {
      return 'End date must be after start date';
    }
    return '';
  };

  const getRoyaltyRateError = (): string => {
    if (!submitted) return '';
    if (!form.royaltyRate) return 'Royalty rate is required';
    if (Number(form.royaltyRate) < 0 || Number(form.royaltyRate) > 100) {
      return 'Must be 0–100';
    }
    return '';
  };

  const errors = {
    franchiseId: submitted && !form.franchiseId ? 'Franchise is required' : '',
    contractNumber:
      submitted && !form.contractNumber ? 'Contract number is required' : '',
    startDate:
      submitted && !form.startDate
        ? 'Start date is required'
        : submitted && form.startDate < todayDate
          ? 'Start date cannot be earlier than today'
          : '',
    endDate: getEndDateError(),
    royaltyRate: getRoyaltyRateError(),
  };

  const hasErrors = Object.values(errors).some(Boolean);

  useEffect(() => {
    let mounted = true;
    async function loadFranchises() {
      setFranchiseLoading(true);
      try {
        const res = await api.get('/api/franchise-service/franchises');
        // Support both paginated and plain-array responses
        const data = res?.data ?? res;
        let items = [];
        if (Array.isArray(data)) items = data;
        else if (data?.content && Array.isArray(data.content)) items = data.content;
        else if (data?.data && Array.isArray(data.data)) items = data.data;

        if (mounted) setFranchises(items);
      } catch (err) {
        console.error('Failed to load franchises for contract dropdown', err);
      } finally {
        if (mounted) setFranchiseLoading(false);
      }
    }

    loadFranchises();
    return () => {
      mounted = false;
    };
  }, []);

  const handleStartDateChange = (startDate: string) => {
    setForm((current) => ({
      ...current,
      startDate,
      endDate:
        current.endDate && current.endDate <= startDate ? '' : current.endDate,
    }));
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    setError('');

    if (
      !hasErrors &&
      form.franchiseId &&
      form.contractNumber &&
      form.startDate &&
      form.endDate &&
      form.royaltyRate
    ) {
      setLoading(true);
      try {
        const payload: CreateContractRequest = {
          franchiseId: form.franchiseId,
          contractNumber: form.contractNumber,
          startDate: form.startDate,
          endDate: form.endDate,
          royaltyRate: Number(form.royaltyRate),
        };
        await contractService.createContract(payload);
        setSuccess(true);
        onSuccess();
      } catch (err: unknown) {
        const message = getErrorMessage(err, 'Failed to create contract');
        setError(message);
      } finally {
        setLoading(false);
      }
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
          <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
          <p className="text-lg font-semibold text-gray-900">Contract Created</p>
          <p className="mt-1 text-sm text-gray-600">
            Contract <strong>{form.contractNumber}</strong> has been created as Draft.
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
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900">Create Contract</h2>
          <button onClick={onClose} type="button">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label
              htmlFor="cc-franchise"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Franchise <span className="text-red-500">*</span>
            </label>
            <div>
              <select
                id="cc-franchise"
                value={form.franchiseId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, franchiseId: e.target.value }))
                }
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  errors.franchiseId ? 'border-red-400 bg-red-50' : 'border-gray-200'
                }`}
              >
                <option value="">Select franchise...</option>
                {franchiseLoading && <option>Loading franchises...</option>}
                {!franchiseLoading && franchises.map((f: any) => {
                  const id = f.franchiseId ?? f.id ?? f.franchise_id ?? f.franchiseId;
                  const name = f.franchiseName ?? f.name ?? f.franchiseCode ?? f.code ?? String(id);
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>
            {errors.franchiseId && (
              <p className="mt-1 text-xs text-red-600">{errors.franchiseId}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="cc-number"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Contract Number <span className="text-red-500">*</span>
            </label>
            <input
              id="cc-number"
              type="text"
              value={form.contractNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, contractNumber: e.target.value }))
              }
              placeholder="CTR-2026-XXX"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                errors.contractNumber ? 'border-red-400 bg-red-50' : 'border-gray-200'
              }`}
            />
            {errors.contractNumber && (
              <p className="mt-1 text-xs text-red-600">{errors.contractNumber}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="cc-start"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                id="cc-start"
                type="date"
                value={form.startDate}
                min={todayDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  errors.startDate ? 'border-red-400 bg-red-50' : 'border-gray-200'
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="cc-end"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                id="cc-end"
                type="date"
                value={form.endDate}
                min={form.startDate || todayDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endDate: e.target.value }))
                }
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  errors.endDate ? 'border-red-400 bg-red-50' : 'border-gray-200'
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="cc-royalty"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Royalty Rate (%) <span className="text-red-500">*</span>
            </label>
            <input
              id="cc-royalty"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.royaltyRate}
              onChange={(e) =>
                setForm((f) => ({ ...f, royaltyRate: e.target.value }))
              }
              placeholder="e.g. 5.5"
              className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                errors.royaltyRate ? 'border-red-400 bg-red-50' : 'border-gray-200'
              }`}
            />
            {errors.royaltyRate && (
              <p className="mt-1 text-xs text-red-600">{errors.royaltyRate}</p>
            )}
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
            type="button"
            className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            type="button"
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white ${
              loading
                ? 'cursor-not-allowed bg-amber-400'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {loading && <Loader className="h-4 w-4 animate-spin" />}
            Create Contract
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Activate Contract Dialog ──────────────────────────────────────────────────
function ActivateDialog({
  contract,
  onClose,
  contracts,
  onSuccess,
}: Readonly<{
  contract: Contract;
  onClose: () => void;
  contracts: Contract[];
  onSuccess: () => void;
}>) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasActiveContract = contracts.some(
    (c) => c.franchiseId === contract.franchiseId && c.status === 'ACTIVE',
  );

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
          <p className="font-semibold text-gray-900">Contract Activated</p>
          <button
            onClick={onClose}
            type="button"
            className="mt-4 rounded-lg bg-amber-600 px-6 py-2 font-medium text-white"
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
          <h2 className="text-xl font-bold text-gray-900">Activate Contract</h2>
          <button onClick={onClose} type="button">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-3 p-6">
          <p className="text-sm text-gray-600">
            Contract: <strong className="text-gray-900">{contract.contractNumber}</strong>
          </p>
          <p className="text-sm text-gray-600">
            Franchise: <strong className="text-gray-900">{contract.franchiseCode}</strong>
          </p>

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {hasActiveContract && !error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
              <p className="text-sm text-red-700">
                This franchise already has an active contract. Activating this will
                replace it.
              </p>
            </div>
          )}

          {!hasActiveContract && !error && (
            <div className="flex items-start gap-2 rounded-lg bg-green-50 p-3">
              <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              <p className="text-sm text-green-700">
                No conflicting active contract found. Ready to activate.
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
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium text-white ${
              loading
                ? 'cursor-not-allowed bg-green-400'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader className="h-4 w-4 animate-spin" />
                Activate
              </span>
            ) : (
              'Activate'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Renew Contract Dialog ─────────────────────────────────────────────────────
function RenewDialog({
  contract,
  onClose,
  onSuccess,
}: Readonly<{ contract: Contract; onClose: () => void; onSuccess: () => void }>) {
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
        const payload: RenewContractRequest = { newEndDate };
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
          <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-500" />
          <p className="font-semibold text-gray-900">Contract Renewed</p>
          <p className="mt-1 text-sm text-gray-600">
            New end date: <strong>{newEndDate}</strong>
          </p>
          <button
            onClick={onClose}
            type="button"
            className="mt-4 rounded-lg bg-amber-600 px-6 py-2 font-medium text-white"
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
          <h2 className="text-xl font-bold text-gray-900">Renew Contract</h2>
          <button onClick={onClose} type="button">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="rounded-lg bg-gray-50 p-3 text-sm">
            <span className="text-gray-500">Current end date:</span>
            <span className="ml-2 font-semibold text-gray-900">{contract.endDate}</span>
          </div>

          <div>
            <label
              htmlFor="renew-end"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              New End Date <span className="text-red-500">*</span>
            </label>
            <input
              id="renew-end"
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

// ── Terminate Contract Dialog ─────────────────────────────────────────────────
function TerminateDialog({
  contract,
  onClose,
  onSuccess,
}: Readonly<{ contract: Contract; onClose: () => void; onSuccess: () => void }>) {
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
          <p className="font-semibold text-gray-900">Contract Terminated</p>
          <button
            onClick={onClose}
            type="button"
            className="mt-4 rounded-lg bg-amber-600 px-6 py-2 font-medium text-white"
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
          <h2 className="text-xl font-bold text-gray-900">Terminate Contract</h2>
          <button onClick={onClose} type="button">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
            <p className="text-sm text-red-700">
              <strong>This action is irreversible.</strong> The contract will be
              permanently terminated.
            </p>
          </div>

          <div>
            <label
              htmlFor="terminate-reason"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Termination Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              id="terminate-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the reason for termination..."
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
            Terminate
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function ContractList() {
  const navigate = useNavigate();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 6;

  const [showCreate, setShowCreate] = useState(false);
  const [activateTarget, setActivateTarget] = useState<Contract | null>(null);
  const [renewTarget, setRenewTarget] = useState<Contract | null>(null);
  const [terminateTarget, setTerminateTarget] = useState<Contract | null>(null);

  const fetchContracts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await contractService.getContractList();
      const data = response.data?.data;

      if (data && 'content' in data && Array.isArray(data.content)) {
        setContracts(data.content);
      } else if (Array.isArray(data)) {
        setContracts(data);
      } else {
        setContracts([]);
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to load contracts');
      setError(message);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleRefresh = async () => {
    await fetchContracts();
  };

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let list = [...contracts];

    if (search) {
      const keyword = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.contractNumber?.toLowerCase().includes(keyword) ||
          c.franchiseCode?.toLowerCase().includes(keyword) ||
          c.franchiseName?.toLowerCase().includes(keyword),
      );
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((c) => c.status === statusFilter);
    }

    list.sort((a, b) => {
      const av = (a[sortKey] ?? '') as string | number;
      const bv = (b[sortKey] ?? '') as string | number;
      const aVal = String(av);
      const bVal = String(bv);

      return sortDir === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });

    return list;
  }, [contracts, search, statusFilter, sortKey, sortDir]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const getSortChevron = (colKey: SortKey) => {
    if (colKey !== sortKey) return <ChevronUp className="h-3 w-3 opacity-20" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3 w-3 text-amber-600" />
    ) : (
      <ChevronDown className="h-3 w-3 text-amber-600" />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contract Management</h1>
          <p className="mt-1 text-gray-600">Search & manage franchise contracts</p>
        </div>
        <div className="flex items-center gap-2">
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
          <button
            onClick={() => setShowCreate(true)}
            disabled={loading}
            type="button"
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Create Contract
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <p className="font-medium text-red-900">{error}</p>
            <button
              onClick={handleRefresh}
              type="button"
              className="mt-1 text-sm text-red-700 underline hover:text-red-900"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <div className="flex w-fit flex-wrap gap-1 rounded-xl bg-gray-100 p-1">
        {VISIBLE_STATUS_TABS.map(
          (s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              type="button"
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s.replace('_', ' ')}
              <span className="ml-1 text-gray-400">
                (
                {s === 'ALL'
                  ? contracts.length
                  : contracts.filter((c) => c.status === s).length}
                )
              </span>
            </button>
          ),
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by contract number or franchise..."
              disabled={loading}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader className="mx-auto mb-2 h-8 w-8 animate-spin text-amber-600" />
              <p className="text-gray-600">Loading contracts...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  {[
                    { key: 'contractNumber', label: 'Contract #' },
                    { key: 'franchiseCode', label: 'Franchise' },
                    { key: 'status', label: 'Status' },
                    { key: 'startDate', label: 'Start Date' },
                    { key: 'endDate', label: 'End Date' },
                    { key: 'createdAt', label: 'Created At' },
                  ].map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key as SortKey)}
                      className="cursor-pointer select-none px-4 py-3 text-left font-medium text-gray-600 hover:text-amber-700"
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {getSortChevron(col.key as SortKey)}
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Royalty
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {paged.map((c) => {
                  const sc = STATUS_CFG[c.status] ?? STATUS_CFG.DRAFT;

                  return (
                    <tr
                      key={c.contractId}
                      className="border-b border-gray-100 transition-colors hover:bg-amber-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {c.contractNumber}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{c.franchiseCode}</div>
                        <div className="text-xs text-gray-400">
                          {c.franchiseName ?? 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${sc.cls}`}
                        >
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{c.startDate}</td>
                      <td className="px-4 py-3 text-gray-600">{c.endDate}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{c.createdAt}</td>
                      <td className="px-4 py-3 text-gray-600">{c.royaltyRate}%</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() =>
                              navigate(`/admin/contract-detail?id=${c.contractId}`)
                            }
                            type="button"
                            title="View"
                            className="rounded-lg p-1.5 hover:bg-gray-100"
                          >
                            <Eye className="h-4 w-4 text-gray-500" />
                          </button>

                          {(c.status === 'DRAFT' ||
                            c.status === 'PENDING_ACTIVATION') && (
                            <button
                              onClick={() => setActivateTarget(c)}
                              type="button"
                              title="Activate"
                              className="rounded-lg p-1.5 hover:bg-green-50"
                            >
                              <Power className="h-4 w-4 text-green-600" />
                            </button>
                          )}

                          {c.status === 'ACTIVE' && (
                            <button
                              onClick={() => setRenewTarget(c)}
                              type="button"
                              title="Renew"
                              className="rounded-lg p-1.5 hover:bg-amber-50"
                            >
                              <RefreshCw className="h-4 w-4 text-amber-600" />
                            </button>
                          )}

                          {(c.status === 'ACTIVE' || c.status === 'DRAFT') && (
                            <button
                              onClick={() => setTerminateTarget(c)}
                              type="button"
                              title="Terminate"
                              className="rounded-lg p-1.5 hover:bg-red-50"
                            >
                              <XOctagon className="h-4 w-4 text-red-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {paged.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-500">
                      <FileText className="mx-auto mb-2 h-10 w-10 text-gray-300" />
                      <p>No contracts found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>

            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                type="button"
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  type="button"
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    page === n
                      ? 'bg-amber-600 text-white'
                      : 'border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {n}
                </button>
              ))}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                type="button"
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateContractModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            handleRefresh();
          }}
        />
      )}

      {activateTarget && (
        <ActivateDialog
          contract={activateTarget}
          contracts={contracts}
          onClose={() => setActivateTarget(null)}
          onSuccess={() => {
            setActivateTarget(null);
            handleRefresh();
          }}
        />
      )}

      {renewTarget && (
        <RenewDialog
          contract={renewTarget}
          onClose={() => setRenewTarget(null)}
          onSuccess={() => {
            setRenewTarget(null);
            handleRefresh();
          }}
        />
      )}

      {terminateTarget && (
        <TerminateDialog
          contract={terminateTarget}
          onClose={() => setTerminateTarget(null)}
          onSuccess={() => {
            setTerminateTarget(null);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}

export default ContractList;
