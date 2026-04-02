import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  Loader,
  RefreshCw,
  Search,
} from 'lucide-react';
import type { Contract } from '@/services/ContractService';
import {
  getManagerContractScope,
  resolveOwnedFranchise,
  type ManagerOwnedFranchise,
} from '@/services/managerContractService';

const STATUS_META: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Active', className: 'bg-green-100 text-green-700' },
  DRAFT: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
  PENDING_ACTIVATION: {
    label: 'Pending Activation',
    className: 'bg-yellow-100 text-yellow-700',
  },
  EXPIRED: { label: 'Expired', className: 'bg-orange-100 text-orange-700' },
  TERMINATED: { label: 'Terminated', className: 'bg-red-100 text-red-700' },
};

type SortKey =
  | 'contractNumber'
  | 'status'
  | 'startDate'
  | 'endDate'
  | 'createdAt';

const PAGE_SIZE = 6;

const getStatusMeta = (status: string) =>
  STATUS_META[status] ?? STATUS_META.DRAFT;

export function ManagerContractList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedFranchiseId = String(searchParams.get('franchiseId') ?? '').trim();

  const [franchises, setFranchises] = useState<ManagerOwnedFranchise[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const selectedFranchise = useMemo(
    () => resolveOwnedFranchise(franchises, requestedFranchiseId),
    [franchises, requestedFranchiseId],
  );

  const loadContracts = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const scope = await getManagerContractScope();
      setFranchises(scope.franchises);
      setContracts(scope.contracts);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load contracts');
      setFranchises([]);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  useEffect(() => {
    if (loading || !selectedFranchise?.franchiseId) return;
    if (requestedFranchiseId === selectedFranchise.franchiseId) return;

    setSearchParams(
      { franchiseId: selectedFranchise.franchiseId },
      { replace: true },
    );
  }, [loading, requestedFranchiseId, selectedFranchise, setSearchParams]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, requestedFranchiseId]);

  const scopedContracts = useMemo(() => {
    if (!selectedFranchise?.franchiseId) return [];
    return contracts.filter(
      (item) => item.franchiseId === selectedFranchise.franchiseId,
    );
  }, [contracts, selectedFranchise]);

  const filteredContracts = useMemo(() => {
    let list = [...scopedContracts];

    if (search) {
      const keyword = search.toLowerCase();
      list = list.filter(
        (item) =>
          item.contractNumber?.toLowerCase().includes(keyword) ||
          item.franchiseCode?.toLowerCase().includes(keyword) ||
          item.franchiseName?.toLowerCase().includes(keyword),
      );
    }

    if (statusFilter !== 'ALL') {
      list = list.filter((item) => item.status === statusFilter);
    }

    list.sort((left, right) => {
      const leftValue = String(left[sortKey] ?? '');
      const rightValue = String(right[sortKey] ?? '');

      return sortDir === 'asc'
        ? leftValue.localeCompare(rightValue)
        : rightValue.localeCompare(leftValue);
    });

    return list;
  }, [scopedContracts, search, statusFilter, sortKey, sortDir]);

  const pagedContracts = filteredContracts.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const totalPages = Math.ceil(filteredContracts.length / PAGE_SIZE);

  const statusCounts = useMemo(
    () => ({
      ALL: scopedContracts.length,
      ACTIVE: scopedContracts.filter((item) => item.status === 'ACTIVE').length,
      DRAFT: scopedContracts.filter((item) => item.status === 'DRAFT').length,
      PENDING_ACTIVATION: scopedContracts.filter(
        (item) => item.status === 'PENDING_ACTIVATION',
      ).length,
      TERMINATED: scopedContracts.filter(
        (item) => item.status === 'TERMINATED',
      ).length,
      EXPIRED: scopedContracts.filter((item) => item.status === 'EXPIRED').length,
    }),
    [scopedContracts],
  );

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDir('asc');
  };

  const renderSortIcon = (key: SortKey) => {
    if (key !== sortKey) {
      return <ChevronUp className="h-3 w-3 opacity-20" />;
    }

    return sortDir === 'asc' ? (
      <ChevronUp className="h-3 w-3 text-amber-600" />
    ) : (
      <ChevronDown className="h-3 w-3 text-amber-600" />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/manager/franchises')}
            type="button"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">Franchise Contracts</h1>
            <p className="mt-1 text-gray-600">
              Read-only contracts filtered by the franchises assigned to your manager
              account
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            Read-only
          </span>
          <button
            onClick={loadContracts}
            disabled={loading}
            type="button"
            className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50"
            title="Refresh contracts"
          >
            <RefreshCw
              className={`h-5 w-5 text-gray-600 ${loading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
          <div>
            <p className="font-medium text-red-900">{error}</p>
            <button
              onClick={loadContracts}
              type="button"
              className="mt-1 text-sm text-red-700 underline hover:text-red-900"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
              <FileText className="h-5 w-5 text-amber-600" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500">Current scope</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {selectedFranchise?.franchiseName || 'No franchise mapped'}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {selectedFranchise
                  ? `${selectedFranchise.franchiseCode} • ${selectedFranchise.region || 'N/A'}`
                  : 'Only contracts whose franchiseId matches your managed store are shown here.'}
              </p>
              {selectedFranchise?.address && (
                <p className="mt-2 text-sm text-gray-600">{selectedFranchise.address}</p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <label
            htmlFor="manager-contract-franchise"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Franchise
          </label>
          <select
            id="manager-contract-franchise"
            value={selectedFranchise?.franchiseId ?? ''}
            onChange={(event) =>
              setSearchParams({ franchiseId: event.target.value })
            }
            disabled={loading || franchises.length === 0}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
          >
            {franchises.length === 0 && <option value="">No franchise available</option>}
            {franchises.map((franchise) => (
              <option key={franchise.franchiseId} value={franchise.franchiseId}>
                {franchise.franchiseCode} - {franchise.franchiseName}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-gray-500">
            The contract list below stays restricted to the selected owned franchise.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {[
          { key: 'ALL', label: 'Total' },
          { key: 'ACTIVE', label: 'Active' },
          { key: 'DRAFT', label: 'Draft' },
          { key: 'PENDING_ACTIVATION', label: 'Pending' },
          { key: 'TERMINATED', label: 'Terminated' },
          { key: 'EXPIRED', label: 'Expired' },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setStatusFilter(item.key)}
            type="button"
            className={`rounded-xl border p-4 text-left transition-all ${
              statusFilter === item.key
                ? 'border-amber-300 bg-amber-50 ring-2 ring-amber-100'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <p className="text-2xl font-bold text-gray-900">
              {statusCounts[item.key as keyof typeof statusCounts]}
            </p>
            <p className="mt-0.5 text-sm text-gray-500">{item.label}</p>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by contract number or franchise code..."
              disabled={loading}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
            />
          </div>

          <p className="text-sm text-gray-500">
            {selectedFranchise
              ? `Showing contracts for ${selectedFranchise.franchiseCode}`
              : 'No franchise selected'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-14">
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
                    { key: 'status', label: 'Status' },
                    { key: 'startDate', label: 'Start Date' },
                    { key: 'endDate', label: 'End Date' },
                    { key: 'createdAt', label: 'Created At' },
                  ].map((column) => (
                    <th
                      key={column.key}
                      onClick={() => handleSort(column.key as SortKey)}
                      className="cursor-pointer select-none px-4 py-3 text-left font-medium text-gray-600 hover:text-amber-700"
                    >
                      <span className="flex items-center gap-1">
                        {column.label}
                        {renderSortIcon(column.key as SortKey)}
                      </span>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Franchise
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">
                    Royalty
                  </th>
                  {/* Actions column removed per request */}
                </tr>
              </thead>

              <tbody>
                {pagedContracts.map((contract) => {
                  const statusMeta = getStatusMeta(contract.status);

                  return (
                    <tr
                      key={contract.contractId}
                      className="border-b border-gray-100 transition-colors hover:bg-amber-50"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {contract.contractNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{contract.startDate}</td>
                      <td className="px-4 py-3 text-gray-600">{contract.endDate}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {contract.createdAt}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {contract.franchiseCode}
                        </div>
                        <div className="text-xs text-gray-400">
                          {contract.franchiseName || selectedFranchise?.franchiseName || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {contract.royaltyRate}%
                      </td>
                      {/* Actions cell removed: view button intentionally omitted */}
                    </tr>
                  );
                })}

                {pagedContracts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center text-gray-500">
                      <Building2 className="mx-auto mb-2 h-10 w-10 text-gray-300" />
                      <p className="font-medium text-gray-700">
                        No contracts found for this franchise
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        The manager view only displays contracts whose franchiseId
                        matches your assigned store.
                      </p>
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
              Showing {(page - 1) * PAGE_SIZE + 1}-
              {Math.min(page * PAGE_SIZE, filteredContracts.length)} of{' '}
              {filteredContracts.length}
            </p>

            <div className="flex gap-1">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                type="button"
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => setPage(item)}
                    type="button"
                    className={`rounded-lg px-3 py-1.5 text-sm ${
                      page === item
                        ? 'bg-amber-600 text-white'
                        : 'border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}

              <button
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
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
    </div>
  );
}

export default ManagerContractList;
