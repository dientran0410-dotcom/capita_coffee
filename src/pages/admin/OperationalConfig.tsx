import { useState } from "react";
import { CheckCircle, XCircle, Save, ChevronDown } from "lucide-react";
import { showSuccessToast } from "@/utils/toast";

const FRANCHISES: any[] = [];
const MENU_PROFILES: any[] = [];
const WAREHOUSES: any[] = [];
const SUPPLIERS: any[] = [];

const CURRENT_MENU: Record<string, string> = {};
const CURRENT_WH: Record<string, string> = {};
const APPROVED_SUPPLIERS: Record<string, string[]> = {};

function MenuProfileTab() {
  const [franchiseId, setFranchiseId] = useState("");
  const [profileId, setProfileId] = useState("");
  const [saved, setSaved] = useState(false);

  const currentProfile = franchiseId
    ? MENU_PROFILES.find((menu) => menu.id === CURRENT_MENU[franchiseId])
    : null;

  const handleSave = () => {
    setSaved(true);

    if (franchiseId && profileId) {
      const franchise = FRANCHISES.find((item) => item.id === franchiseId);
      const profile = MENU_PROFILES.find((item) => item.id === profileId);

      showSuccessToast(
        `Menu profile "${profile?.label}" assigned to ${franchise?.code}`
      );
    }
  };

  const hasErrors = saved && (!franchiseId || !profileId);

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
        <strong>S25 - Assign Menu Profile:</strong> Select a franchise and assign a
        menu profile that defines available products and pricing.
      </div>

      <div className="max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">New Assignment</h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="mp-franchise"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Franchise <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="mp-franchise"
                value={franchiseId}
                onChange={(event) => {
                  setFranchiseId(event.target.value);
                  setProfileId("");
                  setSaved(false);
                }}
                className={`w-full appearance-none rounded-lg border bg-white px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  saved && !franchiseId ? "border-red-400" : "border-gray-200"
                }`}
              >
                <option value="">Select a franchise...</option>
                {FRANCHISES.map((franchise) => (
                  <option key={franchise.id} value={franchise.id}>
                    {franchise.code} - {franchise.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            {saved && !franchiseId && (
              <p className="mt-1 text-xs text-red-600">Please select a franchise</p>
            )}
          </div>

          {franchiseId && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="mb-1 text-xs text-gray-500">Current Assignment</p>
              {currentProfile ? (
                <p className="text-sm font-medium text-gray-900">
                  {currentProfile.label}
                </p>
              ) : (
                <p className="text-sm italic text-gray-400">
                  No menu profile assigned
                </p>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="mp-profile"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Menu Profile <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="mp-profile"
                value={profileId}
                onChange={(event) => setProfileId(event.target.value)}
                className={`w-full appearance-none rounded-lg border bg-white px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  saved && !profileId ? "border-red-400" : "border-gray-200"
                }`}
              >
                <option value="">Select a menu profile...</option>
                {MENU_PROFILES.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            {saved && !profileId && (
              <p className="mt-1 text-xs text-red-600">
                Please select a menu profile
              </p>
            )}
          </div>

          <button
            onClick={handleSave}
            className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors ${
              hasErrors
                ? "cursor-not-allowed bg-gray-100 text-gray-400"
                : "bg-amber-600 text-white hover:bg-amber-700"
            }`}
          >
            <Save className="h-4 w-4" />
            Save Assignment
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900">
            Current Menu Profile Assignments
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Franchise
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Assigned Profile
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {FRANCHISES.map((franchise) => {
              const profile = MENU_PROFILES.find(
                (menu) => menu.id === CURRENT_MENU[franchise.id]
              );

              return (
                <tr
                  key={franchise.id}
                  className="border-b border-gray-100 transition-colors hover:bg-amber-50"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{franchise.code}</p>
                    <p className="text-xs text-gray-400">{franchise.name}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {profile ? (
                      profile.label
                    ) : (
                      <span className="italic text-gray-400">Not assigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {profile ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Configured
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WarehouseTab() {
  const [franchiseId, setFranchiseId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [saved, setSaved] = useState(false);

  const currentWarehouse = franchiseId
    ? WAREHOUSES.find((warehouse) => warehouse.id === CURRENT_WH[franchiseId])
    : null;

  const handleSave = () => {
    setSaved(true);

    if (franchiseId && warehouseId) {
      const franchise = FRANCHISES.find((item) => item.id === franchiseId);
      const warehouse = WAREHOUSES.find((item) => item.id === warehouseId);

      showSuccessToast(
        `Warehouse "${warehouse?.label}" assigned to ${franchise?.code}`
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
        <strong>S26 - Assign Warehouse Mapping:</strong> Link a franchise to its
        designated supply warehouse for order fulfillment.
      </div>

      <div className="max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 font-semibold text-gray-900">New Warehouse Assignment</h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="wt-franchise"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Franchise <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="wt-franchise"
                value={franchiseId}
                onChange={(event) => {
                  setFranchiseId(event.target.value);
                  setWarehouseId("");
                  setSaved(false);
                }}
                className={`w-full appearance-none rounded-lg border bg-white px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  saved && !franchiseId ? "border-red-400" : "border-gray-200"
                }`}
              >
                <option value="">Select a franchise...</option>
                {FRANCHISES.map((franchise) => (
                  <option key={franchise.id} value={franchise.id}>
                    {franchise.code} - {franchise.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {franchiseId && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="mb-1 text-xs text-gray-500">Current Warehouse</p>
              {currentWarehouse ? (
                <p className="text-sm font-medium text-gray-900">
                  {currentWarehouse.label}
                </p>
              ) : (
                <p className="text-sm italic text-gray-400">No warehouse mapped</p>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="wt-warehouse"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Warehouse <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="wt-warehouse"
                value={warehouseId}
                onChange={(event) => setWarehouseId(event.target.value)}
                className={`w-full appearance-none rounded-lg border bg-white px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  saved && !warehouseId ? "border-red-400" : "border-gray-200"
                }`}
              >
                <option value="">Select a warehouse...</option>
                {WAREHOUSES.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            <Save className="h-4 w-4" />
            Save Assignment
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900">
            Current Warehouse Assignments
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Franchise
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Assigned Warehouse
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {FRANCHISES.map((franchise) => {
              const warehouse = WAREHOUSES.find(
                (item) => item.id === CURRENT_WH[franchise.id]
              );

              return (
                <tr
                  key={franchise.id}
                  className="border-b border-gray-100 transition-colors hover:bg-amber-50"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{franchise.code}</p>
                    <p className="text-xs text-gray-400">{franchise.name}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {warehouse ? (
                      warehouse.label
                    ) : (
                      <span className="italic text-gray-400">Not assigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {warehouse ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Configured
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SupplierListTab() {
  const [franchiseId, setFranchiseId] = useState("fr-001");
  const [selected, setSelected] = useState<string[]>(
    APPROVED_SUPPLIERS["fr-001"] ?? []
  );

  const handleToggle = (id: string) => {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const handleSave = () => {
    const franchise = FRANCHISES.find((item) => item.id === franchiseId);
    showSuccessToast(
      `Supplier list updated for ${franchise?.code} (${selected.length} approved)`
    );
  };

  const handleFranchiseChange = (id: string) => {
    setFranchiseId(id);
    setSelected(APPROVED_SUPPLIERS[id] ?? []);
  };

  const statusOrder: Record<string, number> = {
    APPROVED: 0,
    PENDING: 1,
    REJECTED: 2,
  };

  const sortedSuppliers = [...SUPPLIERS].sort(
    (left, right) => statusOrder[left.status] - statusOrder[right.status]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
        <strong>S27 - Approve Supplier List:</strong> Define which suppliers a
        franchise is allowed to purchase from.
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-end gap-4">
          <div className="max-w-sm flex-1">
            <label
              htmlFor="sl-franchise"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Franchise
            </label>
            <div className="relative">
              <select
                id="sl-franchise"
                value={franchiseId}
                onChange={(event) => handleFranchiseChange(event.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {FRANCHISES.map((franchise) => (
                  <option key={franchise.id} value={franchise.id}>
                    {franchise.code} - {franchise.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <p className="pb-1 text-sm text-gray-500">
            {selected.length} supplier(s) selected
          </p>
        </div>

        <div className="mt-4 space-y-2">
          {sortedSuppliers.map((supplier) => {
            const isChecked = selected.includes(supplier.id);

            return (
              <label
                key={supplier.id}
                htmlFor={`sp-chk-${supplier.id}`}
                className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-colors ${
                  isChecked
                    ? "border-amber-300 bg-amber-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    id={`sp-chk-${supplier.id}`}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggle(supplier.id)}
                    className="h-4 w-4 accent-amber-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {supplier.name}
                    </p>
                    <p className="text-xs text-gray-400">{supplier.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {supplier.status === "APPROVED" && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      Global Approved
                    </span>
                  )}
                  {supplier.status === "PENDING" && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
                      Pending Review
                    </span>
                  )}
                  {supplier.status === "REJECTED" && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                      Rejected
                    </span>
                  )}
                  {isChecked ? (
                    <CheckCircle className="h-4 w-4 text-amber-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-300" />
                  )}
                </div>
              </label>
            );
          })}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            <Save className="h-4 w-4" />
            Save Supplier List
          </button>
          <button
            onClick={() => setSelected(APPROVED_SUPPLIERS[franchiseId] ?? [])}
            className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

export function OperationalConfig() {
  const [activeTab, setActiveTab] = useState("menu");

  const tabs = [
    { key: "menu", label: "Menu Profile", desc: "S25 - Assign menu to franchise" },
    {
      key: "warehouse",
      label: "Warehouse Mapping",
      desc: "S26 - Assign warehouse to franchise",
    },
    {
      key: "supplier",
      label: "Supplier List",
      desc: "S27 - Approve supplier list",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Operational Configuration
        </h1>
        <p className="mt-1 text-gray-600">
          Assign and manage operational setup per franchise - S25 Menu, S26
          Warehouse, S27 Suppliers
        </p>
      </div>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex flex-col rounded-xl border px-5 py-3 text-left transition-colors ${
              activeTab === tab.key
                ? "border-amber-600 bg-amber-600 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-amber-200 hover:bg-amber-50"
            }`}
          >
            <span className="text-sm font-semibold">{tab.label}</span>
            <span
              className={`mt-0.5 text-xs ${
                activeTab === tab.key ? "text-amber-100" : "text-gray-400"
              }`}
            >
              {tab.desc}
            </span>
          </button>
        ))}
      </div>

      {activeTab === "menu" && <MenuProfileTab />}
      {activeTab === "warehouse" && <WarehouseTab />}
      {activeTab === "supplier" && <SupplierListTab />}
    </div>
  );
}
