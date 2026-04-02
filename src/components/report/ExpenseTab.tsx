import type { ExpenseReport } from "../../types/Report";
import { EmptyState } from "./EmptyState";
import { DateFranchiseFilter } from "./DateFranchiseFilter";

interface ExpenseTabProps {
  expenseReport: ExpenseReport | null;
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

export const ExpenseTab = ({
  expenseReport,
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
}: ExpenseTabProps) => (
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

    {!expenseReport ? (
      <EmptyState />
    ) : (
      <>
        <div className="cards-grid cols-3">
          {[
            { label: "Total Expense", value: expenseReport.totalExpense },
            {
              label: "Inventory Cost",
              value: expenseReport.inventoryCost,
            },
            {
              label: "Operational Cost",
              value: expenseReport.operationalCost,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="card"
            >
              <div className="card-label">
                {item.label}
              </div>
              <div className="card-value">
                ${item.value?.toLocaleString() ?? 0}
              </div>
            </div>
          ))}
        </div>

        <div className="table-container">
          <div className="table-header">
            Expense Details
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th className="text-left">Item</th>
                  <th className="text-left">Type</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>

              <tbody>
                {expenseReport.expenses?.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="font-medium text-gray-800">
                      {item.itemName ?? "N/A"}
                    </td>

                    <td className="text-gray-600">
                      {item.expenseType}
                    </td>

                    <td className="text-right text-gray-700">
                      {item.quantity ?? "-"}
                    </td>

                    <td className="text-right text-gray-700 font-semibold">
                      ${item.totalAmount?.toLocaleString() ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* <button
          onClick={() => onExport(expenseReport.reportId)}
          className="btn-export danger"
        >
          Export Excel
        </button> */}
      </>
    )}
  </div>
);
