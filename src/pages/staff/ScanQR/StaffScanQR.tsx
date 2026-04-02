import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { checkRedemption } from "../../../services/redemptionService";
import type { QRCheckResponse } from "../../../types/redemption";
import { useAuth } from "../../../context/AuthContext";
import "./StaffScanQR.css";

type OrderInfo = {
  orderCode: string
  rewardName: string
  points: number
  customerName: string
}

type NormalizedQRCheckResponse = QRCheckResponse & {
  customerName: string
}

type PopupState = {
  show: boolean
  type: "success" | "error" | ""
  message: string
  order: OrderInfo | null
}

export default function StaffScanQR() {
  const { user, role } = useAuth();
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const isVerifyingRef = useRef(false);
  const scanLockedRef = useRef(false);
  const lastScanRef = useRef<{ code: string; ts: number }>({
    code: "",
    ts: 0
  });

  const SCAN_COOLDOWN_MS = 2000;

  const userRecord = (user ?? {}) as Record<string, unknown>;
  const staffName =
    (typeof userRecord.fullName === "string" && userRecord.fullName.trim()) ||
    (typeof userRecord.name === "string" && userRecord.name.trim()) ||
    (typeof userRecord.username === "string" && userRecord.username.trim()) ||
    "Nhân viên";
  const staffRole = (role || "STAFF").toUpperCase();

  const [manualCode, setManualCode] = useState("");

  const [popup, setPopup] = useState<PopupState>({
    show: false,
    type: "",
    message: "",
    order: null
  });

  const parseQrCodeValue = (rawValue: string) => {
    const cleaned = rawValue.trim();
    if (!cleaned) return "";

    const withoutPrefix = cleaned.replace(/^REDEEM:/i, "").trim();

    const extractFromObject = (value: unknown) => {
      if (!value || typeof value !== "object") return "";
      const candidateKeys = [
        "code",
        "redemptionCode",
        "redeemCode",
        "couponCode",
        "value",
        "token"
      ];

      for (const key of candidateKeys) {
        const maybe = (value as Record<string, unknown>)[key];
        if (typeof maybe === "string" && maybe.trim()) {
          return maybe.trim();
        }
      }

      return "";
    };

    const tryParseUrl = (value: string) => {
      try {
        const parsed = new URL(value);
        const queryKeys = ["code", "redemptionCode", "redeemCode", "couponCode", "token"];

        for (const key of queryKeys) {
          const queryValue = parsed.searchParams.get(key);
          if (queryValue && queryValue.trim()) {
            return queryValue.trim();
          }
        }

        const segments = parsed.pathname.split("/").filter(Boolean);
        if (segments.length > 0) {
          return segments[segments.length - 1];
        }
      } catch {
        // Not a URL; continue with other parsers.
      }

      return "";
    };

    try {
      const parsedJson = JSON.parse(withoutPrefix);
      const fromJson = extractFromObject(parsedJson);
      if (fromJson) {
        return fromJson;
      }
    } catch {
      // Not JSON.
    }

    const fromUrl = tryParseUrl(withoutPrefix);
    if (fromUrl) {
      return fromUrl;
    }

    const queryMatch = withoutPrefix.match(/[?&](?:code|redemptionCode|redeemCode|couponCode|token)=([^&]+)/i);
    if (queryMatch?.[1]) {
      return decodeURIComponent(queryMatch[1]).trim();
    }

    return withoutPrefix;
  };

  const normalizeCheckResponse = (raw: unknown): NormalizedQRCheckResponse => {
    const data = (raw ?? {}) as Record<string, unknown>;
    const customerObj = (data.customer ?? data.user ?? data.account ?? {}) as Record<string, unknown>;

    const pickString = (...values: unknown[]) => {
      for (const value of values) {
        if (typeof value === "string" && value.trim()) {
          return value.trim();
        }
      }
      return "";
    };

    const hasSuccessPayload =
      typeof data.redemptionCode === "string" ||
      typeof data.redemptCode === "string" ||
      typeof data.rewardName === "string";

    const valid =
      typeof data.valid === "boolean"
        ? data.valid
        : typeof data.isValid === "boolean"
          ? data.isValid
          : typeof data.success === "boolean"
            ? data.success
            : hasSuccessPayload;

    const message =
      typeof data.message === "string" && data.message.trim()
        ? data.message
        : valid
          ? "Xác thực QR thành công"
          : "Mã QR không hợp lệ";

    const redemptionCode = pickString(
      data.redemptionCode,
      data.redemptCode,
      data.code
    );

    const rewardName = pickString(
      data.rewardName,
      data.reward
    );

    const customerName = pickString(
      data.customerName,
      data.customerFullName,
      data.fullName,
      data.userName,
      data.accountName,
      customerObj.customerName,
      customerObj.fullName,
      customerObj.name,
      customerObj.userName,
      customerObj.accountName
    ) || "Khách hàng";

    const pointsRaw =
      typeof data.redemptionPoints === "number"
        ? data.redemptionPoints
        : typeof data.points === "number"
          ? data.points
          : typeof data.pointsUsed === "number"
            ? data.pointsUsed
            : 0;

    return {
      valid,
      message,
      redemptionCode,
      rewardName,
      redemptionPoints: pointsRaw,
      customerName
    };
  };

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, show: false }));
    scanLockedRef.current = false;
  };

  /* VERIFY FUNCTION (scan + manual dùng chung) */

  const verifyCode = async (rawCode: string, source: "scan" | "manual" = "scan") => {
    const code = parseQrCodeValue(rawCode);

    if (!code) {
      setPopup({
        show: true,
        type: "error",
        message: "Không đọc được mã QR hợp lệ",
        order: null
      });
      return;
    }

    const now = Date.now();
    const sameCodeInCooldown =
      source === "scan" &&
      lastScanRef.current.code === code &&
      now - lastScanRef.current.ts < SCAN_COOLDOWN_MS;

    if (source === "scan" && (scanLockedRef.current || sameCodeInCooldown)) {
      return;
    }

    if (isVerifyingRef.current) return;

    isVerifyingRef.current = true;
    if (source === "scan") {
      lastScanRef.current = { code, ts: now };
    }

    try {

      const apiResult = await checkRedemption(code);
      const result = normalizeCheckResponse(apiResult);

      if (source === "scan") {
        scanLockedRef.current = true;
      }

      if (!result.valid) {
        setPopup({
          show: true,
          type: "error",
          message: result.message,
          order: null
        });
        return;
      }

      setPopup({
        show: true,
        type: "success",
        message: result.message,
        order: {
          orderCode: result.redemptionCode,
          rewardName: result.rewardName,
          points: result.redemptionPoints,
          customerName: result.customerName
        }
      });

    } catch (error) {

      console.error(error);

      setPopup({
        show: true,
        type: "error",
        message: "Không thể kiểm tra QR",
        order: null
      });

      if (source === "scan") {
        scanLockedRef.current = true;
      }

    } finally {
      isVerifyingRef.current = false;
    }

  };

  /* CAMERA SCANNER */

  useEffect(() => {
    let disposed = false;

    const initTimer = window.setTimeout(async () => {
      if (disposed) return;

      const readerElement = document.getElementById("reader");
      if (!readerElement) return;

      // Always tear down any stale scanner instance before creating a new one.
      if (scannerRef.current) {
        await scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }

      // Reset scanner container to avoid duplicated layers after hot reload/strict re-mount.
      readerElement.innerHTML = "";

      const scanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 280, height: 280 } },
        false
      );

      scannerRef.current = scanner;

      scanner.render(
        async (decodedText) => {
          await verifyCode(decodedText, "scan");
        },
        () => {}
      );
    }, 0);

    return () => {
      disposed = true;
      window.clearTimeout(initTimer);

      const currentScanner = scannerRef.current;
      scannerRef.current = null;
      if (currentScanner) {
        currentScanner.clear().catch(() => {});
      }

      const cleanupReader = document.getElementById("reader");
      if (cleanupReader) {
        cleanupReader.innerHTML = "";
      }
    };

  }, []);

  /* MANUAL VERIFY */

  const handleManualVerify = () => {

    if (!manualCode.trim()) return;

    verifyCode(manualCode, "manual");

  };

  return (

    <div className="scan-page">

      <div className="main-area">

        {/* HEADER */}

        <div className="topbar">

          <div className="page-title">
            <h1>QR Code Verification Hub</h1>
            <p>Verify customer coupons, rewards, and mobile orders instantly.</p>
          </div>

          <div className="staff-info">
            <div>
              <div className="staff-name">{staffName}</div>
              <div className="staff-role">{staffRole}</div>
            </div>
          </div>

        </div>

        {/* CONTENT */}

        <div className="qr-content">

          {/* SCAN */}

          <div className="scan-card">

            <div className="scan-header">
              <h2>Scan QR Code</h2>
              <span className="live-badge">LIVE CAMERA</span>
            </div>

            <div className="scanner-box">
              <div id="reader"></div>
            </div>

          </div>

          {/* MANUAL */}

          <div className="manual-card">

            <h2>Manual Entry</h2>

            <p>Enter QR Code Manually</p>

            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="e.g. CP-8821-X"
            />

            <button onClick={handleManualVerify}>
              Verify Code
            </button>

          </div>

        </div>

      </div>

      {/* SUCCESS POPUP */}

      {popup.show && popup.type === "success" && popup.order && (

        <div className="popup-overlay">

          <div className="popup-card">

            <div className="popup-icon success">✓</div>

            <h2>Xác nhận thành công!</h2>

            <p>{popup.message}</p>

            <div className="order-box">

              <div className="order-header">
                <span>THÔNG TIN ĐƠN HÀNG:   </span>
                <span className="order-code">
                  #{popup.order.orderCode}
                </span>
              </div>

              <div className="order-row">
                <span>Khách hàng:   </span>
                <span>{popup.order.customerName}</span>
              </div>

              <div className="order-row">
                <span>Sản phẩm:   </span>
                <span>{popup.order.rewardName}</span>
              </div>

              <div className="order-total">
                <span>Tổng cộng:   </span>
                <span className="points">
                  {popup.order.points} Points
                </span>
              </div>

            </div>

            <button
              className="popup-btn success"
              onClick={closePopup}
            >
              Đóng
            </button>

          </div>

        </div>

      )}

      {/* ERROR POPUP */}

      {popup.show && popup.type === "error" && (

        <div className="popup-overlay">

          <div className="popup-card">

            <div className="popup-icon error">!</div>

            <h2>Mã không hợp lệ!</h2>

            <p>{popup.message}</p>

            <button
              className="popup-btn retry"
              onClick={closePopup}
            >
              Thử lại
            </button>

          </div>

        </div>

      )}

    </div>

  );

}
