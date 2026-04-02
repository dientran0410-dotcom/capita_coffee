import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info' | 'success';
}

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  type = 'warning'
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: <AlertTriangle size={48} className="text-red-500" />,
      confirmButton: 'bg-red-600 hover:bg-red-700',
      titleColor: 'text-red-900'
    },
    warning: {
      icon: <AlertTriangle size={48} className="text-yellow-500" />,
      confirmButton: 'bg-yellow-600 hover:bg-yellow-700',
      titleColor: 'text-yellow-900'
    },
    info: {
      icon: <AlertTriangle size={48} className="text-blue-500" />,
      confirmButton: 'bg-blue-600 hover:bg-blue-700',
      titleColor: 'text-blue-900'
    },
    success: {
      icon: <AlertTriangle size={48} className="text-green-500" />,
      confirmButton: 'bg-green-600 hover:bg-green-700',
      titleColor: 'text-green-900'
    }
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className={`text-lg font-semibold ${config.titleColor}`}>
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            {config.icon}
            <p className="text-gray-700 text-base">{message}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-lg transition-colors font-medium ${config.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;