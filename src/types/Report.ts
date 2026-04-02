// ── Revenue ──
export interface FranchiseRevenue {
  franchiseId: string;
  totalRevenue: number;
}

export interface PaymentMethodRevenue {
  paymentMethod: string;
  totalRevenue: number;
}

export interface RevenueReport {
  reportId: string;
  totalRevenue: number;
  revenueByFranchise: FranchiseRevenue[];
  revenueByPaymentMethod: PaymentMethodRevenue[];
}

// ── Expense ──
export interface ExpenseItem {
  id?: string | null;
  franchiseId?: string | null;
  expenseType: string;
  itemName?: string | null;
  quantity?: number | null;
  totalAmount: number;
  createdAt?: string | null;
}

export interface ExpenseReport {
  reportId: string;
  totalExpense: number;
  inventoryCost: number;
  operationalCost: number;
  expenses?: ExpenseItem[];
}

// ── Inventory ──
export interface InventoryItem {
  productName: string;
  currentStock: number;
  inboundQuantity: number;
  outboundQuantity: number;
}

export interface InventoryReport {
  reportId: string;
  warehouseId: number;
  franchiseId: string;
  items: InventoryItem[];
}

// ── Performance ──
export interface ProductPerformanceItem {
  productName: string;
  unitSold: number;
  revenue: number;
  profit: number;
  returnRate: number;
}

export interface ProductPerformance {
  reportId: string;
  productPerformanceItems: ProductPerformanceItem[];
  topProduct: ProductPerformanceItem;
  botProduct: ProductPerformanceItem;
}

// ── Profit/Loss ──
export interface ProfitLossReport {
  reportId: string | null;
  franchiseId: string | null;

  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  result: string;

  revenueDetails: RevenueReport;
  expenseDetails: {
    reportId: string;
    franchiseId: string | null;
    inventoryCost: number;
    operationalCost: number;
    tax: number | null;
    totalExpense: number;

    expenses: {
      id: string | null;
      franchiseId: string | null;
      expenseType: string;
      itemName: string | null;
      quantity: number | null;
      totalAmount: number;
      createdAt: string | null;
    }[];
  };
}
