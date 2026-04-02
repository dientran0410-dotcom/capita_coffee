import React, { useState, useEffect, useRef } from 'react';
import promotionService from '../../../services/PromotionService';
import franchiseService, { extractFranchiseList } from '../../../services/franchiseService';
import type { Promotion, CreatePromotionRequest } from '../../../types/Promotion';
import { DiscountType } from '../../../types/coupon';
import { useNotification } from '../../../context/NotificationContext';
import './PromotionManagement.css';

interface PromotionFormData {
  franchiseId: string;
  name: string;
  description: string;
  discountType: string; // Use string for form handling, convert to enum when submitting
  startDate: string;
  endDate: string;
}

type PromotionFormField = keyof PromotionFormData;

type FranchiseOption = {
  id: string;
  label: string;
};

type PromotionStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED';

function normalizeFranchiseOption(value: any): FranchiseOption | null {
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
}

const normalizeKeyword = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const isSubsequenceMatch = (text: string, keyword: string) => {
  if (!keyword) return true;
  let pointer = 0;
  for (const ch of text) {
    if (ch === keyword[pointer]) pointer += 1;
    if (pointer === keyword.length) return true;
  }
  return false;
};

const getDiscountTypeLabel = (type?: DiscountType): string => {
  if (!type) return 'N/A';
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

const convertStringToDiscountType = (value: string): DiscountType => {
  switch (value) {
    case DiscountType.PERCENT:
      return DiscountType.PERCENT;
    case DiscountType.FIXED_AMOUNT:
      return DiscountType.FIXED_AMOUNT;
    case DiscountType.POINT_DISCOUNT:
      return DiscountType.POINT_DISCOUNT;
    default:
      return DiscountType.PERCENT; // default fallback
  }
};

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];

  if (payload && typeof payload === 'object') {
    const obj = payload as { data?: unknown; payload?: unknown };
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.payload)) return obj.payload as T[];
  }

  return [];
}

function unwrapObject<T>(payload: unknown): T | null {
  if (payload && typeof payload === 'object') {
    const obj = payload as { data?: unknown; payload?: unknown };
    if (obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)) {
      return obj.data as T;
    }
    if (obj.payload && typeof obj.payload === 'object' && !Array.isArray(obj.payload)) {
      return obj.payload as T;
    }
    return payload as T;
  }

  return null;
}

function getTimelineStatus(promotion: Pick<Promotion, 'startDate' | 'endDate' | 'status'>): PromotionStatus {
  const startTime = new Date(promotion.startDate).getTime();
  const endTime = new Date(promotion.endDate).getTime();
  const now = Date.now();

  if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
    if (promotion.status === 'ACTIVE' || promotion.status === 'EXPIRED' || promotion.status === 'DRAFT') {
      return promotion.status;
    }
    return 'DRAFT';
  }

  if (now < startTime) return 'DRAFT';
  if (now > endTime) return 'EXPIRED';
  return 'ACTIVE';
}

