
interface ConfirmModalProps {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ open, message, onConfirm, onCancel }: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-8 bg-black/45 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface-container-lowest w-full max-w-md rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="px-8 py-6 border-b border-outline-variant/15 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-headline font-extrabold text-on-surface tracking-tight">Xác nhận</h2>
            <p className="text-sm text-on-surface-variant font-label mt-1">Thao tác này không thể hoàn tác</p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="p-2 hover:bg-surface-container rounded-full transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        <div className="p-8">
          <p className="text-on-surface font-label text-sm leading-6">{message}</p>
        </div>

        <div className="px-8 py-6 bg-surface-container-low flex flex-col sm:flex-row justify-end items-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-8 py-3.5 bg-surface-container-highest text-on-surface font-label text-sm font-bold rounded-full hover:bg-surface-container-high transition-all active:scale-95"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto px-10 py-3.5 bg-red-600 text-white font-label text-sm font-extrabold rounded-full shadow-[0_10px_25px_-5px_rgba(239,68,68,0.35)] hover:bg-red-700 transition-all active:scale-95"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
