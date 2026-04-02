import { http } from "@/utils/axiosClient";

interface OrderRecord {
  id?: string;
  orderNumber?: string;
  code?: string;
  status?: string;
  totalAmount?: number;
  createdAt?: string;
  createdDate?: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface TrendData {
  change: string;
  trend: 'up' | 'down';
  percentChange: number;
}

/**
 * Parse date from various formats
 */
const parseDate = (dateString: string | undefined): Date | null => {
  if (!dateString) return null;
  try {
    return new Date(dateString);
  } catch {
    return null;
  }
};

/**
 * Format date to YYYY-MM-DD
 */
const formatDateStr = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Extract orders from API response
 */
const extractOrders = (response: any): OrderRecord[] => {
  if (!response) return [];

  const payload = response?.data ?? response?.result ?? response;
  if (!payload) return [];

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.orders)) return payload.orders;
  if (Array.isArray(payload.data?.orders)) return payload.data.orders;
  if (Array.isArray(payload.result?.orders)) return payload.result.orders;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.records)) return payload.records;

  return [];
};

/**
 * Get revenue trend comparing today vs yesterday
 */
export const getRevenueTrend = async (): Promise<TrendData> => {
  try {
    const response = await http('/products/orders/list?limit=500&page=0');
    const orders = extractOrders(response);

    if (!Array.isArray(orders) || orders.length === 0) {
      return { change: '+0%', trend: 'up', percentChange: 0 };
    }

    const today = new Date();
    const todayStr = formatDateStr(today);
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = formatDateStr(yesterday);

    let todayRevenue = 0;
    let yesterdayRevenue = 0;

    orders.forEach((order: OrderRecord) => {
      const createdDate = order.createdAt || order.createdDate || order.timestamp;
      const date = parseDate(createdDate as string);

      if (!date) return;

      const dateStr = formatDateStr(date);
      const amount = Number(order.totalAmount) || 0;

      if (dateStr === todayStr) {
        todayRevenue += amount;
      } else if (dateStr === yesterdayStr) {
        yesterdayRevenue += amount;
      }
    });

    const percentChange = yesterdayRevenue > 0
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
      : 0;

    const change = percentChange >= 0
      ? `+${Math.round(percentChange * 10) / 10}%`
      : `${Math.round(percentChange * 10) / 10}%`;

    return {
      change,
      trend: percentChange >= 0 ? 'up' : 'down',
      percentChange,
    };
  } catch (error) {
    console.error('Error fetching revenue trend:', error);
    return { change: '+0%', trend: 'up', percentChange: 0 };
  }
};

/**
 * Get orders trend comparing today vs yesterday
 */
export const getOrdersTrend = async (): Promise<TrendData> => {
  try {
    const response = await http('/products/orders/list?limit=500&page=0');
    const orders = extractOrders(response);

    if (!Array.isArray(orders) || orders.length === 0) {
      return { change: '+0%', trend: 'up', percentChange: 0 };
    }

    const today = new Date();
    const todayStr = formatDateStr(today);
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = formatDateStr(yesterday);

    let todayOrderCount = 0;
    let yesterdayOrderCount = 0;

    orders.forEach((order: OrderRecord) => {
      const createdDate = order.createdAt || order.createdDate || order.timestamp;
      const date = parseDate(createdDate as string);

      if (!date) return;

      const dateStr = formatDateStr(date);

      if (dateStr === todayStr) {
        todayOrderCount++;
      } else if (dateStr === yesterdayStr) {
        yesterdayOrderCount++;
      }
    });

    const percentChange = yesterdayOrderCount > 0
      ? ((todayOrderCount - yesterdayOrderCount) / yesterdayOrderCount) * 100
      : 0;

    const change = percentChange >= 0
      ? `+${Math.round(percentChange * 10) / 10}%`
      : `${Math.round(percentChange * 10) / 10}%`;

    return {
      change,
      trend: percentChange >= 0 ? 'up' : 'down',
      percentChange,
    };
  } catch (error) {
    console.error('Error fetching orders trend:', error);
    return { change: '+0%', trend: 'up', percentChange: 0 };
  }
};

/**
 * Get completed orders trend comparing today vs yesterday
 */
export const getCompletedOrdersTrend = async (): Promise<TrendData> => {
  try {
    const response = await http('/products/orders/list?limit=500&page=0');
    const orders = extractOrders(response);

    if (!Array.isArray(orders) || orders.length === 0) {
      return { change: '+0%', trend: 'up', percentChange: 0 };
    }

    const today = new Date();
    const todayStr = formatDateStr(today);
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = formatDateStr(yesterday);

    let todayCompleted = 0;
    let yesterdayCompleted = 0;

    orders.forEach((order: OrderRecord) => {
      const createdDate = order.createdAt || order.createdDate || order.timestamp;
      const date = parseDate(createdDate as string);

      if (!date) return;

      const dateStr = formatDateStr(date);
      const isCompleted = order.status?.includes('COMPLETED') || order.status?.includes('DELIVERED');

      if (isCompleted) {
        if (dateStr === todayStr) {
          todayCompleted++;
        } else if (dateStr === yesterdayStr) {
          yesterdayCompleted++;
        }
      }
    });

    const percentChange = yesterdayCompleted > 0
      ? ((todayCompleted - yesterdayCompleted) / yesterdayCompleted) * 100
      : 0;

    const change = percentChange >= 0
      ? `+${Math.round(percentChange * 10) / 10}%`
      : `${Math.round(percentChange * 10) / 10}%`;

    return {
      change,
      trend: percentChange >= 0 ? 'up' : 'down',
      percentChange,
    };
  } catch (error) {
    console.error('Error fetching completed orders trend:', error);
    return { change: '+0%', trend: 'up', percentChange: 0 };
  }
};
