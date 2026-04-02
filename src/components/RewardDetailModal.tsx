import { useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { createReward, updateReward } from "../services/rewardService";
import franchiseService, { extractFranchiseList } from "../services/franchiseService";

interface RewardDetailModalProps {
  reward: any | null;
  mode: "view" | "create" | "edit";
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

type FranchiseOption = {
  id: string;
  label: string;
};

function normalizeFranchiseOption(value: any): FranchiseOption | null {
  if (!value) return null;

  const id = String(
    value.franchiseId ??
      value.id ??
      value.branchId ??
      value.franchise_id ??
      value.branch_id ??
      "",
  ).trim();

  if (!id) return null;

  const name = String(
    value.franchiseName ??
      value.branchName ??
      value.name ??
      value.franchiseCode ??
      value.branchCode ??
      value.code ??
      "",
  ).trim();

  return {
    id,
    label: name || `Franchise #${id}`,
  };
}

export default function RewardDetailModal({
  reward,
  mode,
  onClose,
  onSuccess
}: RewardDetailModalProps) {
  const isView = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";
  const BASE_IMAGE_URL = import.meta.env.VITE_API_GATEWAY + "/api/engagement-service/uploads/rewards/";
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const [formData, setFormData] = useState({
    franchiseId: "",
    name: "",
    description: "",
    requiredPoints: "",
    active: true,
    imageUrl: null as File | string | null
  });

  const [error, setError] = useState("");
  const [franchiseOptions, setFranchiseOptions] = useState<FranchiseOption[]>([]);
  const [franchiseSearch, setFranchiseSearch] = useState("");
  const [franchiseDropdownOpen, setFranchiseDropdownOpen] = useState(false);
  const [franchiseLoading, setFranchiseLoading] = useState(false);
  const [franchiseLoadError, setFranchiseLoadError] = useState<string>("");
  const franchiseDropdownRef = useRef<HTMLDivElement | null>(null);

  const franchiseLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of franchiseOptions) {
      map.set(option.id, option.label);
    }
    return map;
  }, [franchiseOptions]);

  const getFranchiseLabel = (franchiseId: string) => {
    const label = franchiseLabelMap.get(franchiseId);
    return label || `Franchise #${franchiseId}`;
  };

  const filteredFranchiseOptions = useMemo(() => {
    const keyword = franchiseSearch.trim().toLowerCase();
    const matched = keyword
      ? franchiseOptions.filter((item) => item.label.toLowerCase().includes(keyword))
      : franchiseOptions;
    return matched.slice(0, 5);
  }, [franchiseOptions, franchiseSearch]);

  const selectedFranchiseOption = useMemo(
    () => franchiseOptions.find((item) => item.id === String(formData.franchiseId || "")) ?? null,
    [franchiseOptions, formData.franchiseId],
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
    setFormData((prev) => ({ ...prev, franchiseId: matched ? matched.id : "" }));
    setFranchiseDropdownOpen(true);
    if (error) setError("");
  };

  const handleSelectFranchise = (option: FranchiseOption) => {
    setFranchiseSearch(option.label);
    setFormData((prev) => ({ ...prev, franchiseId: option.id }));
    setFranchiseDropdownOpen(false);
    if (error) setError("");
  };

  useEffect(() => {
    if (reward && (isEdit || isView)) {
      setFranchiseSearch(getFranchiseLabel(String(reward.franchiseId ?? "")));
      setFranchiseDropdownOpen(false);
      setFormData({
        franchiseId: String(reward.franchiseId ?? ""),
        name: reward.name || "",
        description: reward.description || "",
        requiredPoints: String(reward.requiredPoints ?? ""),
        active: reward.active ?? true,
        imageUrl: reward.imageUrl || null
      });
      setError("");
      return;
    }

    if (isCreate) {
      setFranchiseSearch("");
      setFranchiseDropdownOpen(false);
      setFormData({
        franchiseId: "",
        name: "",
        description: "",
        requiredPoints: "",
        active: true,
        imageUrl: null
      });
      setError("");
    }
  }, [reward, isCreate, isEdit, isView]);

  useEffect(() => {
    if (!franchiseDropdownOpen || isView) return;

    const handleOutsideClick = (event: globalThis.MouseEvent) => {
      if (!franchiseDropdownRef.current) return;
      if (!franchiseDropdownRef.current.contains(event.target as Node)) {
        setFranchiseDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [franchiseDropdownOpen, isView]);

  useEffect(() => {
    let alive = true;

    const dedupe = (options: FranchiseOption[]) => {
      const seen = new Set<string>();
      return options.filter((opt) => {
        if (!opt.id || seen.has(opt.id)) return false;
        seen.add(opt.id);
        return true;
      });
    };

    const loadFranchises = async () => {
      setFranchiseLoading(true);
      setFranchiseLoadError("");

      try {
        let rawItems: any[] = [];

        // Prefer manager endpoint when available; fallback to admin/public lists.
        try {
          const managerItems = await franchiseService.getManagerFranchises();
          if (Array.isArray(managerItems)) rawItems = managerItems;
        } catch {
          // ignore
        }

        if (!rawItems.length) {
          const adminRes = await franchiseService.getAdminFranchises();
          rawItems = extractFranchiseList(adminRes);
        }

        if (!rawItems.length) {
          try {
            const publicRes = await franchiseService.getPublicFranchises();
            rawItems = extractFranchiseList(publicRes);
          } catch {
            // ignore
          }
        }

        const options = dedupe(
          rawItems
            .map(normalizeFranchiseOption)
            .filter(Boolean) as FranchiseOption[],
        ).sort((a, b) => a.label.localeCompare(b.label));

        if (!alive) return;
        setFranchiseOptions(options);

        if (options.length === 0) {
          setFranchiseLoadError("Không tìm thấy franchise nào");
        }
      } catch (e) {
        if (!alive) return;
        console.error("Load franchises error", e);
        setFranchiseLoadError("Không tải được danh sách franchise");
      } finally {
        if (alive) setFranchiseLoading(false);
      }
    };

    void loadFranchises();
    return () => {
      alive = false;
    };
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    if (name === "name" && value.length > 255) {
      setError("Tên reward chỉ được tối đa 255 ký tự");
      return;
    }

    if (error) {
      setError("");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (error) {
        alert("Vui lòng sửa lỗi trước khi lưu!");
        return;
      }

      const franchiseId = String(formData.franchiseId || "").trim();
      const name = String(formData.name || "").trim();
      const description = String(formData.description || "").trim();
      const requiredPoints = Number.parseInt(String(formData.requiredPoints), 10);

      if (!franchiseId) {
        setError("Vui lòng chọn franchise");
        return;
      }

      if (!name) {
        setError("Tên reward không được để trống");
        return;
      }

      if (name.length > 255) {
        setError("Tên reward chỉ được tối đa 255 ký tự");
        return;
      }

      if (!description) {
        setError("Mô tả không được để trống");
        return;
      }

      if (!Number.isFinite(requiredPoints) || requiredPoints <= 0) {
        setError("Required Points phải là số nguyên dương");
        return;
      }

      if (isCreate && !formData.imageUrl) {
        setError("Vui lòng upload ảnh");
        return;
      }

      const submitData = {
        franchiseId,
        name,
        description,
        requiredPoints,
        active: formData.active,
        imageUrl: formData.imageUrl
      };

      const finalData = typeof submitData.imageUrl === "string"
        ? (() => {
            const { imageUrl, ...rest } = submitData;
            return rest;
          })()
        : submitData;

      if (isCreate) {
        await createReward(finalData);
      }

      if (isEdit && reward?.id) {
        await updateReward(reward.id, finalData);
      }

      await onSuccess();
      onClose();
    } catch (submitError: any) {
      console.error("Save reward error", submitError);

      if (submitError.response?.status === 413) {
        setError("File hoặc dữ liệu quá lớn. Vui lòng kiểm tra lại ảnh hoặc thông tin!");
      } else {
        setError("Có lỗi xảy ra: " + (submitError.response?.data?.message || submitError.message));
      }
    }
  };

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputId = "reward-image-input";

  useEffect(() => {
    if (!formData.imageUrl) {
      setPreviewUrl(null);
      return;
    }

    if (typeof formData.imageUrl === "string") {
      const url = formData.imageUrl.startsWith("http")
        ? formData.imageUrl
        : BASE_IMAGE_URL + formData.imageUrl;
      setPreviewUrl(url);
      return;
    }

    const objectUrl = URL.createObjectURL(formData.imageUrl);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [formData.imageUrl]);

  // If in view/edit mode but reward is missing, don't render to avoid broken UI
  if (!isCreate && !reward) {
    return null;
  }

  const title = isView ? "Reward Details" : isCreate ? "Create Reward" : "Edit Reward";
  const subtitle = "Configure your loyalty program offering";

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const onPickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError(
        `File quá lớn. Giới hạn: 5MB, File của bạn: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
      );
      return;
    }

    setError("");
    setFormData((prev) => ({ ...prev, imageUrl: file }));
  };

  const showSave = !isView;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-3 md:p-6 bg-black/45 backdrop-blur-sm"
      onMouseDown={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-surface-container-lowest w-full max-w-3xl lg:max-w-4xl max-h-[88vh] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-outline-variant/15 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-on-surface-variant font-label mt-1">{subtitle}</p>
            {!isCreate && reward?.id != null && (
              <p className="text-xs text-on-surface-variant font-label mt-2">ID: {reward.id}</p>
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
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 text-red-700 border border-red-200 px-4 py-3 text-sm font-label">
              ⚠ {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!isView) void handleSubmit();
            }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10"
          >
            {/* Left */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Image */}
              <div className="group relative rounded-xl overflow-hidden bg-surface-container aspect-square shadow-inner">
                {previewUrl ? (
                  <img
                    alt={formData.name || "Reward image"}
                    src={previewUrl}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                    <span className="text-sm font-label">No image</span>
                  </div>
                )}

                {!isView && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <label
                      htmlFor={fileInputId}
                      className="px-5 py-2.5 bg-white text-on-surface font-label text-sm font-semibold rounded-full shadow-lg flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 transition-transform cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">upload</span>
                      Replace Image
                    </label>
                  </div>
                )}
              </div>

              <input
                id={fileInputId}
                type="file"
                name="imageUrl"
                onChange={onPickFile}
                disabled={isView}
                className="hidden"
                accept="image/*"
              />

              {/* Status */}
              <div className="bg-surface-container-low p-6 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-label font-semibold text-sm">Reward Status</span>

                  <label className={`relative inline-flex items-center cursor-pointer ${isView ? "opacity-60 cursor-not-allowed" : ""}`}>
                    <input
                      type="checkbox"
                      name="active"
                      checked={!!formData.active}
                      onChange={handleChange}
                      disabled={isView}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                    <span className="ml-3 text-xs font-label font-bold text-primary uppercase tracking-widest">
                      {formData.active ? "Active" : "Inactive"}
                    </span>
                  </label>
                </div>

                {/* Quick stats (optional - placeholders to match UI) */}
                {/* <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-surface-container-lowest p-3 rounded-lg text-center">
                    <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter mb-1">
                      Total Redeemed
                    </div>
                    <div className="text-lg font-headline font-bold text-on-surface">-</div>
                  </div>
                  <div className="bg-surface-container-lowest p-3 rounded-lg text-center">
                    <div className="text-[10px] text-on-surface-variant uppercase font-bold tracking-tighter mb-1">
                      Success Rate
                    </div>
                    <div className="text-lg font-headline font-bold text-primary">-</div>
                  </div>
                </div> */}
              </div>
            </div>

            {/* Right */}
            <div className="lg:col-span-7 space-y-8">
              <section className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                      Franchise
                    </label>
                    {!isView && (
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

                        {franchiseDropdownOpen && !franchiseLoading && (
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
                    {isView ? (
                      <input
                        value={getFranchiseLabel(formData.franchiseId)}
                        readOnly
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium opacity-80"
                      />
                    ) : null}
                    {franchiseLoadError && (
                      <p className="text-xs text-red-600 font-label">{franchiseLoadError}</p>
                    )}
                    {isView && formData.franchiseId && (
                      <p className="text-xs text-on-surface-variant font-label">
                        {getFranchiseLabel(formData.franchiseId)}
                      </p>
                    )}
                  </div>

                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                      Reward Name
                    </label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isView}
                      placeholder="Enter reward name"
                      maxLength={255}
                      className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                      required
                    />
                    <p className="text-xs text-on-surface-variant font-label">Tối đa 255 ký tự ({String(formData.name || "").length}/255)</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                      Required Points
                    </label>
                    <div className="relative">
                      <input
                        name="requiredPoints"
                        type="number"
                        value={formData.requiredPoints}
                        onChange={handleChange}
                        disabled={isView}
                        min={1}
                        step={1}
                        className="w-full bg-surface-container-low border-none rounded-lg pl-4 pr-12 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-on-surface-variant uppercase">
                        Pts
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                      Status
                    </label>
                    <input
                      value={formData.active ? "Active" : "Inactive"}
                      readOnly
                      className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium opacity-80"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    disabled={isView}
                    rows={3}
                    className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    required
                  />
                </div>
              </section>
            </div>

            {/* hidden submit */}
            <button type="submit" className="hidden" />
          </form>
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

          {showSave && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!!error}
              className="w-full sm:w-auto px-10 py-3.5 bg-gradient-to-r from-primary to-primary-container text-on-primary-container font-label text-sm font-extrabold rounded-full shadow-[0_10px_25px_-5px_rgba(63,255,139,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(63,255,139,0.4)] transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCreate ? "Save Reward" : "Save Changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
