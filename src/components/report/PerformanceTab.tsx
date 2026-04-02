import type { ProductPerformance } from "../../types/Report";
import { EmptyState } from "./EmptyState";
import { PerformanceFilter } from "./PerformanceFilter";

interface PerformanceTabProps {
  performanceReport: ProductPerformance | null;
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

export const PerformanceTab = ({
  performanceReport,
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
}: PerformanceTabProps) => (
  <div>
    <PerformanceFilter
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
    {!performanceReport ? (
      <EmptyState />
    ) : (
      <>
        <div className="table-container">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th className="text-left">Product</th>
                  <th className="text-right">Units Sold</th>
                  <th className="text-right">Revenue</th>
                  <th className="text-right">Profit</th>
                  <th className="text-right">Return Rate</th>
                </tr>
              </thead>
              <tbody>
                {performanceReport.productPerformanceItems?.map((item: any) => (
                  <tr key={item.productName}>
                    <td className="font-medium text-gray-800">
                      {item.productName}
                    </td>
                    <td className="text-right text-gray-700">
                      {item.unitSold}
                    </td>
                    <td className="text-right text-gray-700">
                      ${item.revenue?.toLocaleString()}
                    </td>
                    <td className="text-right text-green">
                      ${item.profit?.toLocaleString()}
                    </td>
                    <td className="text-right text-gray-700">
                      {item.returnRate}x
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {performanceReport.topProduct && (
          <div className="highlight-boxes">
            <div className="highlight-box success">
              <div className="highlight-label">
                Top Product
              </div>
              <p className="highlight-title">
                {performanceReport.topProduct.productName}
              </p>
              <p className="highlight-subtitle">
                ${performanceReport.topProduct.revenue?.toLocaleString()} revenue
              </p>
            </div>
            <div className="highlight-box danger">
              <div className="highlight-label">
                Bottom Product
              </div>
              <p className="highlight-title">
                {performanceReport.botProduct.productName}
              </p>
              <p className="highlight-subtitle">
                ${performanceReport.botProduct.revenue?.toLocaleString()} revenue
              </p>
            </div>
          </div>
        )}
        {/* <button
          onClick={() => onExport(performanceReport.reportId)}
          className="btn-export"
        >
          Export Excel
        </button> */}
      </>
    )}
  </div>
);
