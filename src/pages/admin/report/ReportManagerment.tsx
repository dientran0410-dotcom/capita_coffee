import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import reportService from "../../../services/ReportService";
import franchiseService, {
  extractFranchiseList,
} from "../../../services/franchiseService";
import type {
  RevenueReport,
  ExpenseReport,
  ProductPerformance,
  ProfitLossReport,
} from "../../../types/Report";
import {
  RevenueTab,
  ExpenseTab,
  PerformanceTab,
  ProfitLossTab,
} from "../../../components/report"
import "./Report.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const tabs = ["Revenue", "Expense", "Performance", "Profit/Loss"];

type FranchiseOption = {
  id: string;
  name: string;
  code: string;
};

export default function ReportManagerment() {
  const [activeTab, setActiveTab] = useState("Revenue");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [franchiseId, setFranchiseId] = useState("");
  const [franchiseOptions, setFranchiseOptions] = useState<FranchiseOption[]>(
    []
  );
  const [franchiseLoading, setFranchiseLoading] = useState(false);

  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(
    null
  );
  const [expenseReport, setExpenseReport] = useState<ExpenseReport | null>(
    null
  );
  const [performanceReport, setPerformanceReport] =
    useState<ProductPerformance | null>(null);
  const [profitLossReport, setProfitLossReport] =
    useState<ProfitLossReport | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadFranchises = async () => {
      try {
        setFranchiseLoading(true);

        let list = extractFranchiseList(
          await franchiseService.getPublicFranchises()
        );

        if (!list.length) {
          list = extractFranchiseList(await franchiseService.getAdminFranchises());
        }

        const seen = new Set<string>();
        const options: FranchiseOption[] = list
          .map((item: any) => {
            const id = String(
              item?.franchiseId ?? item?.id ?? item?.branchId ?? ""
            ).trim();
            const rawName = String(
              item?.franchiseName ?? item?.name ?? item?.branchName ?? ""
            ).trim();
            const code = String(
              item?.franchiseCode ?? item?.code ?? item?.branchCode ?? ""
            ).trim();
            const name = rawName || code || `Franchise #${id}`;

            if (!id || !name || seen.has(id)) return null;

            seen.add(id);
            return { id, name, code };
          })
          .filter(Boolean)
          .sort((a, b) => a!.name.localeCompare(b!.name)) as FranchiseOption[];

        if (!mounted) return;
        setFranchiseOptions(options);
      } catch {
        if (!mounted) return;
        setFranchiseOptions([]);
      } finally {
        if (mounted) setFranchiseLoading(false);
      }
    };

    void loadFranchises();
    return () => {
      mounted = false;
    };
  }, []);

  const handleError = (err: any) => {
    setError(err?.response?.data?.message || "Something went wrong.");
    setLoading(false);
  };

  const generateRevenue = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await reportService.generateRevenueReport({
        franchiseId: franchiseId || null,
        startDate,
        endDate,
      });
      setRevenueReport(res ?? null);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const generateExpense = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await reportService.generateExpenseReport({
        franchiseId: franchiseId || null,
        startDate,
        endDate,
      });
      setExpenseReport(res ?? null);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const generatePerformance = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await reportService.generateProductPerformance({
        franchiseId: franchiseId || null,
        startDate,
        endDate,
      });
      setPerformanceReport(res ?? null);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const generateProfitLoss = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await reportService.generateProfitLoss({
        franchiseId: franchiseId || null,
        startDate,
        endDate,
      });
      setProfitLossReport(res ?? null);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (reportId: string) => {
    try {
      const reportType = activeTab.toLowerCase().replace("/", "-");
      const res = await reportService.exportReport(reportId, reportType);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${reportType}-report.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError("Export failed.");
    }
  };


  return (
    <div className="report-container">
      {/* Header */}
      <div className="report-header">
        <div className="report-header-content">
          <div className="report-header-left">
            <h1>Admin Reports</h1>
            <p>
              Comprehensive analytical data for Capital Coffee operations.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="report-content">
        {/* Tabs */}
        <div className="tabs-container">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setError("");
              }}
              className={`tab-button ${activeTab === tab ? "active" : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-circle"></i>
            {error}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "Revenue" && (
          <RevenueTab
            revenueReport={revenueReport}
            franchiseId={franchiseId}
            franchiseOptions={franchiseOptions}
            franchiseLoading={franchiseLoading}
            startDate={startDate}
            endDate={endDate}
            loading={loading}
            onFranchiseChange={setFranchiseId}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onGenerate={generateRevenue}
            onExport={handleExport}
          />
        )}

        {activeTab === "Expense" && (
          <ExpenseTab
            expenseReport={expenseReport}
            franchiseId={franchiseId}
            franchiseOptions={franchiseOptions}
            franchiseLoading={franchiseLoading}
            startDate={startDate}
            endDate={endDate}
            loading={loading}
            onFranchiseChange={setFranchiseId}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onGenerate={generateExpense}
            onExport={handleExport}
          />
        )}

        {activeTab === "Performance" && (
          <PerformanceTab
            performanceReport={performanceReport}
            franchiseId={franchiseId}
            franchiseOptions={franchiseOptions}
            franchiseLoading={franchiseLoading}
            startDate={startDate}
            endDate={endDate}
            loading={loading}
            onFranchiseChange={setFranchiseId}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onGenerate={generatePerformance}
            onExport={handleExport}
          />
        )}

        {activeTab === "Profit/Loss" && (
          <ProfitLossTab
            profitLossReport={profitLossReport}
            franchiseId={franchiseId}
            franchiseOptions={franchiseOptions}
            franchiseLoading={franchiseLoading}
            startDate={startDate}
            endDate={endDate}
            loading={loading}
            onFranchiseChange={setFranchiseId}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onGenerate={generateProfitLoss}
            onExport={handleExport}
          />
        )}
      </div>
    </div>
  );
}
