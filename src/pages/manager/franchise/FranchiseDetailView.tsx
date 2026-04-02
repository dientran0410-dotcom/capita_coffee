import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Clock,
  FileText,
  Globe,
  MapPin,
  RefreshCw,
  Shield,
} from "lucide-react";
import contractService, { type Contract } from "@/services/ContractService";
import franchiseService from "@/services/franchiseService";
import { FranchiseStatusBadge } from "@/components/franchise/FranchiseBadges";

type Franchise = {
  franchiseId?: string;
  franchiseCode?: string;
  franchiseName?: string;
  region?: string;
  timezone?: string;
  address?: string;
  status?: string;
  onboardingStatus?: string;
};

const EMPTY_FRANCHISE: Franchise = {
  franchiseId: "",
  franchiseCode: "",
  franchiseName: "",
  region: "",
  timezone: "",
  address: "",
  status: "",
  onboardingStatus: "",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
}

function normalizeFranchisePayload(payload: unknown): Franchise {
  return {
    ...EMPTY_FRANCHISE,
    ...(isRecord(payload) ? payload : {}),
  };
}

function formatDisplayDate(value: unknown): string {
  const input = readString(value);
  if (!input) return "-";
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) {
    return input;
  }

  return parsed.toLocaleDateString("en-CA");
}

function getContractStatusClass(status: string): string {
  switch (String(status || "").toUpperCase()) {
    case "ACTIVE":
      return "bg-green-100 text-green-700";
    case "PENDING_ACTIVATION":
      return "bg-yellow-100 text-yellow-700";
    case "TERMINATED":
      return "bg-red-100 text-red-700";
    case "EXPIRED":
      return "bg-orange-100 text-orange-700";
    default:
      return "bg-gray-100 text-gray-500";
  }
}

export function FranchiseDetailView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const initialTab = searchParams.get("tab") === "contracts" ? "contracts" : "overview";

  const [franchise, setFranchise] = useState<Franchise>(EMPTY_FRANCHISE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "contracts">(initialTab);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [contractsError, setContractsError] = useState("");
  const [contractsLoadedFor, setContractsLoadedFor] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDetail() {
      if (!id) {
        setError("Missing franchise id");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await franchiseService.getById(id);
        const payload = response?.data ?? response;

        if (mounted) {
          setFranchise(normalizeFranchisePayload(payload));
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(
            err instanceof Error ? err.message : "Failed to load franchise detail"
          );
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

  const loadFranchiseContracts = useCallback(
    async (force = false) => {
      if (!id) {
        setContracts([]);
        setContractsError("");
        setContractsLoadedFor("");
        return;
      }

      if (!force && contractsLoadedFor === id) {
        return;
      }

      setContractsLoading(true);
      setContractsError("");

      try {
        const allContracts = await contractService.getAllContracts();
        const filteredContracts = allContracts
          .filter((contract) => readString(contract?.franchiseId) === id)
          .sort((left, right) =>
            String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? ""))
          );

        setContracts(filteredContracts);
        setContractsLoadedFor(id);
      } catch (err) {
        setContracts([]);
        setContractsLoadedFor("");
        setContractsError(
          err instanceof Error ? err.message : "Failed to load contracts for this franchise"
        );
      } finally {
        setContractsLoading(false);
      }
    },
    [contractsLoadedFor, id]
  );

  useEffect(() => {
    setContracts([]);
    setContractsError("");
    setContractsLoadedFor("");
    setContractsLoading(false);
  }, [id]);

  useEffect(() => {
    if (activeTab !== "contracts") return;
    void loadFranchiseContracts();
  }, [activeTab, loadFranchiseContracts]);

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "contracts", label: "Contracts" },
  ] as const;

  return (
    <div className="space-y-6">
      {loading && (
        <div className="p-3 text-sm text-gray-600">Loading franchise details...</div>
      )}
      {error && <div className="p-3 text-sm text-red-600">{error}</div>}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/manager/franchises")}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {franchise.franchiseName || "-"}
              </h1>
              <FranchiseStatusBadge
                status={franchise.status || "UNKNOWN"}
                bordered
                className="px-3 py-1 text-sm"
              />
            </div>

            <p className="mt-1 text-sm text-gray-500">
              {franchise.franchiseCode || "-"} - {franchise.region || "-"} - Manager
              View
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500">
          Manager View
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`-mb-px border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-amber-600 text-amber-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Identity</h3>
              <dl className="space-y-3">
                {[
                  { icon: Shield, label: "Franchise ID", value: franchise.franchiseId || "-" },
                  { icon: Building2, label: "Code", value: franchise.franchiseCode || "-" },
                  { icon: MapPin, label: "Address", value: franchise.address || "-" },
                  { icon: Globe, label: "Region", value: franchise.region || "-" },
                  { icon: Clock, label: "Timezone", value: franchise.timezone || "-" },
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

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Operational Status</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="mb-0.5 text-xs text-gray-500">Status</p>
                  <div className="text-sm font-medium text-gray-900">
                    <FranchiseStatusBadge status={franchise.status || "UNKNOWN"} />
                  </div>
                </div>
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="mb-0.5 text-xs text-gray-500">Onboarding Status</p>
                  <div className="text-sm font-medium text-gray-900">
                    {franchise.onboardingStatus || "-"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "contracts" && (
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
                  className={`h-4 w-4 ${contractsLoading ? "animate-spin" : ""}`}
                />
              </button>
              <Link
                to={`/manager/contracts?franchiseId=${encodeURIComponent(id)}`}
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
                  "Contract #",
                  "Status",
                  "Start Date",
                  "End Date",
                  "Royalty Rate",
                  "Actions",
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
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${getContractStatusClass(
                          contract.status
                        )}`}
                      >
                        {contract.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDisplayDate(contract.startDate)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDisplayDate(contract.endDate)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{contract.royaltyRate}%</td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/manager/contract-detail?id=${contract.contractId}&franchiseId=${encodeURIComponent(
                          id
                        )}`}
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
    </div>
  );
}

export default FranchiseDetailView;
