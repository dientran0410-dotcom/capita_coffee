import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  FileText,
  Loader,
  User,
} from 'lucide-react';
import contractService, { type Contract } from '@/services/ContractService';
import {
  getManagerContractScope,
  resolveOwnedFranchise,
  type ManagerOwnedFranchise,
} from '@/services/managerContractService';

type ContractEvent = {
  eventId: string;
  eventType: string;
  performedBy: string;
  timestamp: string;
  note?: string;
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: 'Active',
    className: 'bg-green-100 text-green-700 border-green-200',
  },
  DRAFT: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  PENDING_ACTIVATION: {
    label: 'Pending Activation',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  EXPIRED: {
    label: 'Expired',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  TERMINATED: {
    label: 'Terminated',
    className: 'bg-red-100 text-red-700 border-red-200',
  },
};

const EVENT_ICONS: Record<string, string> = {
  CREATED: 'DOC',
  ACTIVATED: 'ON',
  RENEWED: 'RE',
  TERMINATED: 'OFF',
  SUBMITTED_FOR_ACTIVATION: 'PEN',
  UPDATED: 'UP',
};

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const getStatusMeta = (status: string) =>
  STATUS_META[status] ?? STATUS_META.DRAFT;

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
};

const extractContract = (payload: unknown): Contract | null => {
  const root = toRecord(payload);
  const level1 = toRecord(root.data);
  const level2 = toRecord(level1.data);

  const source =
    [level2, level1, root].find((candidate) => Boolean(candidate.contractId)) ??
    null;

  return source ? (source as Contract) : null;
};

const getOptionalValue = (contract: Contract, key: string): string => {
  const value = toRecord(contract)[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : 'N/A';
};

export function ManagerContractDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contractId = String(searchParams.get('id') ?? '').trim();
  const requestedFranchiseId = String(
    searchParams.get('franchiseId') ?? '',
  ).trim();

  const [contract, setContract] = useState<Contract | null>(null);
  const [franchises, setFranchises] = useState<ManagerOwnedFranchise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const ownedFranchise = useMemo(
    () => resolveOwnedFranchise(franchises, contract?.franchiseId ?? requestedFranchiseId),
    [contract?.franchiseId, franchises, requestedFranchiseId],
  );

  const loadContract = useCallback(async () => {
    if (!contractId) {
      setError('No contract ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const scope = await getManagerContractScope();
      setFranchises(scope.franchises);

      const matchedSummary =
        scope.contracts.find((item) => item.contractId === contractId) ?? null;

      if (!matchedSummary) {
        throw new Error(
          'This contract is not mapped to the franchises assigned to your manager account.',
        );
      }

      const detailResponse = await contractService.getContractById(contractId);
      const detailedContract = extractContract(detailResponse);

      if (!detailedContract) {
        setContract(matchedSummary);
        return;
      }

      const effectiveFranchiseId = String(
        detailedContract.franchiseId ?? matchedSummary.franchiseId ?? '',
      ).trim();

      if (
        effectiveFranchiseId &&
        !scope.franchiseIds.includes(effectiveFranchiseId)
      ) {
        throw new Error(
          'This contract is outside the franchises assigned to your manager account.',
        );
      }

      setContract({
        ...matchedSummary,
        ...detailedContract,
      });
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load contract'));
      setContract(null);
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => {
    loadContract();
  }, [loadContract]);

  const events: ContractEvent[] = Array.isArray(toRecord(contract)?.events)
    ? (toRecord(contract).events as ContractEvent[])
    : [];

  const backToList = () => {
    const franchiseId = String(contract?.franchiseId ?? requestedFranchiseId).trim();
    if (franchiseId) {
      navigate(`/manager/contracts?franchiseId=${franchiseId}`);
      return;
    }
    navigate('/manager/contracts');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <Loader className="mx-auto mb-2 h-8 w-8 animate-spin text-amber-600" />
          <p className="text-gray-600">Loading contract detail...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="space-y-4">
        <button
          onClick={backToList}
          type="button"
          className="flex items-center gap-2 font-medium text-amber-700 hover:text-amber-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to contracts
        </button>

        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <AlertTriangle className="mb-2 h-6 w-6 text-red-600" />
          <p className="font-medium text-red-900">
            {error || 'Contract not found'}
          </p>
          <button
            onClick={loadContract}
            type="button"
            className="mt-2 text-sm text-red-700 underline hover:text-red-900"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const statusMeta = getStatusMeta(contract.status);
  const contractFields: Array<{ label: string; value: ReactNode }> = [
    { label: 'Contract ID', value: contract.contractId },
    { label: 'Contract Number', value: contract.contractNumber },
    { label: 'Franchise Code', value: contract.franchiseCode },
    {
      label: 'Franchise Name',
      value: contract.franchiseName || ownedFranchise?.franchiseName || 'N/A',
    },
    { label: 'Royalty Rate', value: `${contract.royaltyRate}%` },
    {
      label: 'Status',
      value: (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusMeta.className}`}
        >
          {statusMeta.label}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={backToList}
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
                className={`rounded-full border px-3 py-1 text-sm font-medium ${statusMeta.className}`}
              >
                {statusMeta.label}
              </span>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                Read-only
              </span>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              {contract.franchiseCode} •{' '}
              {contract.franchiseName || ownedFranchise?.franchiseName || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-gray-900">
              <FileText className="h-4 w-4 text-amber-600" />
              Contract Information
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {contractFields.map((item) => (
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
              <div className="font-bold text-gray-400">to</div>
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
              <p className="text-sm text-gray-500">
                No event history is available for this contract.
              </p>
            ) : (
              <div className="space-y-4">
                {events.map((event, index) => (
                  <div
                    key={event.eventId ?? `${event.eventType}-${index}`}
                    className="flex gap-3"
                  >
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-[10px] font-semibold text-amber-700">
                        {EVENT_ICONS[event.eventType] ?? 'LOG'}
                      </div>
                      <div className="mt-1 w-px flex-1 bg-gray-200" />
                    </div>

                    <div className="pb-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {event.eventType.replaceAll('_', ' ')}
                      </p>
                      {event.note && (
                        <p className="mt-0.5 text-xs text-gray-500">{event.note}</p>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {event.performedBy}
                        </span>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-400">
                          {event.timestamp}
                        </span>
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
              {ownedFranchise?.franchiseName || contract.franchiseName || 'N/A'}
            </p>
            <p className="mt-1 text-xs text-gray-500">{contract.franchiseCode}</p>
            {ownedFranchise?.address && (
              <p className="mt-3 text-sm text-gray-600">{ownedFranchise.address}</p>
            )}

            <button
              onClick={() =>
                navigate(`/manager/franchise-detail?id=${contract.franchiseId}`)
              }
              type="button"
              className="mt-4 w-full rounded-lg bg-amber-50 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
            >
              View Franchise
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-gray-900">Metadata</h2>

            {[
              { label: 'Created By', value: contract.createdBy ?? 'N/A' },
              { label: 'Created At', value: contract.createdAt ?? 'N/A' },
              { label: 'Last Updated', value: getOptionalValue(contract, 'updatedAt') },
              { label: 'Activated At', value: getOptionalValue(contract, 'activatedAt') },
              { label: 'Terminated At', value: getOptionalValue(contract, 'terminatedAt') },
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
    </div>
  );
}

export default ManagerContractDetail;
