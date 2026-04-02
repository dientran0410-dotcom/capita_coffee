import type { RevenueReport } from "../types/Report";

export const getRevenueBarChart = (revenueReport: RevenueReport | null) => ({
  labels: revenueReport?.revenueByFranchise?.map((f: any) => f.franchiseId) ?? [],
  datasets: [
    {
      label: "Revenue",
      data:
        revenueReport?.revenueByFranchise?.map((f: any) => f.totalRevenue) ?? [],
      backgroundColor: ["#d97706", "#f59e0b", "#fbbf24", "#fcd34d"],
      borderRadius: 8,
      barThickness: 40,
    },
  ],
});

export const getPaymentPieChart = (revenueReport: RevenueReport | null) => ({
  labels:
    revenueReport?.revenueByPaymentMethod?.map((p: any) => p.paymentMethod) ??
    [],
  datasets: [
    {
      data:
        revenueReport?.revenueByPaymentMethod?.map(
          (p: any) => p.totalRevenue
        ) ?? [],
      backgroundColor: ["#d97706", "#3d1a00", "#f59e0b", "#92400e"],
      borderWidth: 4,
      borderColor: "#ffffff",
    },
  ],
});

