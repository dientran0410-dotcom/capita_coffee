import { useState, useRef, useEffect, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: {
    id?: string;
    name: string;
    phone: string;
  }) => void;
  onSkip?: () => void;
}

export default function CustomerModal({
  isOpen,
  onClose,
  onSelectCustomer,
  onSkip,
}: CustomerModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "customer-modal-qr-reader";

  // Stop scanner on close/unmount
  const stopScanner = useCallback(async () => {
    if (qrScannerRef.current) {
      try {
        await qrScannerRef.current.stop();
      } catch {
        // ignore
      }
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Cleanup on modal close
  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      // Reset form
      setCustomerName("");
      setCustomerPhone("");
      setScanError(null);
    }
  }, [isOpen, stopScanner]);

  // Cleanup refs on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const startScanner = async () => {
    setScanError(null);
    if (qrScannerRef.current) {
      await stopScanner();
    }

    try {
      const html5Qrcode = new Html5Qrcode(scannerContainerId);
      qrScannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 200, height: 200 },
        },
        (decodedText) => {
          // Parse QR code data (assumed JSON: { id, name, phone })
          try {
            const data = JSON.parse(decodedText);
            onSelectCustomer({
              id: data.id || data.customerId,
              name: data.name || "",
              phone: data.phone || data.phoneNumber || "",
            });
            stopScanner();
            onClose();
          } catch {
            // Treat as phone number if not JSON
            setCustomerPhone(decodedText.replace(/\D/g, ""));
            stopScanner();
          }
        },
        () => {
          // QR code not found in frame - ignore
        }
      );
      setIsScanning(true);
    } catch (err: any) {
      console.error("QR Scanner error:", err);
      setScanError(
        err?.message?.includes("Permission")
          ? "Không có quyền truy cập camera"
          : "Không thể khởi động camera"
      );
      setIsScanning(false);
    }
  };

  const handleSubmit = () => {
    if (!customerName.trim() && !customerPhone.trim()) {
      return;
    }
    onSelectCustomer({
      name: customerName.trim(),
      phone: customerPhone.trim(),
    });
    onClose();
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal Container */}
        <div
          className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-[70] p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Đóng"
          >
            <span className="material-symbols-outlined text-gray-500">
              close
            </span>
          </button>

          {/* Sidebar / QR Section */}
          <div className="md:w-5/12 bg-gray-50 p-8 flex flex-col items-center justify-center space-y-6 border-r border-gray-100">
            <div className="text-center">
              <h3 className="font-bold text-lg text-emerald-700">Quét mã QR</h3>
              <p className="text-xs text-gray-500 mt-1">
                Sử dụng thẻ thành viên hoặc mã ứng dụng
              </p>
            </div>

            {/* QR Scanner Area */}
            <div className="relative w-full aspect-square bg-zinc-900 rounded-xl overflow-hidden border-4 border-white shadow-lg">
              {/* Scanner container */}
              <div
                id={scannerContainerId}
                className="absolute inset-0 w-full h-full"
              />

              {/* Overlay when not scanning */}
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-emerald-900/10 to-emerald-900/10 border-2 border-dashed border-emerald-700">
                  <div className="w-48 h-48 border-2 border-emerald-300 rounded-lg relative">
                    {/* Scanner Corner Accents */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400" />
                  </div>
                </div>
              )}

              {/* Status badge */}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span
                  className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${
                    isScanning
                      ? "bg-emerald-500 text-white animate-pulse"
                      : "bg-emerald-700 text-emerald-100"
                  }`}
                >
                  {isScanning ? "Đang quét..." : "Đang chờ quét..."}
                </span>
              </div>
            </div>

            {/* Error message */}
            {scanError && (
              <p className="text-xs text-red-500 text-center">{scanError}</p>
            )}

            {/* Camera button */}
            <button
              onClick={isScanning ? stopScanner : startScanner}
              className="flex items-center gap-2 text-emerald-700 font-semibold text-sm hover:text-emerald-800 transition-colors"
            >
              <span className="material-symbols-outlined text-lg">
                {isScanning ? "videocam_off" : "photo_camera"}
              </span>
              <span>{isScanning ? "Tắt camera" : "Mở camera"}</span>
            </button>
          </div>

          {/* Form Section */}
          <div className="md:w-7/12 p-8 flex flex-col">
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">
                Thông tin khách hàng
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Nhập tên và số điện thoại để tích điểm
              </p>
            </div>

            <div className="space-y-6 flex-1">
              {/* Manual Form */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                      +84
                    </span>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) =>
                        setCustomerPhone(e.target.value.replace(/\D/g, ""))
                      }
                      className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      placeholder="900 000 000"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-10 flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-4 rounded-full hover:opacity-80 transition-opacity text-sm"
              >
                Bỏ qua
              </button>
              <button
                onClick={handleSubmit}
                disabled={!customerName.trim() && !customerPhone.trim()}
                className="flex-[2] bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold py-4 rounded-full shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span>Xác nhận thông tin</span>
                <span
                  className="material-symbols-outlined text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              </button>
            </div>

            <p className="text-[10px] text-center text-gray-400 mt-4">
              Thông tin khách hàng được bảo mật theo chính sách Heritage của
              Capital Coffee.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
