import { useEffect, useState } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

const NOTIFICATION_DURATION = 4000; // 4 seconds

export function NotificationDisplay() {
  const { notifications, deleteNotification } = useNotification();
  const [visibleNotifications, setVisibleNotifications] = useState<string[]>([]);
  const [progressStates, setProgressStates] = useState<Record<string, number>>({});

  useEffect(() => {
    if (notifications.length > 0) {
      const notifId = notifications[0].id;
      setVisibleNotifications((prev) => [...prev, notifId]);
      setProgressStates((prev) => ({ ...prev, [notifId]: 100 }));

      const interval = setInterval(() => {
        setProgressStates((prev) => {
          const current = prev[notifId] || 100;
          const newProgress = Math.max(0, current - (100 / (NOTIFICATION_DURATION / 50)));
          return { ...prev, [notifId]: newProgress };
        });
      }, 50);

      const timer = setTimeout(() => {
        setVisibleNotifications((prev) => prev.filter((id) => id !== notifId));
        setProgressStates((prev) => {
          const updated = { ...prev };
          delete updated[notifId];
          return updated;
        });
        setTimeout(() => {
          deleteNotification(notifId);
        }, 300);
      }, NOTIFICATION_DURATION);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
    }
  }, [notifications, deleteNotification]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'ERROR':
        return <AlertCircle size={24} className="text-red-600 flex-shrink-0" />;
      case 'SUCCESS':
        return <CheckCircle size={24} className="text-green-600 flex-shrink-0" />;
      case 'WARNING':
        return <AlertTriangle size={24} className="text-yellow-600 flex-shrink-0" />;
      case 'INFO':
        return <Info size={24} className="text-blue-600 flex-shrink-0" />;
      default:
        return <Info size={24} className="text-blue-600 flex-shrink-0" />;
    }
  };

  const getBackgroundColor = (type: string) => {
    switch (type) {
      case 'ERROR':
        return 'bg-red-50';
      case 'SUCCESS':
        return 'bg-green-50';
      case 'WARNING':
        return 'bg-yellow-50';
      case 'INFO':
        return 'bg-blue-50';
      default:
        return 'bg-blue-50';
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case 'ERROR':
        return 'text-red-800';
      case 'SUCCESS':
        return 'text-green-800';
      case 'WARNING':
        return 'text-yellow-800';
      case 'INFO':
        return 'text-blue-800';
      default:
        return 'text-blue-800';
    }
  };

  const getAccentColor = (type: string) => {
    switch (type) {
      case 'ERROR':
        return 'bg-red-500';
      case 'SUCCESS':
        return 'bg-green-500';
      case 'WARNING':
        return 'bg-yellow-500';
      case 'INFO':
        return 'bg-blue-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="fixed top-6 right-6 z-[999999] space-y-3 max-w-sm pointer-events-none">
      {notifications.map((notif) => {
        const handleClose = () => {
          setVisibleNotifications((prev) => prev.filter((id) => id !== notif.id));
          setProgressStates((prev) => {
            const updated = { ...prev };
            delete updated[notif.id];
            return updated;
          });
          setTimeout(() => {
            deleteNotification(notif.id);
          }, 300);
        };

        return (
          <div
            key={notif.id}
            onClick={handleClose}
            className={`
              ${getBackgroundColor(notif.type)}
              rounded-lg shadow-xl overflow-hidden
              transform transition-all duration-300 ease-in-out
              pointer-events-auto cursor-pointer
              ${
                visibleNotifications.includes(notif.id)
                  ? 'translate-x-0 opacity-100'
                  : 'translate-x-full opacity-0 pointer-events-none'
              }
            `}
          >
            <div className="flex items-start gap-3 px-4 py-3">
              <div>{getIcon(notif.type)}</div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${getTextColor(notif.type)}`}>
                  {notif.message}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                className="flex-shrink-0 ml-2"
                aria-label="Close notification"
              >
                <X size={18} className={`${getTextColor(notif.type)} hover:opacity-70`} />
              </button>
            </div>
            <div className="h-1 bg-gray-200 overflow-hidden">
              <div
                className={`h-full ${getAccentColor(notif.type)} transition-all ease-linear`}
                style={{
                  width: `${progressStates[notif.id] ?? 100}%`,
                  transitionDuration: '50ms',
                }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
