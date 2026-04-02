import React, { useCallback, useEffect, useState } from 'react';
import type { FranchiseStaffDetail } from '../../services/franchiseStaffService';
import {
  assignStaffToFranchise,
  removeStaffFromFranchise,
  getFranchiseStaffDetails,
} from '../../services/franchiseStaffService';
import { getAllStaffs } from '../../services/staffService';
import { getAllCustomerProfiles } from '../../services/customerService';
import franchiseService from '../../services/franchiseService';

type ApiStaff = Record<string, unknown> & {
  id?: string;
  name?: string;
  email?: string;
  staffCode?: string;
  status?: string;
};

export type StaffManagementProps = {
  franchiseId: string;
  franchiseName?: string;
};

type LoadingState = 'idle' | 'loading' | 'success' | 'error';

const readText = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return '';
};

const mergeStaffOptions = (items: ApiStaff[]): ApiStaff[] => {
  const seenIds = new Set<string>();

  return items.filter((item) => {
    const id = readText(item.id);
    if (!id || seenIds.has(id)) return false;
    seenIds.add(id);
    return true;
  });
};

export const FranchiseStaffManagement: React.FC<StaffManagementProps> = ({
  franchiseId,
  franchiseName,
}) => {
  const [staffMappings, setStaffMappings] = useState<FranchiseStaffDetail[]>([]);
  const [availableStaffs, setAvailableStaffs] = useState<ApiStaff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [assigningStaffId, setAssigningStaffId] = useState<string | null>(null);
  const [removingStaffId, setRemovingStaffId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadStaffMappings = useCallback(async () => {
    try {
      setLoadingState('loading');
      setError(null);
      const data = await getFranchiseStaffDetails(franchiseId);
      setStaffMappings(data);
      setLoadingState('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load staff';
      setError(message);
      setLoadingState('error');
    }
  }, [franchiseId]);

  const loadAvailableStaffs = useCallback(async () => {
    try {
      const response = await getAllStaffs(0, 1000);
      const staffList = (response.content ?? []) as ApiStaff[];

      let managerCandidates: ApiStaff[] = [];

      try {
        const customerResponse = await getAllCustomerProfiles();
        const managerAccounts = Array.isArray(customerResponse?.data)
          ? customerResponse.data.filter(
              (item) =>
                readText(item?.role).toUpperCase() === 'MANAGER' &&
                readText(item?.status).toUpperCase() === 'ACTIVE'
            )
          : [];

        const resolvedManagers = await Promise.allSettled(
          managerAccounts.map(async (account) => {
            const userId = readText(account?.id);
            if (!userId) return null;

            const profile = await franchiseService.getOwnerProfile(userId);
            const staffId = readText(profile?.staffId, profile?.id);

            if (!staffId) return null;

            return {
              id: staffId,
              name: readText(profile?.name, account?.name, userId) || userId,
              email: readText(profile?.email, account?.email),
              staffCode: readText(profile?.staffCode),
              status: readText(profile?.status, account?.status),
            } as ApiStaff;
          })
        );

        managerCandidates = resolvedManagers
          .filter((result) => result.status === 'fulfilled' && result.value)
          .map((result) => result.value as ApiStaff);
      } catch (err) {
        console.warn('Failed to load manager candidates from account list:', err);
      }

      setAvailableStaffs(mergeStaffOptions([...staffList, ...managerCandidates]));
    } catch (err) {
      console.error('Failed to load available staffs:', err);
    }
  }, []);

  // Load staff mappings for the franchise
  useEffect(() => {
    void loadStaffMappings();
  }, [loadStaffMappings]);

  // Load available staff
  useEffect(() => {
    void loadAvailableStaffs();
  }, [loadAvailableStaffs]);

  const handleAssignStaff = async () => {
    if (!selectedStaffId) {
      setError('Please select a staff member');
      return;
    }

    try {
      setAssigningStaffId(selectedStaffId);
      setError(null);
      await assignStaffToFranchise(franchiseId, selectedStaffId);
      setSuccessMessage('Staff assigned successfully');
      setSelectedStaffId('');
      await loadStaffMappings();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const message =
        (err instanceof Error ? err.message : '') ||
        readText(
          (err as { message?: unknown })?.message,
          (err as { error?: { message?: unknown } })?.error?.message,
          (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
        ) ||
        'Failed to assign staff';
      setError(message);
    } finally {
      setAssigningStaffId(null);
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    if (!globalThis.confirm('Are you sure you want to remove this staff?')) {
      return;
    }

    try {
      setRemovingStaffId(staffId);
      setError(null);
      await removeStaffFromFranchise(franchiseId, staffId);
      setSuccessMessage('Staff removed successfully');
      await loadStaffMappings();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove staff';
      setError(message);
    } finally {
      setRemovingStaffId(null);
    }
  };

  const getAssignedStaffIds = (): Set<string> => {
    return new Set(staffMappings.map((m) => m.staffId));
  };

  const unassignedStaffs = availableStaffs.filter(
    (staff) => !getAssignedStaffIds().has(staff.id as string)
  );

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
        {franchiseName && (
          <p className="text-sm text-gray-600 mt-1">{franchiseName}</p>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm font-medium">{successMessage}</p>
        </div>
      )}

      {/* Assignment Section */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Assign New Staff
        </h3>

        {unassignedStaffs.length > 0 ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="staff-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Staff Member
              </label>
              <select
                id="staff-select"
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                disabled={assigningStaffId !== null}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
              >
                <option value="">-- Choose a staff member --</option>
                {unassignedStaffs.map((staff) => (
                  <option key={staff.id} value={staff.id as string}>
                    {staff.name || staff.staffCode || staff.id} (
                    {staff.email || 'No email'})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAssignStaff}
              disabled={!selectedStaffId || assigningStaffId !== null}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium transition-colors"
            >
              {assigningStaffId ? 'Assigning...' : 'Assign Staff'}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-500 text-sm">
              {availableStaffs.length === 0
                ? 'No staff or manager profiles are available to assign.'
                : 'All available staff members are already assigned to this franchise.'}
            </p>
            <p className="text-xs text-amber-700">
              If assignment still fails, check whether this staff is already mapped to the same franchise or the franchise is suspended.
            </p>
          </div>
        )}
      </div>

      {/* Current Staff List */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Current Staff ({staffMappings.length})
        </h3>

        {loadingState === 'loading' && (
          <p className="text-gray-500">Loading staff...</p>
        )}

        {loadingState === 'error' && (
          <p className="text-red-500">Failed to load staff</p>
        )}

        {loadingState === 'success' && staffMappings.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">
                    Staff Code
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">
                    Assigned Date
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {staffMappings.map((mapping) => (
                  <tr
                    key={mapping.staffId}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {mapping.staff?.staffCode || mapping.staffId}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {mapping.staff?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {mapping.staff?.email || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                          mapping.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {mapping.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {mapping.assignedAt
                        ? new Date(mapping.assignedAt).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleRemoveStaff(mapping.staffId)}
                        disabled={removingStaffId === mapping.staffId}
                        className="px-3 py-1 text-red-600 hover:bg-red-50 rounded font-medium text-sm disabled:opacity-50"
                      >
                        {removingStaffId === mapping.staffId
                          ? 'Removing...'
                          : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {loadingState === 'success' && staffMappings.length === 0 && (
          <p className="text-gray-500">No staff assigned yet.</p>
        )}
      </div>
    </div>
  );
};

export default FranchiseStaffManagement;
