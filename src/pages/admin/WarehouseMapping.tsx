import { useEffect, useState } from 'react';
import { Plus, Save, Search, ChevronDown, AlertTriangle } from 'lucide-react';
import { apiUtils } from '@/api/axios';
import { showErrorToast, showSuccessToast, showWarningToast } from '@/utils/toast';

type FranchiseItem = {
  franchiseId: string;
  franchiseName: string;
  franchiseCode: string;
  region?: string;
  warehouseId?: string | number;
  assignedAt?: string;
};

type WarehouseItem = {
  id: string | number;
  name: string;
};

type MappingItem = {
  franchiseId: string;
  warehouseId: string;
  assignedAt?: string;
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type WarehouseListResponse = {
  data?: WarehouseItem[];
};

function formatAssignedDate(value?: string) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function buildTableBody(params: {
  loading: boolean;
  search: string;
  mappings: MappingItem[];
  franchises: FranchiseItem[];
  warehouses: WarehouseItem[];
  editingFranchiseId: string | null;
  editingWarehouseId: string;
  setEditingWarehouseId: (v: string) => void;
  startInlineEdit: (franchiseId: string, currentWarehouseId?: string) => void;
  cancelInlineEdit: () => void;
  saveInlineUpdate: (franchiseId: string) => Promise<void>;
  pickForReassign: (franchiseId: string, warehouseId?: string) => void;
}) {
  const {
    loading,
    search,
    mappings,
    franchises,
    warehouses,
    editingFranchiseId,
    editingWarehouseId,
    setEditingWarehouseId,
    startInlineEdit,
    cancelInlineEdit,
    saveInlineUpdate,
    pickForReassign,
  } = params;

  if (loading) {
    return (
      <tr>
        <td colSpan={5} className="py-6 px-4 text-center text-gray-500">
          Loading mappings...
        </td>
      </tr>
    );
  }

  const q = (search || '').toLowerCase();
  const rowsTemp = mappings
    .map((m) => {
      const franchise = franchises.find((f) => f.franchiseId === m.franchiseId);
      if (!franchise) return null;
      const warehouse = warehouses.find((w) => String(w.id) === String(m.warehouseId)) || null;
      return { mapping: m, franchise, warehouse };
    })
    .filter((x): x is { mapping: MappingItem; franchise: FranchiseItem; warehouse: WarehouseItem | null } => x !== null);

  const rows = rowsTemp.filter((item) => {
    if (!q) return true;
    const code = (item.franchise.franchiseCode || '').toLowerCase();
    const name = (item.franchise.franchiseName || '').toLowerCase();
    const region = (item.franchise.region || '').toLowerCase();
    return code.includes(q) || name.includes(q) || region.includes(q);
  });

  if (rows.length === 0) {
    return (
      <tr>
        <td colSpan={5} className="py-6 px-4 text-center text-gray-500">
          No mappings found.
        </td>
      </tr>
    );
  }

  return (
    <>
      {rows.map(({ mapping, franchise, warehouse }) => {
        const isEditing = editingFranchiseId === franchise.franchiseId;
        return (
          <tr key={franchise.franchiseId} className="border-b border-gray-100 hover:bg-amber-50 transition-colors">
            <td className="py-3 px-4">
              <p className="font-medium text-gray-900">{franchise.franchiseCode}</p>
              <p className="text-xs text-gray-400">{franchise.franchiseName}</p>
            </td>
            <td className="py-3 px-4 text-gray-600">{franchise.region || '-'}</td>
            <td className="py-3 px-4">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <select
                    value={editingWarehouseId}
                    onChange={(e) => setEditingWarehouseId(e.target.value)}
                    className="px-3 py-1 rounded border text-sm"
                  >
                    <option value="">Select warehouse...</option>
                    {warehouses.map((w) => (
                      <option key={String(w.id)} value={String(w.id)}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => saveInlineUpdate(franchise.franchiseId)}
                    className="text-xs text-green-700 px-2 py-1 rounded bg-green-50"
                  >
                    Save
                  </button>
                  <button onClick={cancelInlineEdit} className="text-xs text-gray-600 px-2 py-1 rounded bg-gray-50">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-gray-900 font-medium">{warehouse ? warehouse.name : '-'}</span>
                  <button
                    onClick={() => startInlineEdit(franchise.franchiseId, mapping.warehouseId)}
                    className="text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-100 px-2 py-1 rounded"
                  >
                    Update
                  </button>
                </div>
              )}
            </td>
            <td className="py-3 px-4 text-gray-500 text-xs">{formatAssignedDate(mapping?.assignedAt)}</td>
            <td className="py-3 px-4 text-center">
              <button
                onClick={() => pickForReassign(franchise.franchiseId, mapping ? String(mapping.warehouseId) : '')}
                className="text-xs text-amber-700 hover:text-amber-800 hover:bg-amber-100 px-2 py-1 rounded"
              >
                Edit in form
              </button>
            </td>
          </tr>
        );
      })}
    </>
  );
}

export function WarehouseMapping() {
  const [franchises, setFranchises] = useState<FranchiseItem[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [mappings, setMappings] = useState<MappingItem[]>([]);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [formFranchise, setFormFranchise] = useState('');
  const [formWarehouse, setFormWarehouse] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [franchiseRes, warehouseRes] = await Promise.all([
          apiUtils.get<ApiResponse<FranchiseItem[]>>('/api/franchise-service/franchises'),
          apiUtils.get<WarehouseListResponse>('/api/warehouse-service/warehouses/get-all'),
        ]);

        const franchiseList = Array.isArray(franchiseRes?.data) ? franchiseRes.data : [];
        const warehouseList = Array.isArray(warehouseRes?.data) ? warehouseRes.data : [];

        setFranchises(franchiseList);
        setWarehouses(warehouseList);

        const initialMappings = franchiseList
          .map((item) => {
            if (item.warehouseId === undefined || item.warehouseId === null || item.warehouseId === '') {
              return null;
            }
            return {
              franchiseId: item.franchiseId,
              warehouseId: String(item.warehouseId),
              assignedAt: item.assignedAt,
            };
          })
          .filter(Boolean) as MappingItem[];

        setMappings(initialMappings);
      } catch (error: any) {
        setLoadError(error?.message || 'Failed to load warehouse mapping data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (loadError) {
      showErrorToast(loadError);
    }
  }, [loadError]);

  const currentMapping = formFranchise ? mappings.find((m) => m.franchiseId === formFranchise) : null;
  const currentWarehouse = currentMapping
    ? warehouses.find((w) => String(w.id) === String(currentMapping.warehouseId))
    : null;

  const formErrors = {
    franchise: submitted && !formFranchise ? 'Select a franchise' : '',
    warehouse: submitted && !formWarehouse ? 'Select a warehouse' : '',
  };

  const handleSave = async () => {
    setSubmitted(true);
    if (!formFranchise || !formWarehouse) return;

    setSaving(true);
    try {
      const result = await apiUtils.post<
        ApiResponse<{
          franchiseId: string;
          warehouseId: string;
          assignedAt?: string;
        }>
      >('/api/franchise-service/franchise-warehouse', {
        franchiseId: formFranchise,
        warehouseId: String(formWarehouse),
      });

      const resultData = result?.data;
      const mappedFranchiseId = resultData?.franchiseId || formFranchise;
      const mappedWarehouseId = String(resultData?.warehouseId || formWarehouse);
      const mappedAssignedAt = resultData?.assignedAt || new Date().toISOString();

      setMappings((prev) => {
        const withoutCurrent = prev.filter((m) => m.franchiseId !== mappedFranchiseId);
        return [
          ...withoutCurrent,
          {
            franchiseId: mappedFranchiseId,
            warehouseId: mappedWarehouseId,
            assignedAt: mappedAssignedAt,
          },
        ];
      });

      const selectedFranchise = franchises.find((f) => f.franchiseId === mappedFranchiseId);
      const selectedWarehouse = warehouses.find((w) => String(w.id) === mappedWarehouseId);
      showSuccessToast(
        result?.message ||
          `${selectedWarehouse?.name || 'Warehouse'} assigned to ${selectedFranchise?.franchiseCode || 'franchise'}`
      );

      setFormFranchise('');
      setFormWarehouse('');
      setSubmitted(false);
    } catch (error: any) {
      showErrorToast(error?.message || 'Failed to save mapping');
    } finally {
      setSaving(false);
    }
  };

  const pickForReassign = (franchiseId: string, warehouseId?: string) => {
    setFormFranchise(franchiseId);
    setFormWarehouse(warehouseId || '');
    setSubmitted(false);
  };

  const [editingFranchiseId, setEditingFranchiseId] = useState<string | null>(null);
  const [editingWarehouseId, setEditingWarehouseId] = useState<string>('');

  const startInlineEdit = (franchiseId: string, currentWarehouseId?: string) => {
    setEditingFranchiseId(franchiseId);
    setEditingWarehouseId(currentWarehouseId || '');
  };

  const cancelInlineEdit = () => {
    setEditingFranchiseId(null);
    setEditingWarehouseId('');
  };

  const saveInlineUpdate = async (franchiseId: string) => {
    if (!editingWarehouseId) {
      showWarningToast('Please select a warehouse');
      return;
    }
    setSaving(true);
    try {
      const resp = await apiUtils.put<ApiResponse<{ franchiseId: string; warehouseId: string; assignedAt?: string }>>(
        `/api/franchise-service/franchise-warehouse/franchise/${encodeURIComponent(franchiseId)}`,
        { warehouseId: String(editingWarehouseId) },
      );

      const data = resp?.data;
      const mappedFranchiseId = data?.franchiseId || franchiseId;
      const mappedWarehouseId = String(data?.warehouseId || editingWarehouseId);
      const mappedAssignedAt = data?.assignedAt || new Date().toISOString();

      setMappings((prev) => {
        const without = prev.filter((m) => m.franchiseId !== mappedFranchiseId);
        return [...without, { franchiseId: mappedFranchiseId, warehouseId: mappedWarehouseId, assignedAt: mappedAssignedAt }];
      });

      showSuccessToast(resp?.message || 'Mapping updated');
      cancelInlineEdit();
    } catch (err: any) {
      showErrorToast(err?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const tableBody = buildTableBody({
    loading,
    search,
    mappings,
    franchises,
    warehouses,
    editingFranchiseId,
    editingWarehouseId,
    setEditingWarehouseId,
    startInlineEdit,
    cancelInlineEdit,
    saveInlineUpdate,
    pickForReassign,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Warehouse Mapping</h1>
        <p className="text-gray-600 mt-1">S31 - Configure which warehouse serves each franchise (Logistics Admin)</p>
      </div>

      {loadError && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {loadError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-600" /> Assign / Reassign
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="wm-franchise" className="block text-sm font-medium text-gray-700 mb-1">
                  Franchise <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="wm-franchise"
                    value={formFranchise}
                    onChange={(e) => {
                      setFormFranchise(e.target.value);
                      setFormWarehouse('');
                      setSubmitted(false);
                    }}
                    disabled={loading || saving}
                    className={`w-full appearance-none px-4 py-2.5 pr-10 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white ${
                      formErrors.franchise ? 'border-red-400' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Select franchise...</option>
                    {franchises.map((franchise) => (
                      <option key={franchise.franchiseId} value={franchise.franchiseId}>
                        {franchise.franchiseCode} - {franchise.franchiseName}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {formErrors.franchise && <p className="text-xs text-red-600 mt-1">{formErrors.franchise}</p>}
              </div>

              {formFranchise && (
                <div className={`p-3 rounded-lg text-sm ${currentWarehouse ? 'bg-amber-50' : 'bg-gray-50'}`}>
                  <p className="text-xs text-gray-500 mb-0.5">Current Mapping</p>
                  {currentWarehouse ? (
                    <p className="font-medium text-gray-900">{currentWarehouse.name}</p>
                  ) : (
                    <p className="text-gray-400 italic">No warehouse assigned</p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="wm-warehouse" className="block text-sm font-medium text-gray-700 mb-1">
                  New Warehouse <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    id="wm-warehouse"
                    value={formWarehouse}
                    onChange={(e) => setFormWarehouse(e.target.value)}
                    disabled={loading || saving}
                    className={`w-full appearance-none px-4 py-2.5 pr-10 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white ${
                      formErrors.warehouse ? 'border-red-400' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Select warehouse...</option>
                    {warehouses.map((warehouse) => (
                      <option key={String(warehouse.id)} value={String(warehouse.id)}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {formErrors.warehouse && <p className="text-xs text-red-600 mt-1">{formErrors.warehouse}</p>}
              </div>

              {formWarehouse &&
                formFranchise &&
                currentWarehouse &&
                String(currentWarehouse.id) !== String(formWarehouse) && (
                  <div className="p-3 bg-yellow-50 rounded-lg flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700">This will replace the current mapping.</p>
                  </div>
                )}

              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg text-sm font-medium"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Mapping'}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-gray-900">All Franchise Mappings</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search franchise..."
                  className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Franchise</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Region</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Assigned Warehouse</th>
                  <th className="text-left py-3 px-4 text-gray-600 font-medium">Assigned Date</th>
                  <th className="text-center py-3 px-4 text-gray-600 font-medium">Action</th>
                </tr>
              </thead>

              <tbody>{tableBody}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
