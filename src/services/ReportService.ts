import type { ApiResponse } from "../types/ApiResponse";
import { REPORT_ENDPOINTS } from "../constants/apiEndPoints";
import api from "../api/axios";
import type {
  RevenueReport,
  ExpenseReport,
  ProductPerformance,
  ProfitLossReport,
} from "../types/Report";

type InventoryReportPayload = {
  franchiseId?: string | null;
  warehouseId?: number | null;
  startDate?: string;
  endDate?: string;
};

type BaseReportPayload = {
  franchiseId?: string | null;
  startDate?: string;
  endDate?: string;
  [key: string]: unknown;
};

const pickPayload = <T>(body: any): T =>
  (body?.payload ?? body?.data ?? body?.result ?? body) as T;

const toStartDateTime = (value?: string) => {
  if (!value) return undefined;
  return `${value}T00:00:00`;
};

const toEndDateTime = (value?: string) => {
  if (!value) return undefined;
  return `${value}T23:59:59`;
};

const buildReportPayload = (payload: BaseReportPayload) => {
  const startDate = String(payload?.startDate ?? "").trim();
  const endDate = String(payload?.endDate ?? "").trim();
  const franchiseId = String(payload?.franchiseId ?? "").trim();

  return {
    ...payload,
    franchiseId: franchiseId || null,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    fromDate: startDate || undefined,
    toDate: endDate || undefined,
    startAt: toStartDateTime(startDate),
    endAt: toEndDateTime(endDate),
  };
};

const USE_REPORT_MOCK = import.meta.env.DEV;
const DEFAULT_FRANCHISE_IDS = ["FRA-01", "FRA-02", "FRA-03", "FRA-04"];
const PROFILE_KEYS = ["DOWNTOWN", "CAMPUS", "AIRPORT", "SUBURB"] as const;

type Profile = {
  key: (typeof PROFILE_KEYS)[number];
  label: string;
  revenueBase: number;
  growthFactor: number;
  paymentMix: {
    CASH: number;
    MOMO: number;
    BANK_TRANSFER: number;
  };
  expenseSplit: {
    inventory: number;
    operation: number;
  };
  products: Array<{
    name: string;
    baseUnits: number;
    price: number;
    margin: number;
  }>;
  ingredientItems: string[];
  operationItems: string[];
};

const PROFILE_BY_KEY: Record<(typeof PROFILE_KEYS)[number], Profile> = {
  DOWNTOWN: {
    key: "DOWNTOWN",
    label: "Downtown Premium",
    revenueBase: 19500000,
    growthFactor: 1.28,
    paymentMix: { CASH: 0.16, MOMO: 0.57, BANK_TRANSFER: 0.27 },
    expenseSplit: { inventory: 0.44, operation: 0.56 },
    products: [
      { name: "Signature Latte", baseUnits: 680, price: 52000, margin: 0.39 },
      { name: "Caramel Cold Brew", baseUnits: 590, price: 56000, margin: 0.37 },
      { name: "Matcha Cream", baseUnits: 470, price: 54000, margin: 0.34 },
      { name: "Classic Espresso", baseUnits: 410, price: 39000, margin: 0.32 },
    ],
    ingredientItems: ["Premium Beans", "Whipping Cream", "Imported Matcha"],
    operationItems: ["City Rent", "POS Subscription", "Night Shift OT"],
  },
  CAMPUS: {
    key: "CAMPUS",
    label: "Campus Fast",
    revenueBase: 8400000,
    growthFactor: 0.93,
    paymentMix: { CASH: 0.42, MOMO: 0.49, BANK_TRANSFER: 0.09 },
    expenseSplit: { inventory: 0.62, operation: 0.38 },
    products: [
      { name: "Milk Tea Jumbo", baseUnits: 1040, price: 32000, margin: 0.23 },
      { name: "Peach Tea", baseUnits: 860, price: 29000, margin: 0.22 },
      { name: "Americano", baseUnits: 610, price: 28000, margin: 0.24 },
      { name: "Chocolate Ice", baseUnits: 530, price: 34000, margin: 0.21 },
    ],
    ingredientItems: ["Tea Leaves", "Flavored Syrup", "Ice Cup Lids"],
    operationItems: ["Student Promo", "Part-time Payroll", "Delivery Fees"],
  },
  AIRPORT: {
    key: "AIRPORT",
    label: "Airport Transit",
    revenueBase: 25400000,
    growthFactor: 1.42,
    paymentMix: { CASH: 0.08, MOMO: 0.21, BANK_TRANSFER: 0.71 },
    expenseSplit: { inventory: 0.41, operation: 0.59 },
    products: [
      { name: "Double Espresso", baseUnits: 720, price: 62000, margin: 0.41 },
      { name: "Protein Shake", baseUnits: 430, price: 79000, margin: 0.35 },
      { name: "Butter Croissant Set", baseUnits: 390, price: 89000, margin: 0.33 },
      { name: "Bottled Cold Brew", baseUnits: 510, price: 67000, margin: 0.37 },
    ],
    ingredientItems: ["Reserve Beans", "Protein Powder", "Bakery Supplies"],
    operationItems: ["Airport Lease", "24/7 Staffing", "Security Fee"],
  },
  SUBURB: {
    key: "SUBURB",
    label: "Suburb Family",
    revenueBase: 12600000,
    growthFactor: 1.05,
    paymentMix: { CASH: 0.51, MOMO: 0.31, BANK_TRANSFER: 0.18 },
    expenseSplit: { inventory: 0.58, operation: 0.42 },
    products: [
      { name: "Coconut Coffee", baseUnits: 510, price: 42000, margin: 0.28 },
      { name: "Salt Cream Coffee", baseUnits: 460, price: 44000, margin: 0.3 },
      { name: "Family Milk Tea", baseUnits: 690, price: 36000, margin: 0.25 },
      { name: "Yuzu Tea", baseUnits: 390, price: 38000, margin: 0.29 },
    ],
    ingredientItems: ["Local Milk", "Coconut Mix", "Seasonal Fruits"],
    operationItems: ["Utility Bills", "Weekend Staffing", "Local Delivery"],
  },
};

