import React, { useState, useEffect, useCallback } from 'react';
import { Check, Bell } from 'lucide-react';
import notificationService from '../../services/userNotificationService';

type UINotification = {
  id: number;
  title: string;
  message: string;
  time: string;
  date: string;
  unread: boolean;
};

const unwrap = <T,>(value: any): T => {
  if (value?.data !== undefined) return value.data as T;
  if (value?.payload !== undefined) return value.payload as T;
  return value as T;
};

const toDateTime = (rawTime?: string) => {
  if (!rawTime) {
    return { time: '', date: '' };
  }
  const date = new Date(rawTime);
  if (Number.isNaN(date.getTime())) {
    return { time: rawTime, date: '' };
  }
  return {
    time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    date: date.toLocaleDateString('vi-VN'),
  };
};

const normalizeNotifications = (response: any): UINotification[] => {
  const resolved = unwrap<any>(response);
  const list = Array.isArray(resolved)
    ? resolved
    : Array.isArray(resolved?.data)
      ? resolved.data
      : Array.isArray(resolved?.items)
        ? resolved.items
        : [];

  return list.map((item: any) => {
    const dateTime = toDateTime(item.createdAt ?? item.timestamp);
    return {
      id: Number(item.id ?? 0),
      title: String(item.title ?? item.type ?? 'Notification'),
      message: String(item.content ?? item.message ?? ''),
      time: dateTime.time,
      date: dateTime.date,
      unread: Boolean(item.isRead === false || item.unread === true),
    };
  });
};

export default function NotificationPage() {
  const [notifications, setNotifications] = useState<UINotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications({
        page: 1,
        limit: 50,
        isRead: filter === 'unread' ? false : undefined,
      });
      let items = normalizeNotifications(res);
      if (filter === 'unread') {
        items = items.filter((n) => n.unread);
      }
      setNotifications(items);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
      );
    } catch (error) {
      console.error('Error marking as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    } catch (error) {
      console.error('Error marking all as read', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-600" />
            My Notifications
          </h1>
          <p className="text-gray-500 mt-1">Stay updated with your orders and special offers</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="border-gray-300 rounded-lg text-sm bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer border"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Notifications</option>
            <option value="unread">Unread Only</option>
          </select>

          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors text-sm font-medium whitespace-nowrap"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No notifications found</h3>
            <p className="text-gray-500 mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 flex items-start gap-4 transition-colors hover:bg-gray-50 ${notification.unread ? 'bg-amber-50/20' : ''}`}
              >
                <div
                  className={`mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full ${notification.unread ? 'bg-amber-500' : 'bg-transparent'}`}
                ></div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-1">
                    <h4 className={`text-base ${notification.unread ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {notification.time}
                      {notification.date ? ` (${notification.date})` : ''}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{notification.message}</p>

                  {notification.unread && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="mt-3 text-sm text-amber-600 font-medium hover:text-amber-700 hover:underline"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
