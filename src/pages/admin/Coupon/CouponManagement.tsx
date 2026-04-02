import React, { useState, useEffect, useMemo, useRef } from 'react';
import './CouponManagement.css';
import type { PromotionOption, TierOption, CouponResponse } from "../../../types/coupon";
import { DiscountType } from "../../../types/coupon";
import couponService from '../../../services/couponService';
import franchiseService, { extractFranchiseList } from '../../../services/franchiseService';
import ActionDropdown from '../../../components/ActionDropdown';
import { showSuccessToast } from '../../../utils/toast';

interface CouponRequest {
  promotionId: number | null;
  code: string;
  discountType: DiscountType;
  discountValue: number | '';
  minOrderValue: number | '';
  maxDiscount: number | '';
  usageLimit: number | '';
  userLimit: number | '';
  startAt: string;
  expiredAt: string;
  minTierId: number | null;
  isPublic: boolean;
}

type FranchiseOption = {
  id: string;
  label: string;
};

type FieldErrorKey =
  | 'code'
  | 'discountValue'
  | 'usageLimit'
  | 'expiredAt'
  | 'promotionId'
  | 'franchiseFilter';

const emptyForm: CouponRequest = {
  promotionId: null,
  code: '',
  discountType: DiscountType.PERCENT,
  discountValue: '',
  minOrderValue: '',
  maxDiscount: '',
  usageLimit: '',
  userLimit: '',
  startAt: '',
  expiredAt: '',
  minTierId: null,
  isPublic: true,
};

const getDiscountTypeLabel = (type: DiscountType): string => {
  switch (type) {
    case DiscountType.PERCENT:
      return 'Phần trăm (%)';
    case DiscountType.FIXED_AMOUNT:
      return 'Cố định (₫)';
    // case DiscountType.POINT_DISCOUNT:
    //   return 'Giảm điểm';
    default:
      return type;
  }
};

const formatDateTime = (dateValue?: string | null) => {
  if (!dateValue) return '—';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('vi-VN');
};

const toLocalDateTimeString = (value: string) => {
  // Backend expects LocalDateTime without timezone.
  const trimmed = value.trim();
  if (!trimmed) return '';

  const withoutTimezone = trimmed
    .replace(/Z$/i, '')
    .replace(/[+-]\d{2}:\d{2}$/i, '');

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(withoutTimezone)) {
    return `${withoutTimezone}:00`;
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(withoutTimezone)) {
    return withoutTimezone;
  }

  return '';
};

const normalizeFranchiseOption = (value: any): FranchiseOption | null => {
  if (!value) return null;

  const id = String(
    value.franchiseId ??
      value.id ??
      value.branchId ??
      value.franchise_id ??
      value.branch_id ??
      '',
  ).trim();

  if (!id) return null;

  const name = String(
    value.franchiseName ??
      value.branchName ??
      value.name ??
      value.franchiseCode ??
      value.branchCode ??
      value.code ??
      '',
  ).trim();

  return {
    id,
    label: name || `Franchise #${id}`,
  };
};

