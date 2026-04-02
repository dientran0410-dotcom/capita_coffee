import { Bar, Pie } from "react-chartjs-2";
import type { RevenueReport } from "../../types/Report";
import { EmptyState } from "./EmptyState";
import { DateFranchiseFilter } from "./DateFranchiseFilter";
import {
  getRevenueBarChart,
  getPaymentPieChart,
} from "../../utils/chartConfig";

interface RevenueTabProps {
  revenueReport: RevenueReport | null;
  franchiseId: string;
  franchiseOptions: Array<{ id: string; name: string; code: string }>;
  franchiseLoading: boolean;
  startDate: string;
  endDate: string;
  loading: boolean;
  onFranchiseChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onGenerate: () => void;
  onExport: (reportId: string) => void;
}

export const RevenueTab = ({
  revenueReport,
  franchiseId,
  franchiseOptions,
  franchiseLoading,
  startDate,
  endDate,
  loading,
  onFranchiseChange,
  onStartDateChange,
  onEndDateChange,
  onGenerate,
  onExport,
}: RevenueTabProps) => {
  const revenueBarChart = getRevenueBarChart(revenueReport);
  const paymentPieChart = getPaymentPieChart(revenueReport);

  return (
    <div>
      <DateFranchiseFilter
        franchiseId={franchiseId}
        franchiseOptions={franchiseOptions}
        franchiseLoading={franchiseLoading}
        startDate={startDate}
        endDate={endDate}
        loading={loading}
        onFranchiseChange={onFranchiseChange}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
        onGenerate={onGenerate}
      />
      {!revenueReport ? (
        <EmptyState />
      ) : (
        <>
          <div className="cards-grid cols-3">
            <div className="card">
              <div className="card-label">
                Total Revenue
              </div>
              <div className="card-value">
                ${revenueReport.totalRevenue.toLocaleString()}
              </div>
            </div>
            <div className="card">
              <div className="card-label">
                Franchises
              </div>
              <div className="card-value">
                {revenueReport.revenueByFranchise?.length ?? 0}
              </div>
            </div>
            <div className="card">
              <div className="card-label">
                Payment Methods
              </div>
              <div className="card-value">
                {revenueReport.revenueByPaymentMethod?.length ?? 0}
              </div>
            </div>
          </div>
          <div className="charts-grid">
            <div className="chart-container">
              <h3 className="chart-title">
                Revenue by Franchise
              </h3>
              <Bar data={revenueBarChart} />
            </div>
            <div className="chart-container">
              <h3 className="chart-title">
                Payment Methods
              </h3>
              <Pie data={paymentPieChart} />
            </div>
          </div>
          {/* <button
            onClick={() => onExport(revenueReport.reportId)}
            className="btn-export"
          >
            Export Excel
          </button> */}
        </>
      )}
    </div>
  );
};
