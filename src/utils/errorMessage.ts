import axios from "axios";

export type NormalizedError = {
  message: string;
  status?: number;
  code?: string;
  raw?: unknown;
};

export type AppError = Error & {
  status?: number;
  code?: string;
  raw?: unknown;
};

const SENSITIVE_SQL_REGEX =
  /could not execute statement|ERROR:|value too long for type|SQLException|ConstraintViolationException|org\.postgresql|at java\.|org\.springframework|SQL \[|insert into|update .* set/i;

const mapKnownBackendMessage = (message: string): string | null => {
  const msg = String(message || "");
  const lower = msg.toLowerCase();

  if (lower.includes("value too long for type character varying")) {
    return "Du lieu vuot qua do dai cho phep. Vui long rut gon noi dung roi thu lai.";
  }

  if (
    lower.includes("users_phone_key") ||
    (lower.includes("duplicate key") && lower.includes("phone"))
  ) {
    return "So dien thoai nay da duoc dang ky. Vui long dung so khac.";
  }

  if (
    lower.includes("users_email_key") ||
    (lower.includes("duplicate key") && lower.includes("email"))
  ) {
    return "Email nay da ton tai. Vui long su dung email khac.";
  }

  if (lower.includes("register failed: 400")) {
    return "Du lieu dang ky khong hop le. Vui long kiem tra lai thong tin.";
  }

  return null;
};

const sanitizeMessage = (message: string, status?: number): string => {
  const trimmed = String(message || "").trim();
  if (!trimmed) return mapStatusToMessage(status);

  const mapped = mapKnownBackendMessage(trimmed);
  if (mapped) return mapped;

  if (SENSITIVE_SQL_REGEX.test(trimmed)) {
    return mapStatusToMessage(status);
  }

  return trimmed;
};

const getServerMessage = (data: unknown): string => {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (typeof data !== "object") return "";

  const obj = data as Record<string, unknown>;
  const message =
    obj.message ||
    (obj.error && typeof obj.error === "object"
      ? (obj.error as Record<string, unknown>).message
      : undefined);

  if (typeof message === "string" && message.trim().length > 0) {
    return message;
  }

  const errors =
    obj.errors && typeof obj.errors === "object"
      ? (obj.errors as Record<string, unknown>)
      : null;
  if (errors) {
    for (const value of Object.values(errors)) {
      if (Array.isArray(value) && value.length > 0) {
        const first = value.find((item) => typeof item === "string");
        if (typeof first === "string" && first.trim().length > 0) {
          return first;
        }
      }
      if (typeof value === "string" && value.trim().length > 0) {
        return value;
      }
    }
  }

  return "";
};

const mapStatusToMessage = (status?: number): string => {
  switch (status) {
    case 400:
      return "Du lieu gui len khong hop le.";
    case 401:
      return "Ban chua dang nhap hoac phien dang nhap da het han.";
    case 403:
      return "Ban khong co quyen thuc hien chuc nang nay.";
    case 404:
      return "Khong tim thay du lieu.";
    case 429:
      return "Ban thao tac qua nhanh. Vui long doi it giay va thu lai.";
    case 500:
      return "He thong dang gap loi. Vui long thu lai sau.";
    case 503:
      return "Dich vu tam thoi khong kha dung. Vui long thu lai sau.";
    default:
      return "Da xay ra loi khong xac dinh.";
  }
};

export const getNormalizedError = (error: unknown): NormalizedError => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const serverMessage = getServerMessage(error.response?.data);

    if (!error.response) {
      return {
        message: "Khong the ket noi den may chu. Vui long thu lai.",
        raw: error,
      };
    }

    if (serverMessage.includes("ByteBuddyInterceptor")) {
      return {
        message: "He thong dang loi du lieu. Vui long thu lai sau.",
        status,
        raw: error,
      };
    }

    return {
      message: sanitizeMessage(serverMessage || "", status),
      status,
      raw: error,
    };
  }

  if (error instanceof Error) {
    const mappedFromError = sanitizeMessage(error.message, undefined);
    if (mappedFromError !== error.message) {
      return { message: mappedFromError, raw: error };
    }

    const fetchLike =
      error.message.includes("Failed to fetch") ||
      error.message.includes("NetworkError") ||
      error.message.includes("Load failed");

    if (fetchLike) {
      return {
        message: "Khong the ket noi den may chu. Vui long thu lai.",
        raw: error,
      };
    }

    return { message: sanitizeMessage(error.message, undefined), raw: error };
  }

  if (error && typeof error === "object") {
    const obj = error as Record<string, unknown>;
    const status = typeof obj.status === "number" ? obj.status : undefined;
    const message =
      (typeof obj.message === "string" && obj.message) ||
      (typeof obj.error === "string" && obj.error) ||
      "";

    return {
      message: sanitizeMessage(message || "", status),
      status,
      raw: error,
    };
  }

  return { message: "Da xay ra loi khong xac dinh.", raw: error };
};

export const getErrorMessage = (error: unknown): string => getNormalizedError(error).message;

export const toAppError = (error: unknown): AppError => {
  const normalized = getNormalizedError(error);
  const appError = new Error(normalized.message) as AppError;
  appError.status = normalized.status;
  appError.code = normalized.code;
  appError.raw = normalized.raw ?? error;
  return appError;
};