const CouponManagement: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CouponRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [promotions, setPromotions] = useState<PromotionOption[]>([]);
  const [tiers, setTiers] = useState<TierOption[]>([]);
  const [franchiseOptions, setFranchiseOptions] = useState<FranchiseOption[]>([]);
  const [franchiseSearch, setFranchiseSearch] = useState('');
  const [franchiseDropdownOpen, setFranchiseDropdownOpen] = useState(false);
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldErrorKey, string>>>({});
  const franchiseDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const data = await couponService.getCoupons();
        if (!cancelled) {
          setCoupons(Array.isArray(data) ? data : []);
          setError(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          setError(msg || 'Không thể tải danh sách coupon.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const loadDropdownData = async () => {
    try {
      const [promotions, tiers, franchiseResponse] = await Promise.all([
        couponService.getPromotions(),
        couponService.getTiers(),
        franchiseService.getAdminFranchises(),
      ]);

      setPromotions(promotions);
      setTiers(tiers);

      const seen = new Set<string>();
      const franchiseListFromService = extractFranchiseList(franchiseResponse)
        .map(normalizeFranchiseOption)
        .filter((item): item is FranchiseOption => Boolean(item))
        .filter((item) => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });

      const fallbackFromPromotionAndTier = [
        ...promotions.map((p) => ({ id: String(p.franchiseId ?? '').trim(), label: `Franchise ${p.franchiseId}` })),
        ...tiers.map((t) => ({ id: String(t.franchiseId ?? '').trim(), label: `Franchise ${t.franchiseId}` })),
      ].filter((item) => item.id && !seen.has(item.id));

      const options = [...franchiseListFromService, ...fallbackFromPromotionAndTier]
        .sort((a, b) => a.label.localeCompare(b.label));

      setFranchiseOptions(options);
      return { promotions, tiers, options };
    } catch {
      // keep empty arrays
      return { promotions: [] as PromotionOption[], tiers: [] as TierOption[], options: [] as FranchiseOption[] };
    }
  };

  const filteredPromotions = selectedFranchiseId
    ? promotions.filter((p) => String(p.franchiseId).trim() === selectedFranchiseId)
    : promotions;

  const filteredTiers = selectedFranchiseId
    ? tiers.filter((t) => String(t.franchiseId).trim() === selectedFranchiseId)
    : tiers;

  const visibleFranchiseOptions = useMemo(() => {
    const keyword = franchiseSearch.trim().toLowerCase();
    const matched = keyword
      ? franchiseOptions.filter((item) => item.label.toLowerCase().includes(keyword))
      : franchiseOptions;
    return matched.slice(0, 5);
  }, [franchiseOptions, franchiseSearch]);

  const selectedFranchiseOption = useMemo(
    () => franchiseOptions.find((item) => item.id === selectedFranchiseId) ?? null,
    [franchiseOptions, selectedFranchiseId],
  );

  const franchiseSuggestions = useMemo(() => {
    const list = [...visibleFranchiseOptions];
    if (selectedFranchiseOption && !list.some((item) => item.id === selectedFranchiseOption.id)) {
      list.unshift(selectedFranchiseOption);
    }
    return list.slice(0, 5);
  }, [visibleFranchiseOptions, selectedFranchiseOption]);

  const hasCurrentPromotionInOptions =
    form.promotionId != null && filteredPromotions.some((p) => String(p.id) === String(form.promotionId));

  const handleOpenModal = async () => {
    setEditingId(null);
    setForm(emptyForm);
    setFranchiseSearch('');
    setSelectedFranchiseId('');
    setFranchiseDropdownOpen(false);
    setFormError(null);
    setFieldErrors({});
    setShowModal(true);
    await loadDropdownData();
  };

  const handleOpenEditModal = async (coupon: CouponResponse) => {
    const { promotions: loadedPromotions, tiers: loadedTiers, options } = await loadDropdownData();

    const promotionMatch = loadedPromotions.find((p) => Number(p.id) === Number(coupon.promotionId));
    const tierMatch = loadedTiers.find((t) => Number(t.id) === Number(coupon.minTier?.id));
    const inferredFranchiseId = String(promotionMatch?.franchiseId ?? tierMatch?.franchiseId ?? '').trim();

    const matchedFranchise = options.find((item) => item.id === inferredFranchiseId);
    setFranchiseSearch(matchedFranchise?.label ?? '');
    setSelectedFranchiseId(inferredFranchiseId);
    setFranchiseDropdownOpen(false);
    setEditingId(coupon.id);
    setForm({
      promotionId: coupon.promotionId,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue,
      maxDiscount: coupon.maxDiscount ?? '',
      usageLimit: coupon.usageLimit,
      userLimit: coupon.userLimit,
      startAt: coupon.startAt ? coupon.startAt.slice(0, 16) : '',
      expiredAt: coupon.expiredAt ? coupon.expiredAt.slice(0, 16) : '',
      minTierId: coupon.minTier?.id ?? null,
      isPublic: coupon.isPublic,
    });
    setFormError(null);
    setFieldErrors({});
    setShowModal(true);
  };

  useEffect(() => {
    if (!showModal) return;

    if (
      form.promotionId != null &&
      !filteredPromotions.some((p) => Number(p.id) === Number(form.promotionId))
    ) {
      setForm((prev) => ({ ...prev, promotionId: null }));
    }

    if (
      form.minTierId != null &&
      !filteredTiers.some((t) => Number(t.id) === Number(form.minTierId))
    ) {
      setForm((prev) => ({ ...prev, minTierId: null }));
    }
  }, [showModal, form.promotionId, form.minTierId, filteredPromotions, filteredTiers]);

  const handleCloseModal = () => {
    setFranchiseDropdownOpen(false);
    setShowModal(false);
  };

  const validateDateRange = (startAtValue: string, expiredAtValue: string) => {
    const startAt = startAtValue ? toLocalDateTimeString(startAtValue) : '';
    const expiredAt = expiredAtValue ? toLocalDateTimeString(expiredAtValue) : '';

    if (!startAt || !expiredAt) return true;

    return new Date(startAt).getTime() < new Date(expiredAt).getTime();
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (formError) {
      setFormError(null);
    }

    if (name in fieldErrors) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name as FieldErrorKey];
        return next;
      });
    }

    if (name === 'code' && value.length > 255) {
      setFormError('Mã coupon chỉ được tối đa 255 ký tự.');
      return;
    }

    if (type === 'checkbox') {
      setForm(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (['discountValue', 'minOrderValue', 'maxDiscount', 'usageLimit', 'userLimit', 'promotionId', 'minTierId'].includes(name)) {
      setForm(prev => ({ ...prev, [name]: value === '' ? (name === 'promotionId' || name === 'minTierId' ? null : '') : Number(value) }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }

    if ((name === 'startAt' || name === 'expiredAt') && form.startAt && form.expiredAt) {
      const nextStartAt = name === 'startAt' ? value : form.startAt;
      const nextExpiredAt = name === 'expiredAt' ? value : form.expiredAt;
      const isValidDateRange = validateDateRange(nextStartAt, nextExpiredAt);

      if (!isValidDateRange) {
        setFieldErrors((prev) => ({ ...prev, expiredAt: 'Ngày kết thúc không được sớm hơn ngày bắt đầu.' }));
        return;
      }

      if (fieldErrors.expiredAt) {
        setFieldErrors((prev) => {
          const next = { ...prev };
          delete next.expiredAt;
          return next;
        });
      }
    }
  };

  const handleFranchiseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFranchiseSearch(value);
    setFranchiseDropdownOpen(true);

    const matched = franchiseOptions.find(
      (item) => item.label.toLowerCase() === value.trim().toLowerCase(),
    );

    setSelectedFranchiseId(matched ? matched.id : '');
    if (formError) {
      setFormError(null);
    }
    if (fieldErrors.franchiseFilter) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.franchiseFilter;
        return next;
      });
    }
  };

  const handleSelectFranchise = (option: FranchiseOption) => {
    setFranchiseSearch(option.label);
    setSelectedFranchiseId(option.id);
    setFranchiseDropdownOpen(false);
    if (fieldErrors.franchiseFilter) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.franchiseFilter;
        return next;
      });
    }
  };

  useEffect(() => {
    if (!franchiseDropdownOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!franchiseDropdownRef.current) return;
      if (!franchiseDropdownRef.current.contains(event.target as Node)) {
        setFranchiseDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [franchiseDropdownOpen]);

  const validateCouponForm = () => {
    const code = form.code.trim().toUpperCase();
    const requiredMessage = 'Vui lòng nhập giá trị.';
    const nextFieldErrors: Partial<Record<FieldErrorKey, string>> = {};

    if (!selectedFranchiseId) {
      nextFieldErrors.franchiseFilter = 'Vui lòng chọn franchise.';
    }

    if (!code) {
      nextFieldErrors.code = requiredMessage;
    }

    if (code.length > 255) {
      setFormError('Mã coupon chỉ được tối đa 255 ký tự.');
      return false;
    }

    if (!form.promotionId || Number(form.promotionId) <= 0) {
      nextFieldErrors.promotionId = 'Vui lòng chọn promotion.';
    }

    if (form.discountValue === '' || Number(form.discountValue) <= 0) {
      nextFieldErrors.discountValue = requiredMessage;
    }

    if (form.usageLimit === '' || Number(form.usageLimit) <= 0) {
      nextFieldErrors.usageLimit = requiredMessage;
    }

    if (!form.expiredAt.trim()) {
      nextFieldErrors.expiredAt = requiredMessage;
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setFormError(null);
      return false;
    }

    setFieldErrors({});

    if (!selectedFranchiseId) {
      setFormError('Vui lòng chọn franchise.');
      return false;
    }

    if (!code) {
      setFormError('Vui lòng nhập mã coupon.');
      return false;
    }

    if (!form.promotionId || Number(form.promotionId) <= 0) {
      setFormError('Vui lòng chọn Promotion hợp lệ.');
      return false;
    }

    const discountValue = Number(form.discountValue);
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      setFormError('Giá trị giảm phải là số lớn hơn 0.');
      return false;
    }

    if (form.discountType === DiscountType.PERCENT && discountValue > 100) {
      setFormError('Giá trị giảm theo phần trăm phải từ 1 đến 100.');
      return false;
    }

    const minOrderValue = form.minOrderValue === '' ? 0 : Number(form.minOrderValue);
    if (!Number.isFinite(minOrderValue) || minOrderValue < 0) {
      setFormError('Đơn tối thiểu phải là số không âm.');
      return false;
    }

    const maxDiscount = form.maxDiscount === '' ? null : Number(form.maxDiscount);
    if (maxDiscount != null && (!Number.isFinite(maxDiscount) || maxDiscount < 0)) {
      setFormError('Giảm tối đa phải là số không âm.');
      return false;
    }

    const usageLimit = Number(form.usageLimit);
    if (!Number.isInteger(usageLimit) || usageLimit <= 0) {
      setFormError('Giới hạn sử dụng phải là số nguyên dương.');
      return false;
    }

    const userLimit = form.userLimit === '' ? 0 : Number(form.userLimit);
    if (!Number.isInteger(userLimit) || userLimit < 0) {
      setFormError('Giới hạn / người phải là số nguyên không âm.');
      return false;
    }

    const startAt = form.startAt ? toLocalDateTimeString(form.startAt) : null;
    const expiredAt = toLocalDateTimeString(form.expiredAt);

    if (!expiredAt) {
      setFormError('Ngày hết hạn không đúng định dạng.');
      return false;
    }

    if (!validateDateRange(form.startAt, form.expiredAt)) {
      setFieldErrors((prev) => ({ ...prev, expiredAt: 'Ngày kết thúc không được sớm hơn ngày bắt đầu.' }));
      setFormError('Ngày kết thúc không được sớm hơn ngày bắt đầu.');
      return false;
    }

    if (
      form.promotionId != null &&
      !filteredPromotions.some((p) => Number(p.id) === Number(form.promotionId))
    ) {
      setFormError('Promotion không thuộc franchise đã chọn.');
      return false;
    }

    if (
      form.minTierId != null &&
      !filteredTiers.some((t) => Number(t.id) === Number(form.minTierId))
    ) {
      setFormError('Hạng tối thiểu không thuộc franchise đã chọn.');
      return false;
    }

    setFormError(null);
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (formError) {
      alert('Vui lòng sửa lỗi trước khi lưu!');
      return;
    }

    if (!validateCouponForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const discountValue = Number(form.discountValue);
      const minOrderValue = form.minOrderValue === '' ? 0 : Number(form.minOrderValue);
      const maxDiscount = form.maxDiscount === '' ? null : Number(form.maxDiscount);
      const usageLimit = Number(form.usageLimit);
      const userLimit = form.userLimit === '' ? 0 : Number(form.userLimit);
      const startAt = form.startAt ? toLocalDateTimeString(form.startAt) : null;
      const expiredAt = toLocalDateTimeString(form.expiredAt);
      if (!expiredAt) {
        setFormError('Ngày hết hạn không đúng định dạng.');
        return;
      }

      if (editingId !== null) {
        const updatePayload = {
          code: form.code.trim().toUpperCase(),
          promotionId: form.promotionId,
          discountType: form.discountType,
          discountValue,
          minOrderValue,
          maxDiscount,
          usageLimit,
          userLimit,
          startAt,
          start_at: startAt,
          startDate: startAt,
          expiredAt,
          expiryAt: expiredAt,
          expiresAt: expiredAt,
          minTierId: form.minTierId,
          isPublic: form.isPublic,
        };
        const updated = await couponService.updateCoupon(editingId, updatePayload);
        const safeUpdated = {
          ...updated,
          startAt: updated?.startAt ?? startAt,
          expiredAt: updated?.expiredAt ?? expiredAt,
        };
        setShowModal(false);
        setCoupons(prev => prev.map(c => c.id === editingId ? safeUpdated : c));
        showSuccessToast('Cập nhật coupon thành công.');
      } else {
        const createPayload = {
          ...form,
          discountType: form.discountType,
          discountValue,
          minOrderValue,
          maxDiscount,
          usageLimit,
          userLimit,
          usedCount: 0,
          startAt,
          start_at: startAt,
          startDate: startAt,
          expiredAt,
          expiryAt: expiredAt,
          expiresAt: expiredAt,
        };
        const created = await couponService.createCoupon(createPayload);
        const safeCreated = created
          ? {
              ...created,
              startAt: created.startAt ?? startAt,
              expiredAt: created.expiredAt ?? expiredAt,
            }
          : created;
        setShowModal(false);
        setCoupons(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          return safeCreated ? [...safePrev, safeCreated] : safePrev;
        });
        showSuccessToast('Tạo coupon thành công.');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || (editingId !== null ? 'Cập nhật thất bại. Vui lòng thử lại.' : 'Tạo coupon thất bại. Vui lòng thử lại.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa coupon này?')) return;
    setCoupons(prev => prev.filter(c => c.id !== id));
    try {
      await couponService.deleteCoupon(id);
      showSuccessToast('Xóa coupon thành công.');
    } catch {
      // Already removed from UI
    }
  };

  return (
    <div className="coupon-management">
      <div className="page-header">
        <div className="header-content">
          <h1>Quản Lý Coupon</h1>
          <p>Tạo và quản lý mã giảm giá cho khách hàng</p>
        </div>
        <button className="btn-create" onClick={handleOpenModal}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Tạo Coupon Mới
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-icon">🎫</div>
          <div className="stat-content">
            <div className="stat-value">{coupons.length}</div>
            <div className="stat-label">Tổng Coupon</div>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{coupons.filter(c => c.isPublic).length}</div>
            <div className="stat-label">Công Khai</div>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{coupons.reduce((sum, c) => sum + (c.usedCount ?? 0), 0)}</div>
            <div className="stat-label">Lượt Sử Dụng</div>
          </div>
        </div>
      </div>

      {error && <div className="error-msg" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="coupons-table-container">
        <table className="coupons-table">
          <thead>
            <tr>
              <th>Mã Coupon</th>
              <th>Giá Trị</th>
              <th>Đơn Tối Thiểu</th>
              <th>Giảm Tối Đa</th>
              <th>Sử Dụng</th>
              <th>Ngày Bắt Đầu</th>
              <th>Ngày Hết Hạn</th>
              <th>Công Khai</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="loading-row">
                <td colSpan={9}>Đang tải...</td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr className="loading-row">
                <td colSpan={9}>Chưa có coupon nào.</td>
              </tr>
            ) : (
              coupons.map(coupon => (
                <tr key={coupon.id}>
                  <td>
                    <div className="coupon-code-cell">
                      <span className="code-badge" title={coupon.code}>{coupon.code}</span>
                    </div>
                    {coupon.minTier && (
                      <div className="coupon-description">Hạng: {coupon.minTier.name}</div>
                    )}
                  </td>
                  <td>
                    <div className="discount-value">
                      {coupon.discountType === DiscountType.PERCENT
                        ? `${coupon.discountValue}%`
                        : coupon.discountType === DiscountType.POINT_DISCOUNT
                        ? `${coupon.discountValue} điểm`
                        : `${coupon.discountValue?.toLocaleString('vi-VN')}₫`}
                    </div>
                  </td>
                  <td>
                    <div>{coupon.minOrderValue?.toLocaleString('vi-VN')}₫</div>
                  </td>
                  <td>
                    <div>{coupon.maxDiscount != null ? `${coupon.maxDiscount?.toLocaleString('vi-VN')}₫` : '—'}</div>
                  </td>
                  <td>
                    <div className="usage-cell">
                      <span className="usage-text">{coupon.usedCount ?? 0}/{coupon.usageLimit}</span>
                      <div className="usage-bar">
                        <div
                          className="usage-progress"
                          style={{ width: `${Math.min(((coupon.usedCount ?? 0) / coupon.usageLimit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>{formatDateTime(coupon.startAt)}</div>
                  </td>
                  <td>
                    <div>{formatDateTime(coupon.expiredAt)}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${coupon.isPublic ? 'status-active' : 'status-inactive'}`}>
                      {coupon.isPublic ? 'Công khai' : 'Riêng tư'}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <ActionDropdown
                        actions={[
                          {
                            label: 'Chỉnh sửa',
                            onClick: () => {
                              void handleOpenEditModal(coupon);
                            },
                          },
                          {
                            label: 'Xóa',
                            onClick: () => {
                              void handleDelete(coupon.id);
                            },
                            type: 'danger',
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 md:p-6 bg-black/45 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCloseModal();
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface-container-lowest w-full max-w-3xl lg:max-w-4xl max-h-[88vh] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="px-8 py-6 border-b border-outline-variant/15 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight">
                  {editingId !== null ? 'Chỉnh Sửa Coupon' : 'Tạo Coupon Mới'}
                </h2>
                <p className="text-sm text-on-surface-variant font-label mt-1">
                  Cấu hình mã giảm giá cho chương trình khuyến mãi
                </p>
                {editingId !== null && (
                  <p className="text-xs text-on-surface-variant font-label mt-2">ID: {editingId}</p>
                )}
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="p-2 hover:bg-surface-container rounded-full transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-8">
              {formError && (
                <div className="mb-6 rounded-lg bg-red-50 text-red-700 border border-red-200 px-4 py-3 text-sm font-label">
                  ⚠ {formError}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  void handleSubmit(e);
                }}
                className="space-y-8"
              >
                <section className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                        Mã Coupon *
                      </label>
                      <input
                        name="code"
                        value={form.code}
                        onChange={handleFormChange}
                        placeholder="VD: SUMMER2025"
                        maxLength={255}
                        readOnly={editingId !== null}
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                        style={{ textTransform: 'uppercase', opacity: editingId !== null ? 0.85 : 1 }}
                      />
                      {fieldErrors.code && <p className="text-xs text-red-600 font-label">{fieldErrors.code}</p>}
                      {editingId !== null && (
                        <p className="text-xs text-on-surface-variant font-label">
                          Không thể sửa code khi đang chỉnh sửa coupon.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                        Loại giảm giá *
                      </label>
                      <select
                        name="discountType"
                        value={form.discountType}
                        onChange={handleFormChange}
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                      >
                        <option value={DiscountType.PERCENT}>Phần trăm (%)</option>
                        <option value={DiscountType.FIXED_AMOUNT}>Cố định (₫)</option>
                        {/* <option value={DiscountType.POINT_DISCOUNT}>Giảm điểm</option> */}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                        Giá trị giảm * ({form.discountType === DiscountType.PERCENT ? '%' : form.discountType === DiscountType.POINT_DISCOUNT ? 'điểm' : '₫'})
                      </label>
                      <input
                        type="number"
                        name="discountValue"
                        value={form.discountValue}
                        onChange={handleFormChange}
                        placeholder={
                          form.discountType === DiscountType.PERCENT
                            ? 'VD: 20'
                            : form.discountType === DiscountType.POINT_DISCOUNT
                              ? 'VD: 100'
                              : 'VD: 50000'
                        }
                        min={0}
                        max={form.discountType === DiscountType.PERCENT ? 100 : undefined}
                        step={form.discountType === DiscountType.PERCENT ? '0.01' : '1'}
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      {fieldErrors.discountValue && <p className="text-xs text-red-600 font-label">{fieldErrors.discountValue}</p>}
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                        Đơn tối thiểu (₫)
                      </label>
                      <input
                        type="number"
                        name="minOrderValue"
                        value={form.minOrderValue}
                        onChange={handleFormChange}
                        placeholder="VD: 200000"
                        min={0}
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                        Giảm tối đa (₫)
                      </label>
                      <input
                        type="number"
                        name="maxDiscount"
                        value={form.maxDiscount}
                        onChange={handleFormChange}
                        placeholder="VD: 100000"
                        min={0}
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                        Giới hạn sử dụng *
                      </label>
                      <input
                        type="number"
                        name="usageLimit"
                        value={form.usageLimit}
                        onChange={handleFormChange}
                        placeholder="VD: 500"
                        min={1}
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      {fieldErrors.usageLimit && <p className="text-xs text-red-600 font-label">{fieldErrors.usageLimit}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                        Giới hạn / người
                      </label>
                      <input
                        type="number"
                        name="userLimit"
                        value={form.userLimit}
                        onChange={handleFormChange}
                        placeholder="VD: 1"
                        min={0}
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                        Ngày bắt đầu
                      </label>
                      <input
                        type="datetime-local"
                        name="startAt"
                        value={form.startAt}
                        onChange={handleFormChange}
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                        Ngày hết hạn *
                      </label>
                      <input
                        type="datetime-local"
                        name="expiredAt"
                        value={form.expiredAt}
                        onChange={handleFormChange}
                        required
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      {fieldErrors.expiredAt && <p className="text-xs text-red-600 font-label">{fieldErrors.expiredAt}</p>}
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                        Franchise
                      </label>
                      <div className="relative" ref={franchiseDropdownRef}>
                        <input
                          type="text"
                          value={franchiseSearch}
                          onChange={handleFranchiseChange}
                          onFocus={() => setFranchiseDropdownOpen(true)}
                          placeholder="Tìm franchise..."
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
                      {fieldErrors.franchiseFilter && <p className="text-xs text-red-600 font-label">{fieldErrors.franchiseFilter}</p>}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                        Promotion *
                      </label>
                      <select
                        name="promotionId"
                        value={form.promotionId ?? ''}
                        onChange={handleFormChange}
                        required
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                      >
                        <option value="">-- Chọn promotion --</option>
                        {editingId !== null && form.promotionId != null && !hasCurrentPromotionInOptions && (
                          <option value={form.promotionId}>
                            [{form.promotionId}] Promotion hiện tại
                          </option>
                        )}
                        {filteredPromotions.map((p) => (
                          <option key={p.id} value={p.id}>
                            [{p.id}] {p.name}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.promotionId && <p className="text-xs text-red-600 font-label">{fieldErrors.promotionId}</p>}
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                        Hạng tối thiểu
                      </label>
                      <select
                        name="minTierId"
                        value={form.minTierId ?? ''}
                        onChange={handleFormChange}
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                      >
                        <option value="">-- Không yêu cầu --</option>
                        {filteredTiers.map((t) => (
                          <option key={t.id} value={t.id}>
                            [{t.id}] {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2 flex items-center justify-between bg-surface-container-low p-4 rounded-xl">
                      <div>
                        <div className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                          Công khai
                        </div>
                        <div className="text-sm text-on-surface-variant font-label mt-1">
                          Khách hàng có thể tự nhập mã coupon
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          id="isPublic"
                          name="isPublic"
                          checked={form.isPublic}
                          onChange={handleFormChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                      </label>
                    </div>
                  </div>
                </section>

                {/* hidden submit */}
                <button type="submit" className="hidden" />
              </form>
            </div>

            {/* Footer */}
            <div className="px-8 py-6 bg-surface-container-low flex flex-col sm:flex-row justify-end items-center gap-4">
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-full sm:w-auto px-8 py-3.5 bg-surface-container-highest text-on-surface font-label text-sm font-bold rounded-full hover:bg-surface-container-high transition-all active:scale-95"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  void handleSubmit();
                }}
                disabled={submitting}
                className="w-full sm:w-auto px-10 py-3.5 bg-gradient-to-r from-primary to-primary-container text-on-primary-container font-label text-sm font-extrabold rounded-full shadow-[0_10px_25px_-5px_rgba(63,255,139,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(63,255,139,0.4)] transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting
                  ? (editingId !== null ? 'Đang lưu...' : 'Đang tạo...')
                  : (editingId !== null ? 'Lưu thay đổi' : 'Tạo Coupon')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponManagement;
