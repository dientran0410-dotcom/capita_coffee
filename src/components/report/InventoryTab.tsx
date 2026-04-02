import type { InventoryReport } from "../../types/Report";
import { EmptyState } from "./EmptyState";
import { InventoryFilter } from "./InventoryFilter";

interface InventoryTabProps {
  inventoryReport: InventoryReport | null;
  franchiseId: string;
  franchiseOptions: Array<{ id: string; name: string; code: string }>;
  franchiseLoading: boolean;
  warehouseId: number | null;
  warehouseOptions: Array<{ id: number; name: string }>;
  warehouseLoading: boolean;
  loading: boolean;
  onFranchiseChange: (value: string) => void;
  onWarehouseChange: (value: number | null) => void;
  onGenerate: () => void;
  onExport: (reportId: string) => void;
}

export const InventoryTab = ({
  inventoryReport,
  franchiseId,
  franchiseOptions,
  franchiseLoading,
  warehouseId,
  warehouseOptions,
  warehouseLoading,
  loading,
  onFranchiseChange,
  onWarehouseChange,
  onGenerate,
  onExport,
}: InventoryTabProps) => (
  <div>
    <InventoryFilter
      franchiseId={franchiseId}
      franchiseOptions={franchiseOptions}
      franchiseLoading={franchiseLoading}
      warehouseId={warehouseId}
      warehouseOptions={warehouseOptions}
      warehouseLoading={warehouseLoading}
      loading={loading}
      onFranchiseChange={onFranchiseChange}
      onWarehouseChange={onWarehouseChange}
      onGenerate={onGenerate}
    />
    {!inventoryReport ? (
      <EmptyState />
    ) : (
      <>
        <div className="table-container">
          <div className="table-header">
            Inventory Movements
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th className="text-left">Product</th>
                  <th className="text-right">Current Stock</th>
                  <th className="text-right">Inbound</th>
                  <th className="text-right">Outbound</th>
                </tr>
              </thead>
              <tbody>
                {inventoryReport.items?.map((item: any) => (
                  <tr
                    key={item.productName}
                  >
                    <td className="font-medium text-gray-800">
                      {item.productName}
                    </td>
                    <td className="text-right text-gray-700">
                      {item.currentStock}
                    </td>
                    <td className="text-right text-green font-semibold">
                      +{item.inboundQuantity}
                    </td>
                    <td className="text-right text-red font-semibold">
                      -{item.outboundQuantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* <button
          onClick={() => onExport(inventoryReport.reportId)}
          className="btn-export"
        >
          Export Excel
        </button> */}
      </>
    )}
  </div>
);
