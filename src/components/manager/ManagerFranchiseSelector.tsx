import { Building2 } from "lucide-react";
import type { ManagerBranchContext } from "@/services/managerBranchService";

type ManagerFranchiseSelectorProps = {
  branches: ManagerBranchContext[];
  value: string;
  onChange: (branchId: string) => void;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  loading?: boolean;
};

export default function ManagerFranchiseSelector({
  branches,
  value,
  onChange,
  label = "Franchise",
  helperText,
  disabled = false,
  loading = false,
}: Readonly<ManagerFranchiseSelectorProps>) {
  const isDisabled = disabled || loading || branches.length === 0;

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Building2 className="h-4 w-4 text-amber-500" />
        </div>

        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={isDisabled}
          className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-gray-800 outline-none transition-colors focus:ring-2 focus:ring-amber-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
        >
          {loading && <option value="">Loading franchises...</option>}
          {!loading && branches.length === 0 && <option value="">No LIVE franchise available</option>}
          {branches.map((branch) => (
            <option key={branch.branchId} value={branch.branchId}>
              {branch.displayName}
            </option>
          ))}
        </select>
      </div>

      {helperText && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
