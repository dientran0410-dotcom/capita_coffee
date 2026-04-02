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

interface DailyRevenueData {
  day: string;
  revenue: number;
  orders: number;
  date: string;
}

interface HourlyRevenueData {
  hour: string;
  revenue: number;
  orders: number;
  time: string;
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
 * Format date to day of week (Mon, Tue, etc.)
 */
const formatDayOfWeek = (date: Date): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};

/**
 * Format date to YYYY-MM-DD
 */
const formatDateStr = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Format hour (0-23 to 12AM, 1AM, etc.)
 */
const formatHour = (hour: number): string => {
  if (hour === 0) return '12AM';
  if (hour < 12) return `${hour}AM`;
  if (hour === 12) return '12PM';
  return `${hour - 12}PM`;
};

/**
 * Get daily revenue data for the past 7 days
 */
export const getDailyRevenueData = async (): Promise<DailyRevenueData[]> => {
  try {
    // Fetch orders for the past week
    const response = await http('/products/orders/list?limit=500&page=0');
    const orders = extractOrders(response);

    if (!Array.isArray(orders) || orders.length === 0) {
      return generateDefaultDailyData();
    }

    // Group orders by day
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const dailyMap = new Map<string, { revenue: number; orders: number }>();

    // Initialize past 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = formatDateStr(date);
      const dayName = formatDayOfWeek(date);
      dailyMap.set(dateStr, { revenue: 0, orders: 0 });
    }

    // Aggregate order data
    orders.forEach((order: OrderRecord) => {
      const createdDate = order.createdAt || order.createdDate || order.timestamp;
      const date = parseDate(createdDate as string);

      if (!date || date < sevenDaysAgo || date > today) return;

      const dateStr = formatDateStr(date);
      const existing = dailyMap.get(dateStr) || { revenue: 0, orders: 0 };

      existing.revenue += Number(order.totalAmount) || 0;
      existing.orders += 1;

      dailyMap.set(dateStr, existing);
    });

    // Convert to array and sort by date (oldest first)
    const result: DailyRevenueData[] = [];
    const sortedDates = Array.from(dailyMap.keys()).sort();

    sortedDates.forEach((dateStr) => {
      const date = new Date(dateStr);
      const data = dailyMap.get(dateStr);
      result.push({
        day: formatDayOfWeek(date),
        revenue: Math.round(data?.revenue || 0),
        orders: data?.orders || 0,
        date: dateStr,
      });
    });

    return result.length > 0 ? result : generateDefaultDailyData();
  } catch (error) {
    console.error('Error fetching daily revenue data:', error);
    return generateDefaultDailyData();
  }
};

/**
 * Get hourly revenue data for today
 */
export const getHourlyRevenueData = async (): Promise<HourlyRevenueData[]> => {
  try {
    // Fetch today's orders
    const response = await http('/products/orders/list?limit=500&page=0');
    const orders = extractOrders(response);

    if (!Array.isArray(orders) || orders.length === 0) {
      return generateDefaultHourlyData();
    }

    const today = new Date();
    const todayStr = formatDateStr(today);

    const hourlyMap = new Map<number, { revenue: number; orders: number }>();

    // Initialize 24 hours
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, { revenue: 0, orders: 0 });
    }

    // Aggregate order data by hour
    orders.forEach((order: OrderRecord) => {
      const createdDate = order.createdAt || order.createdDate || order.timestamp;
      const date = parseDate(createdDate as string);

      if (!date || formatDateStr(date) !== todayStr) return;

      const hour = date.getHours();
      const existing = hourlyMap.get(hour) || { revenue: 0, orders: 0 };

      existing.revenue += Number(order.totalAmount) || 0;
      existing.orders += 1;

      hourlyMap.set(hour, existing);
    });

    // Convert to array
    const result: HourlyRevenueData[] = [];
    for (let i = 0; i < 24; i++) {
      const data = hourlyMap.get(i);
      result.push({
        hour: formatHour(i),
        revenue: Math.round(data?.revenue || 0),
        orders: data?.orders || 0,
        time: formatHour(i),
      });
    }

    return result;
  } catch (error) {
    console.error('Error fetching hourly revenue data:', error);
    return generateDefaultHourlyData();
  }
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
 * Generate default daily revenue data (fallback)
 */
const generateDefaultDailyData = (): DailyRevenueData[] => {
  const today = new Date();
  const result: DailyRevenueData[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = formatDateStr(date);
    result.push({
      day: formatDayOfWeek(date),
      revenue: 0,
      orders: 0,
      date: dateStr,
    });
  }

  return result;
};

/**
 * Generate default hourly revenue data (fallback)
 */
const generateDefaultHourlyData = (): HourlyRevenueData[] => {
  const result: HourlyRevenueData[] = [];

  for (let i = 0; i < 24; i++) {
    result.push({
      hour: formatHour(i),
      revenue: 0,
      orders: 0,
      time: formatHour(i),
    });
  }

  return result;
};
