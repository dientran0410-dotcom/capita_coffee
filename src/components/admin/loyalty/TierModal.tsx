import { useEffect, useMemo, useRef, useState } from "react";
import type { CreateLoyaltyTierRequest, LoyaltyTierResponse, TierName } from "../../../types/Loyalty";
import { TIER_NAMES, TIER_POINTS } from "./constants";
import { useNotification } from "../../../context/NotificationContext";

type FranchiseOption = {
  id: string;
  label: string;
};

interface TierModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateLoyaltyTierRequest) => Promise<void>;
  initial?: LoyaltyTierResponse | null;
  franchiseOptions: FranchiseOption[];
  getFranchiseLabel: (franchiseId?: string | number | null) => string;
  existingTiers: LoyaltyTierResponse[];
}

export default function TierModal({
  open,
  onClose,
  onSave,
  initial,
  franchiseOptions,
  getFranchiseLabel,
  existingTiers,
}: TierModalProps) {
  const { addNotification } = useNotification();
  const defaultFranchiseId = useMemo(
    () => franchiseOptions[0]?.id ?? "",
    [franchiseOptions],
  );

  const [form, setForm] = useState<CreateLoyaltyTierRequest>({
    franchiseId: defaultFranchiseId,
    name: "BRONZE",
    tierMultiplier: 1,
    benefits: "",
  });
  const [franchiseSearch, setFranchiseSearch] = useState("");
  const [franchiseDropdownOpen, setFranchiseDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const franchiseDropdownRef = useRef<HTMLDivElement | null>(null);

  const filteredFranchiseOptions = useMemo(() => {
    const keyword = franchiseSearch.trim().toLowerCase();
    const matched = keyword
      ? franchiseOptions.filter((item) => item.label.toLowerCase().includes(keyword))
      : franchiseOptions;
    return matched.slice(0, 5);
  }, [franchiseOptions, franchiseSearch]);

  const selectedFranchiseOption = useMemo(
    () => franchiseOptions.find((item) => item.id === form.franchiseId) ?? null,
    [franchiseOptions, form.franchiseId],
  );

  const franchiseSuggestions = useMemo(() => {
    const list = [...filteredFranchiseOptions];
    if (selectedFranchiseOption && !list.some((item) => item.id === selectedFranchiseOption.id)) {
      list.unshift(selectedFranchiseOption);
    }
    return list.slice(0, 5);
  }, [filteredFranchiseOptions, selectedFranchiseOption]);

  const handleFranchiseInputChange = (value: string) => {
    setFranchiseSearch(value);
    const matched = franchiseOptions.find((item) => item.label.toLowerCase() === value.trim().toLowerCase());
    setForm((prev) => ({ ...prev, franchiseId: matched ? matched.id : "" }));
    setFranchiseDropdownOpen(true);
  };

  const handleSelectFranchise = (option: FranchiseOption) => {
    setFranchiseSearch(option.label);
    setForm((prev) => ({ ...prev, franchiseId: option.id }));
    setFranchiseDropdownOpen(false);
  };

  useEffect(() => {
    if (!open) return;

    if (initial) {
      setFranchiseSearch("");
      setFranchiseDropdownOpen(false);
      setForm({
        franchiseId: String(initial.franchiseId || defaultFranchiseId),
        name: initial.name,
        tierMultiplier: 1,
        benefits: initial.benefits || "",
      });
      return;
    }

    setFranchiseSearch("");
    setFranchiseDropdownOpen(false);
    setForm((prev) => ({
      franchiseId: prev.franchiseId || defaultFranchiseId,
      name: "BRONZE",
      tierMultiplier: 1,
      benefits: "",
    }));
  }, [initial, open, defaultFranchiseId]);

  useEffect(() => {
    if (!franchiseDropdownOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!franchiseDropdownRef.current) return;
      if (!franchiseDropdownRef.current.contains(event.target as Node)) {
        setFranchiseDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [franchiseDropdownOpen]);

  if (!open) return null;

  const handleSubmit = async () => {
    // Kiểm tra tier trùng lặp khi tạo mới (không phải cập nhật)
    if (!initial) {
      const franchiseLabel = getFranchiseLabel(form.franchiseId);
      const isDuplicate = existingTiers.some(
        (tier) =>
          String(tier.franchiseId) === String(form.franchiseId) &&
          tier.name === form.name
      );

      if (isDuplicate) {
        addNotification({
          type: "ERROR",
          title: "Tier Trùng Lặp",
          message: `Tier này đã tồn tại trong ${franchiseLabel}`,
          source: "TierModal",
        });
        return;
      }
    }

    setLoading(true);
    try {
      await onSave({ ...form, tierMultiplier: 1 });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-8 bg-black/45 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface-container-lowest w-full max-w-2xl max-h-[921px] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-outline-variant/15 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight">
              {initial ? "Cập Nhật Tier" : "Tạo Tier Mới"}
            </h2>
            <p className="text-sm text-on-surface-variant font-label mt-1">
              Thiết lập cấp bậc thành viên và quyền lợi đi kèm
            </p>
            {initial?.name && (
              <p className="text-xs text-on-surface-variant font-label mt-2">Tier: {initial.name}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-surface-container rounded-full transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                Franchise
              </label>

              {initial ? (
                <input
                  value={getFranchiseLabel(initial.franchiseId)}
                  readOnly
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium opacity-80"
                />
              ) : (
                <div className="relative" ref={franchiseDropdownRef}>
                  <input
                    name="franchiseId"
                    type="text"
                    value={franchiseSearch}
                    onChange={(e) => handleFranchiseInputChange(e.target.value)}
                    onFocus={() => setFranchiseDropdownOpen(true)}
                    placeholder="Tìm franchise..."
                    required
                    className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                  />

                  {franchiseDropdownOpen && (
                    <div className="absolute z-30 mt-1 w-full max-h-52 overflow-auto rounded-lg border border-outline-variant/20 bg-surface-container-lowest shadow-lg">
                      {franchiseSuggestions.length > 0 ? (
                        franchiseSuggestions.map((franchise) => (
                          <button
                            key={franchise.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectFranchise(franchise);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                          >
                            {franchise.label}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2.5 text-sm text-on-surface-variant">
                          Không tìm thấy franchise phù hợp.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!initial && !franchiseOptions.length ? (
                <p className="text-xs text-red-600 font-label">Không có franchise để chọn</p>
              ) : null}
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                Tên Tier
              </label>
              {initial ? (
                <input
                  value={`${initial.name} (không thể đổi)`}
                  readOnly
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium opacity-80"
                />
              ) : (
                <select
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value as TierName }))}
                >
                  {TIER_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {name} (min {TIER_POINTS[name]} pts)
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                Benefits
              </label>
              <textarea
                className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all resize-none min-h-[120px]"
                value={form.benefits}
                onChange={(e) => setForm((f) => ({ ...f, benefits: e.target.value }))}
                placeholder="VD: Miễn phí giao hàng, ưu tiên hỗ trợ..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-surface-container-low flex flex-col sm:flex-row justify-end items-center gap-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-8 py-3.5 bg-surface-container-highest text-on-surface font-label text-sm font-bold rounded-full hover:bg-surface-container-high transition-all active:scale-95"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto px-10 py-3.5 bg-gradient-to-r from-primary to-primary-container text-on-primary-container font-label text-sm font-extrabold rounded-full shadow-[0_10px_25px_-5px_rgba(63,255,139,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(63,255,139,0.4)] transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Đang lưu..." : initial ? "Cập Nhật" : "Tạo Mới"}
          </button>
        </div>
      </div>
    </div>
  );
}
