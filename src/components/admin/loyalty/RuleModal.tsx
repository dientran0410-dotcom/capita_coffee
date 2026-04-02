import { useEffect, useMemo, useRef, useState } from "react";
import type { EventType, LoyaltyRuleRequest, LoyaltyRuleResponse } from "../../../types/Loyalty";
import { EVENT_TYPES, EVENT_TYPE_ICONS, NO_DATE_EVENTS } from "./constants";

type FranchiseOption = {
  id: string;
  label: string;
};

interface RuleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: LoyaltyRuleRequest, franchiseId: string) => Promise<void>;
  initial?: LoyaltyRuleResponse | null;
  existingRules: LoyaltyRuleResponse[];
  franchiseOptions: FranchiseOption[];
  getFranchiseLabel: (franchiseId?: string | number | null) => string;
}

export default function RuleModal({
  open,
  onClose,
  onSave,
  initial,
  existingRules,
  franchiseOptions,
  getFranchiseLabel,
}: RuleModalProps) {
  const now = useMemo(() => new Date().toISOString().slice(0, 16), []);

  const [form, setForm] = useState<LoyaltyRuleRequest>({
    name: "",
    eventType: "ORDER",
    pointMultiplier: 1,
    fixedPoints: 0,
    isActive: true,
    startDate: now,
    endDate: now,
  });
  const defaultFranchiseId = useMemo(
    () => franchiseOptions[0]?.id ?? "",
    [franchiseOptions],
  );

  const [franchiseId, setFranchiseId] = useState(defaultFranchiseId);
  const [franchiseSearch, setFranchiseSearch] = useState("");
  const [franchiseDropdownOpen, setFranchiseDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const franchiseDropdownRef = useRef<HTMLDivElement | null>(null);

  const filteredFranchiseOptions = useMemo(() => {
    const keyword = franchiseSearch.trim().toLowerCase();
    const matched = keyword
      ? franchiseOptions.filter((item) => item.label.toLowerCase().includes(keyword))
      : franchiseOptions;
    return matched.slice(0, 5);
  }, [franchiseOptions, franchiseSearch]);

  const selectedFranchiseOption = useMemo(
    () => franchiseOptions.find((item) => item.id === franchiseId) ?? null,
    [franchiseOptions, franchiseId],
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
    setFranchiseId(matched ? matched.id : "");
    setFranchiseDropdownOpen(true);
  };

  const handleSelectFranchise = (option: FranchiseOption) => {
    setFranchiseSearch(option.label);
    setFranchiseId(option.id);
    setFranchiseDropdownOpen(false);
  };

  const needsDate = !NO_DATE_EVENTS.includes(form.eventType);

  const conflictingRule = !initial
    ? existingRules.find(
        (r) =>
          r.eventType === form.eventType &&
          r.isActive &&
          String(r.franchiseId ?? "") === String(franchiseId ?? ""),
      )
    : null;

  useEffect(() => {
    if (!open) return;

    if (initial) {
      setFranchiseSearch("");
      setFranchiseDropdownOpen(false);
      setForm({
        name: initial.name || "",
        eventType: initial.eventType,
        pointMultiplier: initial.pointMultiplier ?? 1,
        fixedPoints: initial.fixedPoints ?? 0,
        isActive: initial.isActive ?? true,
        startDate: initial.startDate?.slice(0, 16) || now,
        endDate: initial.endDate?.slice(0, 16) || now,
      });
      setFranchiseId(String(initial.franchiseId || defaultFranchiseId));
      return;
    }

    setFranchiseSearch("");
    setFranchiseDropdownOpen(false);
    setForm({
      name: "",
      eventType: "ORDER",
      pointMultiplier: 1,
      fixedPoints: 0,
      isActive: true,
      startDate: now,
      endDate: now,
    });

    setFranchiseId((prev) => prev || defaultFranchiseId);
  }, [initial, open, now, defaultFranchiseId]);

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
    setSubmitError(null);

    if (!form.name.trim()) {
      setSubmitError("Rule name is required.");
      return;
    }

    if (!franchiseId || franchiseId.trim().length === 0) {
      setSubmitError("Franchise ID is required.");
      return;
    }

    if (!Number.isFinite(form.pointMultiplier) || form.pointMultiplier < 0) {
      setSubmitError("Point multiplier must be a valid number >= 0.");
      return;
    }

    if (!Number.isFinite(form.fixedPoints) || form.fixedPoints < 0) {
      setSubmitError("Fixed points must be a valid number >= 0.");
      return;
    }

    if (needsDate && form.startDate && form.endDate && form.startDate > form.endDate) {
      setSubmitError("Start date must be before end date.");
      return;
    }

    setLoading(true);
    try {
      let payload: LoyaltyRuleRequest = {
        name: form.name.trim(),
        eventType: form.eventType,
        pointMultiplier: form.pointMultiplier,
        fixedPoints: form.fixedPoints,
        isActive: form.isActive,
      };

      if (needsDate) {
        payload = { ...payload, startDate: form.startDate, endDate: form.endDate };
      }

      await onSave(payload, franchiseId.trim());
      onClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.error?.details ||
        error?.message ||
        "Create rule failed. Please check server logs.";
      setSubmitError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 md:p-6 bg-black/45 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface-container-lowest w-full max-w-3xl lg:max-w-4xl max-h-[88vh] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-outline-variant/15 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight">
              {initial ? "Cập Nhật Rule" : "Tạo Rule Mới"}
            </h2>
            <p className="text-sm text-on-surface-variant font-label mt-1">
              Thiết lập quy tắc tích điểm theo sự kiện
            </p>
            {initial?.eventType && (
              <p className="text-xs text-on-surface-variant font-label mt-2">Event: {initial.eventType}</p>
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
          {conflictingRule && (
            <div className="mb-6 rounded-lg bg-orange-50 text-orange-800 border border-orange-200 px-4 py-3 text-sm font-label">
              Event <b>{form.eventType}</b> đã có rule đang active: <b>{conflictingRule.name || conflictingRule.eventType}</b>
            </div>
          )}

          {submitError && (
            <div className="mb-6 rounded-lg bg-red-50 text-red-700 border border-red-200 px-4 py-3 text-sm font-label">
              ⚠ {submitError}
            </div>
          )}

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
                Tên Rule
              </label>
              <input
                className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="VD: Tích điểm mua hàng..."
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                Event Type
              </label>
              {initial ? (
                <input
                  value={`${initial.eventType} (không thể đổi)`}
                  readOnly
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium opacity-80"
                />
              ) : (
                <select
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                  value={form.eventType}
                  onChange={(e) => setForm((f) => ({ ...f, eventType: e.target.value as EventType }))}
                >
                  {EVENT_TYPES.map((eventType) => (
                    <option key={eventType} value={eventType}>
                      {EVENT_TYPE_ICONS[eventType]} {eventType}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                Point Multiplier
              </label>
              <input
                className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                type="number"
                min={0}
                step={0.1}
                value={form.pointMultiplier}
                onChange={(e) => setForm((f) => ({ ...f, pointMultiplier: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                Fixed Points
              </label>
              <input
                className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                type="number"
                min={0}
                value={form.fixedPoints}
                onChange={(e) => setForm((f) => ({ ...f, fixedPoints: Number(e.target.value) }))}
              />
            </div>

            {needsDate ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                    Ngày bắt đầu
                  </label>
                  <input
                    className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                    type="datetime-local"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                    Ngày kết thúc
                  </label>
                  <input
                    className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                    type="datetime-local"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  />
                </div>
              </>
            ) : null}

            <div className="md:col-span-2 flex items-center justify-between bg-surface-container-low p-4 rounded-xl">
              <div>
                <div className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                  Trạng thái
                </div>
                <div className="text-sm text-on-surface-variant font-label mt-1">Kích hoạt Rule ngay</div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
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