const toNumber = (value: unknown, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toMoney = (amount: number) => Math.max(0, Math.round(amount));

const toSeed = (value: string) => {
  let seed = 0;
  for (let i = 0; i < value.length; i += 1) {
    seed = (seed * 33 + value.charCodeAt(i)) % 100000;
  }
  return seed;
};

const pickFranchiseIds = (payload: BaseReportPayload) => {
  const picked = String(payload?.franchiseId ?? "").trim();
  return picked ? [picked] : DEFAULT_FRANCHISE_IDS;
};

const getProfileForFranchise = (franchiseId: string): Profile => {
  const idx = toSeed(franchiseId) % PROFILE_KEYS.length;
  return PROFILE_BY_KEY[PROFILE_KEYS[idx]];
};

const getDateRangeFactor = (payload: BaseReportPayload) => {
  const start = String(payload?.startDate ?? "").trim();
  const end = String(payload?.endDate ?? "").trim();
  if (!start || !end) return 1;

  const startTime = new Date(`${start}T00:00:00`).getTime();
  const endTime = new Date(`${end}T23:59:59`).getTime();
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) {
    return 1;
  }

  const days = Math.max(1, Math.ceil((endTime - startTime) / 86400000));
  return Math.min(2.2, Math.max(0.45, days / 30));
};

const mockRevenueReport = (payload: BaseReportPayload): RevenueReport => {
  const franchiseIds = pickFranchiseIds(payload);
  const dateFactor = getDateRangeFactor(payload);

  const revenueByFranchise = franchiseIds.map((franchiseId) => {
    const profile = getProfileForFranchise(franchiseId);
    const seed = toSeed(franchiseId);
    const variance = 0.87 + (seed % 41) / 100;
    const totalRevenue = toMoney(profile.revenueBase * profile.growthFactor * variance * dateFactor);
    return {
      franchiseId,
      totalRevenue,
    };
  });

  const totalRevenue = revenueByFranchise.reduce((sum, item) => sum + item.totalRevenue, 0);

  const paymentRevenue = {
    CASH: 0,
    MOMO: 0,
    BANK_TRANSFER: 0,
  };

  revenueByFranchise.forEach((item) => {
    const profile = getProfileForFranchise(item.franchiseId);
    paymentRevenue.CASH += item.totalRevenue * profile.paymentMix.CASH;
    paymentRevenue.MOMO += item.totalRevenue * profile.paymentMix.MOMO;
    paymentRevenue.BANK_TRANSFER += item.totalRevenue * profile.paymentMix.BANK_TRANSFER;
  });

  return {
    reportId: `mock-revenue-${Date.now()}`,
    totalRevenue,
    revenueByFranchise,
    revenueByPaymentMethod: [
      { paymentMethod: "CASH", totalRevenue: toMoney(paymentRevenue.CASH) },
      { paymentMethod: "MOMO", totalRevenue: toMoney(paymentRevenue.MOMO) },
      { paymentMethod: "BANK_TRANSFER", totalRevenue: toMoney(paymentRevenue.BANK_TRANSFER) },
    ],
  };
};

