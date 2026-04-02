import { toast, type ToastContainerProps, type ToastOptions } from "react-toastify";

const ERROR_PATTERN =
  /(error|errors|failed|fail|cannot|can't|khong the|that bai|loi|not found|khong tim thay|reject|invalid)/i;
const WARNING_PATTERN =
  /(warning|warn|please|vui long|required|must be|must deactivate|select|can nhap)/i;

export const appToastContainerProps: ToastContainerProps = {
  position: "top-right",
  autoClose: 4000,
  hideProgressBar: false,
  newestOnTop: true,
  closeOnClick: true,
  rtl: false,
  pauseOnFocusLoss: true,
  draggable: true,
  pauseOnHover: true,
  theme: "light",
  style: { zIndex: 9999 },
};

const normalizeToastMessage = (message: unknown) => {
  if (typeof message === "string") {
    return message.trim();
  }

  if (message instanceof Error) {
    return message.message.trim();
  }

  return String(message ?? "").trim();
};

export const showSuccessToast = (message: unknown, options?: ToastOptions) => {
  const content = normalizeToastMessage(message);
  if (!content) return;
  toast.success(content, options);
};

export const showErrorToast = (message: unknown, options?: ToastOptions) => {
  const content = normalizeToastMessage(message);
  if (!content) return;
  toast.error(content, options);
};

export const showWarningToast = (message: unknown, options?: ToastOptions) => {
  const content = normalizeToastMessage(message);
  if (!content) return;
  toast.warn(content, options);
};

export const showInfoToast = (message: unknown, options?: ToastOptions) => {
  const content = normalizeToastMessage(message);
  if (!content) return;
  toast.info(content, options);
};

export const showAutoToast = (message: unknown, options?: ToastOptions) => {
  const content = normalizeToastMessage(message);
  if (!content) return;

  if (ERROR_PATTERN.test(content)) {
    showErrorToast(content, options);
    return;
  }

  if (WARNING_PATTERN.test(content)) {
    showWarningToast(content, options);
    return;
  }

  showSuccessToast(content, options);
};

export const installAlertAsToast = () => {
  const originalAlert = globalThis.alert;

  globalThis.alert = (message?: unknown) => {
    showAutoToast(message);
  };

  return () => {
    globalThis.alert = originalAlert;
  };
};
