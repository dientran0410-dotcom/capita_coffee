import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Bell,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Users,
  FileX,
  FileCheck,
  UserPlus,
  UserCheck,
  UserX,
} from "lucide-react";
import type { Notification, NotificationType } from "../../types/Notification";

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

/**
 * Lấy icon tương ứng với loại notification
 */
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "staff_assigned":
      return <Users className="w-5 h-5 text-blue-500" />;
    case "event_created":
      return <Calendar className="w-5 h-5 text-green-500" />;
    case "event_pending_approval":
      return <Clock className="w-5 h-5 text-yellow-500" />;
    case "event_approved":
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case "event_rejected":
      return <XCircle className="w-5 h-5 text-red-500" />;
    case "event_cancelled":
      return <XCircle className="w-5 h-5 text-red-500" />;
    case "event_time_changed":
      return <Clock className="w-5 h-5 text-orange-500" />;
    case "one_day":
      return <Calendar className="w-5 h-5 text-blue-500" />;
    case "thirty_min":
      return <Clock className="w-5 h-5 text-orange-500" />;
    case "incident_reported":
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    case "cancellation_request":
      return <FileX className="w-5 h-5 text-yellow-500" />;
    case "cancellation_approved":
      return <FileCheck className="w-5 h-5 text-green-500" />;
    case "cancellation_rejected":
      return <XCircle className="w-5 h-5 text-red-500" />;
    case "organizer_request_submitted":
      return <UserPlus className="w-5 h-5 text-blue-500" />;
    case "organizer_request_received":
      return <UserPlus className="w-5 h-5 text-yellow-500" />;
    case "organizer_request_approved":
      return <UserCheck className="w-5 h-5 text-green-500" />;
    case "organizer_request_rejected":
      return <UserX className="w-5 h-5 text-red-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

/**
 * Lấy màu nền tương ứng với loại notification
 */
const getNotificationBgColor = (type: NotificationType, isRead: boolean) => {
  if (isRead) return "bg-white";

  switch (type) {
    case "event_approved":
    case "cancellation_approved":
      return "bg-green-50";
    case "event_rejected":
    case "event_cancelled":
    case "cancellation_rejected":
    case "incident_reported":
      return "bg-red-50";
    case "event_time_changed":
    case "cancellation_request":
    case "event_pending_approval":
      return "bg-yellow-50";
    case "one_day":
    case "thirty_min":
    case "staff_assigned":
    case "organizer_request_submitted":
      return "bg-blue-50";
    case "organizer_request_received":
      return "bg-yellow-50";
    case "organizer_request_approved":
      return "bg-green-50";
    case "organizer_request_rejected":
      return "bg-red-50";
    default:
      return "bg-gray-50";
  }
};

const NotificationItem = ({ notification, onClick }: NotificationItemProps) => {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: vi,
  });

  return (
    <div
      onClick={() => onClick(notification)}
      className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0 ${getNotificationBgColor(
        notification.type,
        notification.isRead
      )}`}
    >
      {/* Icon */}
      <div className="shrink-0 mt-0.5">
        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
          {getNotificationIcon(notification.type)}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm ${
            notification.isRead ? "text-gray-600" : "text-gray-900 font-medium"
          } line-clamp-2`}
        >
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
          {notification.content}
        </p>
        <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
      </div>

      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="shrink-0">
          <div className="w-2 h-2 bg-[#F27125] rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default NotificationItem;