const mockExpenseReport = (payload: BaseReportPayload): ExpenseReport => {
  const franchiseId = pickFranchiseIds(payload)[0] ?? DEFAULT_FRANCHISE_IDS[0];
  const profile = getProfileForFranchise(franchiseId);
  const seed = toSeed(franchiseId);
  const dateFactor = getDateRangeFactor(payload);

  const gross = toMoney(profile.revenueBase * profile.growthFactor * dateFactor * (0.92 + (seed % 18) / 100));
  const totalExpense = toMoney(gross * (0.48 + (seed % 15) / 100));
  const inventoryCost = toMoney(totalExpense * profile.expenseSplit.inventory);
  const operationalCost = toMoney(totalExpense * profile.expenseSplit.operation);
  const now = new Date().toISOString();

  return {
    reportId: `mock-expense-${Date.now()}`,
    totalExpense,
    inventoryCost,
    operationalCost,
    expenses: [
      {
        id: `exp-${franchiseId}-i1`,
        franchiseId,
        expenseType: "INGREDIENT",
        itemName: profile.ingredientItems[0],
        quantity: 180 + (seed % 90),
        totalAmount: toMoney(inventoryCost * 0.42),
        createdAt: now,
      },
      {
        id: `exp-${franchiseId}-i2`,
        franchiseId,
        expenseType: "INGREDIENT",
        itemName: profile.ingredientItems[1],
        quantity: 140 + (seed % 70),
        totalAmount: toMoney(inventoryCost * 0.33),
        createdAt: now,
      },
      {
        id: `exp-${franchiseId}-i3`,
        franchiseId,
        expenseType: "INGREDIENT",
        itemName: profile.ingredientItems[2],
        quantity: 95 + (seed % 60),
        totalAmount: toMoney(inventoryCost * 0.25),
        createdAt: now,
      },
      {
        id: `exp-${franchiseId}-o1`,
        franchiseId,
        expenseType: "OPERATION",
        itemName: profile.operationItems[0],
        quantity: 1,
        totalAmount: toMoney(operationalCost * 0.46),
        createdAt: now,
      },
      {
        id: `exp-${franchiseId}-o2`,
        franchiseId,
        expenseType: "OPERATION",
        itemName: profile.operationItems[1],
        quantity: 1,
        totalAmount: toMoney(operationalCost * 0.31),
        createdAt: now,
      },
      {
        id: `exp-${franchiseId}-o3`,
        franchiseId,
        expenseType: "OPERATION",
        itemName: profile.operationItems[2],
        quantity: 1,
        totalAmount: toMoney(operationalCost * 0.23),
        createdAt: now,
      },
    ],
  };
};

const mockPerformanceReport = (payload: BaseReportPayload): ProductPerformance => {
  const franchiseId = pickFranchiseIds(payload)[0] ?? DEFAULT_FRANCHISE_IDS[0];
  const profile = getProfileForFranchise(franchiseId);
  const seed = toSeed(franchiseId);
  const dateFactor = getDateRangeFactor(payload);

  const items = profile.products.map((product, idx) => {
    const swing = 0.82 + ((seed + idx * 11) % 29) / 100;
    const unitSold = Math.round(product.baseUnits * dateFactor * swing);
    const revenue = toMoney(unitSold * product.price);
    const profit = toMoney(revenue * product.margin);
    const returnRate = Number((0.4 + ((seed + idx * 7) % 22) / 10).toFixed(1));

    return {
      productName: product.name,
      unitSold,
      revenue,
      profit,
      returnRate,
    };
  });

  const sorted = [...items].sort((a, b) => b.revenue - a.revenue);

  return {
    reportId: `mock-performance-${Date.now()}`,
    productPerformanceItems: items,
    topProduct: sorted[0],
    botProduct: sorted[sorted.length - 1],
  };
};