const PromotionManagement: React.FC = () => {
  const { addNotification } = useNotification();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PromotionFormData>({
    franchiseId: '',
    name: '',
    description: '',
    discountType: '',
    startDate: '',
    endDate: '',
  });
  const [touchedFields, setTouchedFields] = useState<Record<PromotionFormField, boolean>>({
    franchiseId: false,
    name: false,
    description: false,
    discountType: false,
    startDate: false,
    endDate: false,
  });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterFranchise, setFilterFranchise] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dashboard data
  const [dashboard, setDashboard] = useState<any>(null);
  const [promotionStats, setPromotionStats] = useState<any>(null);
  const [promotionCoupons, setPromotionCoupons] = useState<any[]>([]);
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);
  const [franchiseOptions, setFranchiseOptions] = useState<FranchiseOption[]>([]);
  const [franchiseLoading, setFranchiseLoading] = useState(false);
  const [franchiseSearch, setFranchiseSearch] = useState('');
  const [franchiseDropdownOpen, setFranchiseDropdownOpen] = useState(false);
  const [dateOrderNotified, setDateOrderNotified] = useState(false);
  const franchiseDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchPromotions();
    fetchDashboard();
    fetchFranchises();
  }, []);

  const franchiseLabelMap = React.useMemo(() => {
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

  const selectedFranchiseOption = React.useMemo(
    () => franchiseOptions.find((item) => item.id === formData.franchiseId) ?? null,
    [franchiseOptions, formData.franchiseId],
  );

  const filteredFranchiseOptions = React.useMemo(() => {
    const selectedLabel = selectedFranchiseOption?.label ?? '';
    const rawKeyword =
      franchiseDropdownOpen && franchiseSearch === selectedLabel ? '' : franchiseSearch;
    const keyword = normalizeKeyword(rawKeyword);

    const matched = keyword
      ? franchiseOptions.filter((item) => {
          const normalizedLabel = normalizeKeyword(item.label);
          return (
            normalizedLabel.includes(keyword) ||
            isSubsequenceMatch(normalizedLabel, keyword)
          );
        })
      : franchiseOptions;
    return matched.slice(0, 5);
  }, [franchiseOptions, franchiseSearch, franchiseDropdownOpen, selectedFranchiseOption]);

  const franchiseSuggestions = React.useMemo(() => {
    const list = [...filteredFranchiseOptions];
    if (selectedFranchiseOption && !list.some((item) => item.id === selectedFranchiseOption.id)) {
      list.unshift(selectedFranchiseOption);
    }
    return list.slice(0, 5);
  }, [filteredFranchiseOptions, selectedFranchiseOption]);

  const handleFranchiseInputChange = (value: string) => {
    setFranchiseSearch(value);
    const matched = franchiseOptions.find((item) => item.label.toLowerCase() === value.trim().toLowerCase());
    setFormData((prev) => ({ ...prev, franchiseId: matched ? matched.id : '' }));
    setFranchiseDropdownOpen(true);
  };

  const handleSelectFranchise = (option: FranchiseOption) => {
    setFranchiseSearch(option.label);
    setFormData((prev) => ({ ...prev, franchiseId: option.id }));
    setFranchiseDropdownOpen(false);
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

  const syncPromotionStatuses = async (items: Promotion[]) => {
    const transitions = items
      .map((promotion) => ({
        id: promotion.id,
        nextStatus: getTimelineStatus(promotion),
        currentStatus: promotion.status,
      }))
      .filter((entry) => entry.nextStatus !== entry.currentStatus);

    if (transitions.length === 0) return;

    setPromotions((prev) =>
      prev.map((promotion) => {
        const matched = transitions.find((entry) => entry.id === promotion.id);
        return matched ? { ...promotion, status: matched.nextStatus } : promotion;
      }),
    );

    const results = await Promise.allSettled(
      transitions.map((entry) => promotionService.updatePromotionStatus(entry.id, entry.nextStatus)),
    );

    const hasSuccess = results.some((result) => result.status === 'fulfilled');
    const hasFailure = results.some((result) => result.status === 'rejected');

    if (hasFailure) {
      console.error('Failed to auto-sync some promotion statuses based on timeline');
    }

    if (hasSuccess) {
      fetchDashboard();
    }
  };

  const fetchFranchises = async () => {
    try {
      setFranchiseLoading(true);
      let rawItems: any[] = [];

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

      const options = rawItems
        .map(normalizeFranchiseOption)
        .filter(Boolean) as FranchiseOption[];

      const seen = new Set<string>();
      const deduped = options.filter((opt) => {
        if (!opt.id || seen.has(opt.id)) return false;
        seen.add(opt.id);
        return true;
      });

      setFranchiseOptions(deduped.sort((a, b) => a.label.localeCompare(b.label)));
    } catch (err) {
      console.error('Error fetching franchises:', err);
      setFranchiseOptions([]);
    } finally {
      setFranchiseLoading(false);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.actions-menu-wrap')) {
        setOpenActionMenuId(null);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await promotionService.getPromotionDashboard();
      setDashboard(unwrapObject(response));
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    }
  };

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await promotionService.getAllPromotions();
      
      console.log('API Response:', response);
      const data = unwrapList<Promotion>(response);
      
      console.log('Promotions data:', data);
      setPromotions(data.map((promotion) => ({ ...promotion, status: getTimelineStatus(promotion) })));
      await syncPromotionStatuses(data);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Không thể tải danh sách promotion';
      setError(errorMsg);
      console.error('Error fetching promotions:', err);
      console.error('Error response:', err.response);
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!promotions.length) return;

    const timer = window.setInterval(() => {
      void syncPromotionStatuses(promotions);
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [promotions]);

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      franchiseId: '',
      name: '',
      description: '',
      discountType: '',
      startDate: '',
      endDate: '',
    });
    setTouchedFields({
      franchiseId: false,
      name: false,
      description: false,
      discountType: false,
      startDate: false,
      endDate: false,
    });
    setDateOrderNotified(false);
    setFranchiseSearch('');
    setSubmitAttempted(false);
    setShowModal(true);
  };

  const markFieldTouched = (field: PromotionFormField) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const shouldShowRequiredMessage = (field: PromotionFormField) => {
    const value = String(formData[field] ?? '').trim();
    return (submitAttempted || touchedFields[field]) && !value;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSubmitAttempted(true);
    
    // Validation chi tiết
    const errors: string[] = [];
    
    // 1. Validate Franchise ID
    if (!formData.franchiseId || formData.franchiseId.trim().length === 0) {
      errors.push('Franchise ID không được để trống');
    }
    
    // 2. Validate Name
    if (!formData.name || formData.name.trim().length === 0) {
      errors.push('Tên promotion không được để trống');
    } else if (formData.name.trim().length < 3) {
      errors.push('Tên promotion phải có ít nhất 3 ký tự');
    } else if (formData.name.trim().length > 255) {
      errors.push('Tên promotion chỉ được tối đa 255 ký tự');
    }
    
    // 3. Validate Description
    if (!formData.description || formData.description.trim().length === 0) {
      errors.push('Mô tả không được để trống');
    } else if (formData.description.trim().length < 10) {
      errors.push('Mô tả phải có ít nhất 10 ký tự');
    }
    
    // 4. Validate Discount Type
    const validDiscountTypes = Object.values(DiscountType);
    if (!formData.discountType) {
      errors.push('Vui lòng chọn loại giảm giá');
    } else if (!validDiscountTypes.includes(formData.discountType as DiscountType)) {
      errors.push('Loại giảm giá không hợp lệ');
    }
    
    // 5. Validate Dates
    if (!formData.startDate) {
      errors.push('Ngày bắt đầu không được để trống');
    }
    
    if (!formData.endDate) {
      errors.push('Ngày kết thúc không được để trống');
    }
    
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      // Check if dates are valid
      if (isNaN(start.getTime())) {
        errors.push('Ngày bắt đầu không hợp lệ');
      }
      
      if (isNaN(end.getTime())) {
        errors.push('Ngày kết thúc không hợp lệ');
      }
      
      // Check if start date is before end date
      if (start >= end) {
        errors.push('Ngày bắt đầu phải trước ngày kết thúc');
        if (!dateOrderNotified) {
          addNotification({
            type: 'ERROR',
            title: 'Lỗi ngày tháng',
            message: 'Ngày kết thúc không được sớm hơn ngày bắt đầu',
            source: 'PromotionManagement',
          });
          setDateOrderNotified(true);
        }
      } else if (dateOrderNotified) {
        setDateOrderNotified(false);
      }
      
      // Check if dates are not too far in the past
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      if (start < oneYearAgo) {
        errors.push('Ngày bắt đầu không được quá 1 năm trước');
      }
      
      // Check if promotion duration is reasonable (not more than 2 years)
      const twoYearsInMs = 2 * 365 * 24 * 60 * 60 * 1000;
      if (end.getTime() - start.getTime() > twoYearsInMs) {
        errors.push('Thời gian promotion không được vượt quá 2 năm');
      }
    }
    
    // Show all errors if any
    if (errors.length > 0) {
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Format dates to ISO string
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      const payload: CreatePromotionRequest = {
        franchiseId: formData.franchiseId,
        name: formData.name.trim(),
        description: formData.description.trim(),
        discountType: convertStringToDiscountType(formData.discountType.trim()),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
      
      console.log('Sending payload:', JSON.stringify(payload, null, 2));
      
      let response;
      if (editingId !== null) {
        // Update existing promotion
        response = await promotionService.updatePromotion(editingId, payload);
        addNotification({
          type: 'SUCCESS',
          title: 'Cập Nhật Thành Công',
          message: 'Promotion đã được cập nhật',
          source: 'PromotionManagement',
        });
      } else {
        // Create new promotion
        response = await promotionService.createPromotion(payload);
        addNotification({
          type: 'SUCCESS',
          title: 'Tạo Thành Công',
          message: 'Promotion mới đã được tạo',
          source: 'PromotionManagement',
        });
      }
      
      console.log('Response:', response);
      
      // Success
      setShowModal(false);
      setEditingId(null);
      
      // Reset form
      setFormData({
        franchiseId: '',
        name: '',
        description: '',
        discountType: '',
        startDate: '',
        endDate: '',
      });
      
      // Refresh list
      fetchPromotions();
    } catch (err: any) {
      console.error('Error creating promotion:', err);
      console.error('Error response:', err.response?.data);
      
      // Parse backend error message
      let errorMessage = 'Không thể tạo promotion';
      
      if (err.response?.data) {
        const data = err.response.data;
        
        // Handle different error response formats
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.join(', ');
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      addNotification({
        type: 'ERROR',
        title: 'Lỗi',
        message: errorMessage,
        source: 'PromotionManagement',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    markFieldTouched(name as PromotionFormField);
    
    // Validation cho tên promotion
    if (name === 'name' && value.length > 255) {
      addNotification({
        type: 'ERROR',
        title: 'Lỗi Validation',
        message: 'Tên promotion chỉ được tối đa 255 ký tự',
        source: 'PromotionManagement',
      });
      return; // Không cho phép nhập thêm
    }
    
    const newFormData = {
      ...formData,
      [name]: value
    };
    
    setFormData(newFormData);
    
    // Real-time validation for dates
    if (name === 'startDate' || name === 'endDate') {
      const startDate = name === 'startDate' ? value : newFormData.startDate;
      const endDate = name === 'endDate' ? value : newFormData.endDate;
      
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start >= end) {
          if (!dateOrderNotified) {
            addNotification({
              type: 'ERROR',
              title: 'Lỗi ngày tháng',
              message: 'Ngày kết thúc không được sớm hơn ngày bắt đầu',
              source: 'PromotionManagement',
            });
            setDateOrderNotified(true);
          }
          return;
        }

        if (dateOrderNotified) {
          setDateOrderNotified(false);
        }
      }
    }
  };

  const handleViewDetail = async (promotion: Promotion) => {
    try {
      const response = await promotionService.getPromotionById(promotion.id);
      setSelectedPromotion(unwrapObject<Promotion>(response));
      setShowDetailModal(true);
    } catch (err: any) {
      alert('Không thể tải chi tiết promotion');
      console.error('Error fetching promotion detail:', err);
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setFormData({
      franchiseId: promotion.franchiseId,
      name: promotion.name,
      description: promotion.description,
      discountType: promotion.discountType || '',
      startDate: promotion.startDate.slice(0, 16), // Format for datetime-local
      endDate: promotion.endDate.slice(0, 16),
    });
    setTouchedFields({
      franchiseId: false,
      name: false,
      description: false,
      discountType: false,
      startDate: false,
      endDate: false,
    });
    setDateOrderNotified(false);
    setFranchiseSearch(getFranchiseLabel(promotion.franchiseId));
    setSubmitAttempted(false);
    setEditingId(promotion.id);
    setShowModal(true);
  };

  const handleDelete = async (promotion: Promotion) => {
    if (!confirm(`Bạn có chắc muốn xóa promotion "${promotion.name}"?`)) {
      return;
    }

    try {
      await promotionService.deletePromotion(promotion.id);
      alert('✅ Xóa promotion thành công!');
      fetchPromotions();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể xóa promotion';
      alert('❌ Lỗi: ' + errorMessage);
    }
  };

  const handleUpdateStatus = async (promotion: Promotion, newStatus: string) => {
    if (!confirm(`Bạn có chắc muốn chuyển status sang "${newStatus}"?`)) {
      return;
    }

    try {
      await promotionService.updatePromotionStatus(promotion.id, newStatus as any);
      alert('✅ Cập nhật status thành công!');
      fetchPromotions();
      fetchDashboard(); // Refresh dashboard
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Không thể cập nhật status';
      alert('❌ Lỗi: ' + errorMessage);
    }
  };

  const handleFilterStatus = async (status: string) => {
    setFilterStatus(status);
  };

  const handleFilterFranchise = async (franchiseId: string) => {
    setFilterFranchise(franchiseId);
  };

  const handleViewStats = async (promotion: Promotion) => {
    try {
      const response = await promotionService.getPromotionStats(promotion.id);
      setPromotionStats(unwrapObject(response));
      setSelectedPromotion(promotion);
      setShowStatsModal(true);
    } catch (err) {
      console.error('Error fetching stats:', err);
      alert('Không thể tải thống kê');
    }
  };

  const handleViewCoupons = async (promotion: Promotion) => {
    try {
      const response = await promotionService.getPromotionCoupons(promotion.id);
      setPromotionCoupons(unwrapList(response));
      setSelectedPromotion(promotion);
      setShowCouponsModal(true);
    } catch (err) {
      console.error('Error fetching coupons:', err);
      alert('Không thể tải danh sách coupons');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const filteredPromotions = promotions.filter((promotion) => {
    const effectiveStatus = getTimelineStatus(promotion);

    if (filterStatus !== 'ALL' && effectiveStatus !== filterStatus) {
      return false;
    }

    if (filterFranchise !== 'ALL' && String(promotion.franchiseId) !== String(filterFranchise)) {
      return false;
    }

    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return true;
    return (
      promotion.name?.toLowerCase().includes(keyword) ||
      promotion.description?.toLowerCase().includes(keyword) ||
      String(promotion.franchiseId).includes(keyword) ||
      getFranchiseLabel(promotion.franchiseId).toLowerCase().includes(keyword)
    );
  });

  if (loading) {
    return (
      <div className="promotion-management">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="promotion-management">
      <div className="page-header dashboard-header">
        <div className="header-content">
          <h1>Quản Lý Promotion</h1>
          <p>Tạo và quản lý chương trình khuyến mãi</p>
        </div>
        <button className="btn-create" onClick={handleCreate}>
          <span className="material-symbols-outlined">add</span>
          Tạo Promotion Mới
        </button>
      </div>

      {/* Dashboard Stats */}
      {dashboard && (
        <div className="dashboard-stats stats-overview">
          <div className="stat-card">
            <div className="stat-icon-box icon-slate">
              <span className="material-symbols-outlined">bar_chart</span>
            </div>
            <div className="stat-content">
              <div className="stat-value">{dashboard.totalPromotions || 0}</div>
              <div className="stat-label">Tổng Promotions</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-box icon-green">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <div className="stat-content">
              <div className="stat-value">{dashboard.activePromotions || 0}</div>
              <div className="stat-label">Đang Active</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-box icon-orange">
              <span className="material-symbols-outlined">edit_note</span>
            </div>
            <div className="stat-content">
              <div className="stat-value">{dashboard.draftPromotions || 0}</div>
              <div className="stat-label">Draft</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-box icon-red">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <div className="stat-content">
              <div className="stat-value">{dashboard.expiringSoon || 0}</div>
              <div className="stat-label">Sắp Hết Hạn</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar modern-toolbar">
        <div className="toolbar-left">
          <div className="search-bar">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Tìm kiếm tên chương trình, mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-controls">
            <div className="filter-select-wrap">
              <span className="material-symbols-outlined">filter_list</span>
              <label>Trạng thái:</label>
              <select value={filterStatus} onChange={(e) => handleFilterStatus(e.target.value)}>
                <option value="ALL">Tất cả</option>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            <div className="filter-select-wrap">
              <span className="material-symbols-outlined">storefront</span>
              <label>Franchise:</label>
              <select value={filterFranchise} onChange={(e) => handleFilterFranchise(e.target.value)}>
                <option value="ALL">Tất cả</option>
                {franchiseOptions.map((franchise) => (
                  <option key={franchise.id} value={franchise.id}>{franchise.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="toolbar-actions">
          <button type="button" className="toolbar-btn" onClick={fetchPromotions} title="Làm mới dữ liệu">
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {filteredPromotions.length === 0 ? (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42z"/>
          </svg>
          <p>Chưa có promotion nào</p>
        </div>
      ) : (
        <div className="promotions-table-container">
          <table className="promotions-table">
            <thead>
              <tr>
                <th>Franchise</th>
                <th>Tên Promotion</th>
                <th>Mô Tả</th>
                <th>Loại</th>
                <th>Trạng Thái</th>
                <th>Thời Hạn</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(filteredPromotions) && filteredPromotions.length > 0 && filteredPromotions.map((promotion, index) => (
                <tr key={promotion.id || index}>
                  <td>
                    <span className="franchise-id">{getFranchiseLabel(promotion.franchiseId)}</span>
                  </td>
                  <td>
                    <div className="promotion-name" title={promotion.name}>{promotion.name}</div>
                  </td>
                  <td>
                    <div className="promotion-description" title={promotion.description}>{promotion.description}</div>
                  </td>
                  <td>
                    <span className="discount-badge discount-type">{getDiscountTypeLabel(promotion.discountType)}</span>
                  </td>
                  <td>
                    {(() => {
                      const displayStatus = getTimelineStatus(promotion);
                      return (
                    <select
                      className={`status-select status-${displayStatus.toLowerCase()}`}
                      value={displayStatus}
                      onChange={(e) => handleUpdateStatus(promotion, e.target.value)}
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="EXPIRED">EXPIRED</option>
                    </select>
                      );
                    })()}
                  </td>
                  <td>
                    <div className="date-range">
                      {formatDate(promotion.startDate)}<br/>
                      đến<br/>
                      {formatDate(promotion.endDate)}
                    </div>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <div className="actions-menu-wrap">
                        <button
                          className="btn-icon more"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenActionMenuId((prev) => (prev === promotion.id ? null : promotion.id));
                          }}
                          title="Thao tác"
                          aria-label="Mở menu thao tác"
                          aria-expanded={openActionMenuId === promotion.id}
                        >
                          <span className="material-symbols-outlined">more_horiz</span>
                        </button>

                        {openActionMenuId === promotion.id && (
                          <div className="actions-dropdown" role="menu">
                            <button
                              className="action-item"
                              onClick={() => {
                                setOpenActionMenuId(null);
                                handleViewDetail(promotion);
                              }}
                            >
                              <span className="material-symbols-outlined">visibility</span>
                              Xem chi tiết
                            </button>
                            <button
                              className="action-item"
                              onClick={() => {
                                setOpenActionMenuId(null);
                                handleViewStats(promotion);
                              }}
                            >
                              <span className="material-symbols-outlined">analytics</span>
                              Thống kê
                            </button>
                            <button
                              className="action-item"
                              onClick={() => {
                                setOpenActionMenuId(null);
                                handleViewCoupons(promotion);
                              }}
                            >
                              <span className="material-symbols-outlined">inventory_2</span>
                              Xem coupons
                            </button>
                            <button
                              className="action-item"
                              onClick={() => {
                                setOpenActionMenuId(null);
                                handleEdit(promotion);
                              }}
                            >
                              <span className="material-symbols-outlined">edit</span>
                              Chỉnh sửa
                            </button>
                            <button
                              className="action-item danger"
                              onClick={() => {
                                setOpenActionMenuId(null);
                                handleDelete(promotion);
                              }}
                            >
                              <span className="material-symbols-outlined">delete</span>
                              Xóa
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 md:p-6 bg-black/45 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface-container-lowest w-full max-w-3xl lg:max-w-4xl max-h-[88vh] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="px-8 py-6 border-b border-outline-variant/15 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight">
                  {editingId !== null ? 'Chỉnh Sửa Promotion' : 'Tạo Promotion Mới'}
                </h2>
                <p className="text-sm text-on-surface-variant font-label mt-1">
                  {editingId !== null ? 'Cập nhật thông tin chương trình khuyến mãi' : 'Nhập thông tin để tạo chương trình mới'}
                </p>
                {editingId !== null && (
                  <p className="text-xs text-on-surface-variant font-label mt-2">ID: {editingId}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-surface-container rounded-full transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-8">
              <form
                onSubmit={(e) => {
                  void handleSubmit(e);
                }}
                noValidate
                className="space-y-8"
              >
                <section className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                        Franchise *
                      </label>
                      <div className="relative" ref={franchiseDropdownRef}>
                        <input
                          name="franchiseId"
                          type="text"
                          value={franchiseSearch}
                          onChange={(e) => handleFranchiseInputChange(e.target.value)}
                          onFocus={() => setFranchiseDropdownOpen(true)}
                          onBlur={() => {
                            markFieldTouched('franchiseId');
                          }}
                          placeholder="Tìm franchise..."
                          disabled={franchiseLoading}
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
                      {shouldShowRequiredMessage('franchiseId') && (
                        <p className="text-xs text-red-600 font-label">Vui lòng nhập franchise</p>
                      )}
                      <p className="text-xs text-on-surface-variant font-label">Chọn cửa hàng áp dụng cho promotion</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                        Loại giảm giá *
                      </label>
                      <select
                        name="discountType"
                        value={formData.discountType}
                        onChange={handleInputChange}
                        onBlur={() => markFieldTouched('discountType')}
                        required
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                      >
                        <option value="">-- Chọn loại giảm giá --</option>
                        <option value={DiscountType.PERCENT}>Phần trăm (%)</option>
                        <option value={DiscountType.FIXED_AMOUNT}>Cố định (₫)</option>
                        {/* <option value={DiscountType.POINT_DISCOUNT}>Giảm điểm</option> */}
                      </select>
                      {shouldShowRequiredMessage('discountType') && (
                        <p className="text-xs text-red-600 font-label">Vui lòng nhập loại giảm giá</p>
                      )}
                      <p className="text-xs text-on-surface-variant font-label">Loại khuyến mãi áp dụng</p>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                        Tên promotion *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        onBlur={() => markFieldTouched('name')}
                        required
                        minLength={3}
                        maxLength={255}
                        placeholder="VD: Summer Sale 2026"
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      {shouldShowRequiredMessage('name') && (
                        <p className="text-xs text-red-600 font-label">Vui lòng nhập tên promotion</p>
                      )}
                      <p className="text-xs text-on-surface-variant font-label">Từ 3-255 ký tự ({formData.name.length}/255)</p>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                        Mô tả *
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        onBlur={() => markFieldTouched('description')}
                        required
                        minLength={10}
                        placeholder="Nhập mô tả chi tiết về chương trình khuyến mãi"
                        rows={4}
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                      />
                      {shouldShowRequiredMessage('description') && (
                        <p className="text-xs text-red-600 font-label">Vui lòng nhập mô tả</p>
                      )}
                      <p className="text-xs text-on-surface-variant font-label">Tối thiểu 10 ký tự</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                        Ngày bắt đầu *
                      </label>
                      <input
                        type="datetime-local"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        onBlur={() => markFieldTouched('startDate')}
                        required
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      {shouldShowRequiredMessage('startDate') && (
                        <p className="text-xs text-red-600 font-label">Vui lòng nhập ngày bắt đầu</p>
                      )}
                      <p className="text-xs text-on-surface-variant font-label">Thời gian bắt đầu promotion</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-label font-bold text-on-surface-variant uppercase tracking-widest">
                        Ngày kết thúc *
                      </label>
                      <input
                        type="datetime-local"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        onBlur={() => markFieldTouched('endDate')}
                        required
                        min={formData.startDate}
                        className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                      {shouldShowRequiredMessage('endDate') && (
                        <p className="text-xs text-red-600 font-label">Vui lòng nhập ngày kết thúc</p>
                      )}
                      <p className="text-xs text-on-surface-variant font-label">Phải sau ngày bắt đầu</p>
                      {formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate) && (
                        <p className="text-xs text-red-600 font-label">❌ Ngày kết thúc phải sau ngày bắt đầu!</p>
                      )}
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
                onClick={() => setShowModal(false)}
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
                  ? (editingId !== null ? 'Đang cập nhật...' : 'Đang tạo...')
                  : (editingId !== null ? 'Cập Nhật' : 'Tạo Promotion')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedPromotion && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 md:p-6 bg-black/45 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowDetailModal(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface-container-lowest w-full max-w-3xl lg:max-w-4xl max-h-[88vh] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-outline-variant/15 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight">Chi Tiết Promotion</h2>
                <p className="text-sm text-on-surface-variant font-label mt-1">Xem thông tin chi tiết chương trình</p>
                {selectedPromotion?.id != null && (
                  <p className="text-xs text-on-surface-variant font-label mt-2">ID: {selectedPromotion.id}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-surface-container rounded-full transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8">
              <div className="detail-content modern-detail-content">
                <div className="detail-section-head">
                  <span>Thông tin cơ bản</span>
                  <span className={`status-pill status-${selectedPromotion.status?.toLowerCase()}`}>
                    {selectedPromotion.status}
                  </span>
                </div>

                <div className="detail-grid">
                  <div className="detail-block">
                    <label>Tên Promotion</label>
                    <p className="detail-name">{selectedPromotion.name}</p>
                  </div>
                  <div className="detail-block">
                    <label>Franchise</label>
                    <p className="detail-franchise">{getFranchiseLabel(selectedPromotion.franchiseId)}</p>
                  </div>
                  <div className="detail-block full-width">
                    <label>Mô tả chi tiết</label>
                    <p>{selectedPromotion.description}</p>
                  </div>
                </div>

                <div className="detail-section-head second">
                  <span>Thông số kỹ thuật</span>
                </div>

                <div className="detail-grid">
                  <div className="detail-block">
                    <label>Loại Promotion</label>
                    <p>
                      <span className="discount-badge">{getDiscountTypeLabel(selectedPromotion.discountType)}</span>
                    </p>
                  </div>
                  <div className="detail-block">
                    <label>Thời hạn áp dụng</label>
                    <p className="detail-inline-date">
                      <span className="material-symbols-outlined">calendar_today</span>
                      {formatDate(selectedPromotion.startDate)} <span className="arrow">→</span> {formatDate(selectedPromotion.endDate)}
                    </p>
                  </div>
                  <div className="detail-block">
                    <label>Mã định danh</label>
                    <p>
                      <code className="detail-code">PROMO-{selectedPromotion.id}</code>
                    </p>
                  </div>
                  <div className="detail-block">
                    <label>Ngày tạo</label>
                    <p>{selectedPromotion.createdAt ? formatDateTime(selectedPromotion.createdAt) : '—'}</p>
                  </div>
                  <div className="detail-block full-width">
                    <label>Cập nhật lần cuối</label>
                    <p>{selectedPromotion.updatedAt ? formatDateTime(selectedPromotion.updatedAt) : '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-surface-container-low flex flex-col sm:flex-row justify-end items-center gap-4">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="w-full sm:w-auto px-8 py-3.5 bg-surface-container-highest text-on-surface font-label text-sm font-bold rounded-full hover:bg-surface-container-high transition-all active:scale-95"
              >
                Đóng
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowDetailModal(false);
                  handleEdit(selectedPromotion);
                }}
                className="w-full sm:w-auto px-10 py-3.5 bg-gradient-to-r from-primary to-primary-container text-on-primary-container font-label text-sm font-extrabold rounded-full shadow-[0_10px_25px_-5px_rgba(63,255,139,0.3)] hover:shadow-[0_15px_30px_-5px_rgba(63,255,139,0.4)] transition-all active:scale-95"
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && selectedPromotion && promotionStats && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 md:p-6 bg-black/45 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowStatsModal(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface-container-lowest w-full max-w-3xl lg:max-w-4xl max-h-[88vh] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-outline-variant/15 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight">
                  Thống Kê
                </h2>
                <p className="text-sm text-on-surface-variant font-label mt-1">{selectedPromotion.name}</p>
              </div>

              <button
                type="button"
                onClick={() => setShowStatsModal(false)}
                className="p-2 hover:bg-surface-container rounded-full transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8">
              <div className="stats-content">
                <div className="stats-grid">
                  <div className="stat-box">
                    <div className="stat-icon">🎫</div>
                    <div className="stat-value">{promotionStats.totalCoupons || 0}</div>
                    <div className="stat-label">Tổng Coupons</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-icon">✅</div>
                    <div className="stat-value">{promotionStats.usedCoupons || 0}</div>
                    <div className="stat-label">Đã Sử Dụng</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-icon">💰</div>
                    <div className="stat-value">{(promotionStats.totalDiscount || 0).toLocaleString()}₫</div>
                    <div className="stat-label">Tổng Giảm Giá</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-icon">👥</div>
                    <div className="stat-value">{promotionStats.totalCustomers || 0}</div>
                    <div className="stat-label">Khách Hàng</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-surface-container-low flex justify-end">
              <button
                type="button"
                onClick={() => setShowStatsModal(false)}
                className="px-8 py-3.5 bg-surface-container-highest text-on-surface font-label text-sm font-bold rounded-full hover:bg-surface-container-high transition-all active:scale-95"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coupons Modal */}
      {showCouponsModal && selectedPromotion && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 md:p-6 bg-black/45 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowCouponsModal(false);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-surface-container-lowest w-full max-w-3xl lg:max-w-4xl max-h-[88vh] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-8 py-6 border-b border-outline-variant/15 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight">
                  Coupons
                </h2>
                <p className="text-sm text-on-surface-variant font-label mt-1">{selectedPromotion.name}</p>
              </div>

              <button
                type="button"
                onClick={() => setShowCouponsModal(false)}
                className="p-2 hover:bg-surface-container rounded-full transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8">
              <div className="coupons-content">
                {promotionCoupons.length === 0 ? (
                  <div className="empty-state">
                    <p>Chưa có coupon nào cho promotion này</p>
                  </div>
                ) : (
                  <table className="coupons-table">
                    <thead>
                      <tr>
                        <th>Mã Coupon</th>
                        <th>Loại</th>
                        <th>Giá Trị</th>
                        <th>Đã Dùng</th>
                        <th>Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promotionCoupons.map((coupon: any) => (
                        <tr key={coupon.id}>
                          <td><span className="code-badge">{coupon.code}</span></td>
                          <td>{getDiscountTypeLabel(coupon.discountType)}</td>
                          <td>{coupon.discountValue}</td>
                          <td>{coupon.usedCount || 0}/{coupon.usageLimit}</td>
                          <td>
                            <span className={`status-badge ${coupon.isPublic ? 'status-active' : 'status-inactive'}`}>
                              {coupon.isPublic ? 'Public' : 'Private'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="px-8 py-6 bg-surface-container-low flex justify-end">
              <button
                type="button"
                onClick={() => setShowCouponsModal(false)}
                className="px-8 py-3.5 bg-surface-container-highest text-on-surface font-label text-sm font-bold rounded-full hover:bg-surface-container-high transition-all active:scale-95"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionManagement;
