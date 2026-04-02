import type { ProfitLossReport } from "../../types/Report";
import { EmptyState } from "./EmptyState";
import { DateFranchiseFilter } from "./DateFranchiseFilter";

interface ProfitLossTabProps {
  profitLossReport: ProfitLossReport | null;
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

export const ProfitLossTab = ({
  profitLossReport,
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
}: ProfitLossTabProps) => (
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

    {!profitLossReport ? (
      <EmptyState />
    ) : (
      <>
        <div className="cards-grid cols-4">
          <div className="card">
            <div className="card-label">
              Total Revenue
            </div>
            <div className="card-value green">
              ${profitLossReport.totalRevenue.toLocaleString()}
            </div>
          </div>

          <div className="card">
            <div className="card-label">
              Total Expenses
            </div>
            <div className="card-value red">
              ${profitLossReport.totalExpenses.toLocaleString()}
            </div>
          </div>

          <div className="card">
            <div className="card-label">
              Net Profit
            </div>
            <div className="card-value blue">
              ${profitLossReport.netProfit.toLocaleString()}
            </div>
          </div>

          <div className="card">
            <div className="card-label">
              Result
            </div>
            <div
              className={`card-value ${
                profitLossReport.result === "PROFIT"
                  ? "green"
                  : "red"
              }`}
            >
              {profitLossReport.result}
            </div>
          </div>
        </div>

        <div className="table-container">
          <div className="table-header">
            Revenue Breakdown
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th className="text-left">Franchise</th>
                  <th className="text-right">Revenue</th>
                </tr>
              </thead>

              <tbody>
                {profitLossReport.revenueDetails?.revenueByFranchise?.map(
                  (item: any) => (
                    <tr key={item.franchiseId}>
                      <td>{item.franchiseId}</td>
                      <td className="text-right">
                        ${item.totalRevenue.toLocaleString()}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="table-container">
          <div className="table-header">
            Expense Breakdown
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th className="text-left">Expense Type</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>

              <tbody>
                {profitLossReport.expenseDetails?.expenses?.map(
                  (item: any, index: number) => (
                    <tr key={index}>
                      <td>{item.expenseType}</td>
                      <td className="text-right">
                        ${item.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* <button
          onClick={() => onExport(profitLossReport.reportId ?? "")}
          className="btn-export"
        >
          Export Excel
        </button> */}
      </>
    )}
  </div>
);