const mockProfitLossReport = (payload: BaseReportPayload): ProfitLossReport => {
  const revenue = mockRevenueReport(payload);
  const expense = mockExpenseReport(payload);
  const totalRevenue = toNumber(revenue.totalRevenue);
  const totalExpenses = toNumber(expense.totalExpense);
  const tax = toMoney(totalRevenue * 0.05);
  const netProfit = totalRevenue - totalExpenses - tax;

  return {
    reportId: `mock-profit-loss-${Date.now()}`,
    franchiseId: String(payload?.franchiseId ?? "") || null,
    totalRevenue,
    totalExpenses: totalExpenses + tax,
    netProfit,
    result: netProfit >= 0 ? "PROFIT" : "LOSS",
    revenueDetails: revenue,
    expenseDetails: {
      reportId: expense.reportId,
      franchiseId: String(payload?.franchiseId ?? "") || null,
      inventoryCost: expense.inventoryCost,
      operationalCost: expense.operationalCost,
      tax,
      totalExpense: totalExpenses + tax,
      expenses: (expense.expenses ?? []).map((item) => ({
        id: item.id ?? null,
        franchiseId: item.franchiseId ?? null,
        expenseType: item.expenseType,
        itemName: item.itemName ?? null,
        quantity: item.quantity ?? null,
        totalAmount: item.totalAmount,
        createdAt: item.createdAt ?? null,
      })),
    },
  };
};

const reportService = {
  generateRevenueReport: async (payload: any) => {
    if (USE_REPORT_MOCK) {
      return mockRevenueReport(payload ?? {});
    }

    const res = await api.post(
      `${REPORT_ENDPOINTS.REPORT.BASE}${REPORT_ENDPOINTS.REPORT.REVENUE}`,
      buildReportPayload(payload),
    );
    return pickPayload<any>(res.data as ApiResponse<any>);
  },

  generateExpenseReport: async (payload: any) => {
    if (USE_REPORT_MOCK) {
      return mockExpenseReport(payload ?? {});
    }

    const res = await api.post(
      `${REPORT_ENDPOINTS.REPORT.BASE}${REPORT_ENDPOINTS.REPORT.EXPENSE}`,
      buildReportPayload(payload),
    );
    return pickPayload<any>(res.data as ApiResponse<any>);
  },

  generateInventoryReport: async (payload: InventoryReportPayload) => {
    const res = await api.post(
      `${REPORT_ENDPOINTS.REPORT.BASE}${REPORT_ENDPOINTS.REPORT.INVENTORY}`,
      buildReportPayload(payload),
    );
    return pickPayload<any>(res.data as ApiResponse<any>);
  },

  generateProductPerformance: async (payload: any) => {
    if (USE_REPORT_MOCK) {
      return mockPerformanceReport(payload ?? {});
    }

    const res = await api.post(
      `${REPORT_ENDPOINTS.REPORT.BASE}${REPORT_ENDPOINTS.REPORT.PRODUCT_PERFORMANCE}`,
      buildReportPayload(payload),
    );
    return pickPayload<any>(res.data as ApiResponse<any>);
  },

  generateProfitLoss: async (payload: any) => {
    if (USE_REPORT_MOCK) {
      return mockProfitLossReport(payload ?? {});
    }

    const res = await api.post(
      `${REPORT_ENDPOINTS.REPORT.BASE}${REPORT_ENDPOINTS.REPORT.PROFIT_LOSS}`,
      buildReportPayload(payload),
    );
    return pickPayload<any>(res.data as ApiResponse<any>);
  },

  exportReport: async (id: string, reportType: string) => {
    const res = await api.get(
      `${REPORT_ENDPOINTS.REPORT.BASE}${REPORT_ENDPOINTS.REPORT.EXPORT(id)}`,
      {
        params: { reportType },
        responseType: "arraybuffer",
      },
    );
    return res;
  },
};

export default reportService;
