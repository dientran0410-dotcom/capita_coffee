import { useEffect, useMemo, useState } from 'react';
import {
    CheckCircle,
    Clock,
    Download,
    Eye,
    Filter,
    Package,
    Plus,
    Search,
    Truck,
    XCircle,
} from 'lucide-react';
import { createOrder, getAllOrders, getOrderById } from '../../services/orderService';
import type { OrderRecord } from '../../services/orderService';
import franchiseService from '@/services/franchiseService';
import { getApprovedSuppliers } from '@/services/supplierService';
import { searchCustomers } from '@/services/customerService';

const statusPalette = {
    Pending: {
        icon: Clock,
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        badgeColor: 'text-yellow-600',
    },
    Preparing: {
        icon: Package,
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        badgeColor: 'text-indigo-600',
    },
    Shipping: {
        icon: Truck,
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        badgeColor: 'text-blue-600',
    },
    Completed: {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-700 border-green-200',
        badgeColor: 'text-green-600',
    },
    Unknown: {
        icon: Clock,
        color: 'bg-slate-100 text-slate-700 border-slate-200',
        badgeColor: 'text-slate-600',
    },
};

type StatusKey = keyof typeof statusPalette;

const dashboardStatus: { key: StatusKey; label: string }[] = [
    { key: 'Pending', label: 'Pending' },
    { key: 'Preparing', label: 'Preparing' },
    { key: 'Shipping', label: 'Shipping' },
    { key: 'Completed', label: 'Completed' },
];

const findStatusKey = (value?: string): StatusKey => {
    if (!value) return 'Unknown';
    const lower = value.toLowerCase().trim().replace(/[\s-]+/g, '_');
    const aliases: Record<string, StatusKey> = {
        pending: 'Pending',
        preparing: 'Preparing',
        processing: 'Preparing',
        in_progress: 'Preparing',
        confirmed: 'Preparing',
        shipped: 'Shipping',
        shipping: 'Shipping',
        delivering: 'Shipping',
        on_delivery: 'Shipping',
        completed: 'Completed',
        compeled: 'Completed',
        delivered: 'Completed',
        success: 'Completed',
    };
    if (aliases[lower]) return aliases[lower];
    const match = (Object.keys(statusPalette) as StatusKey[]).find(
        (key) => key.toLowerCase() === lower.replace(/_/g, '') || key.toLowerCase() === lower
    );
    return match ?? 'Unknown';
};

export function OrderManagement() {
    const [orders, setOrders] = useState<OrderRecord[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [orderError, setOrderError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterOrderId, setFilterOrderId] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewOrderModal, setShowNewOrderModal] = useState(false);
    const [selectedFranchiseId, setSelectedFranchiseId] = useState('');
    const [selectedSupplierId, setSelectedSupplierId] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [orderItems, setOrderItems] = useState('');
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [operationMessage, setOperationMessage] = useState<string | null>(null);
    const [fetchedFranchises, setFetchedFranchises] = useState<{ id: string; name: string }[]>([]);
    const [loadingFranchises, setLoadingFranchises] = useState(false);
    const [franchiseError, setFranchiseError] = useState<string | null>(null);
    const [fetchedSuppliers, setFetchedSuppliers] = useState<{ id: string; name: string }[]>([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    const [supplierError, setSupplierError] = useState<string | null>(null);
    const [customerOptions, setCustomerOptions] = useState<{ id: string; name: string }[]>([]);
    const [loadingCustomers, setLoadingCustomers] = useState(false);
    const [customerError, setCustomerError] = useState<string | null>(null);
    const [customerQuery, setCustomerQuery] = useState('');
    const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderRecord | null>(null);
    const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
    const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);
    const [orderDetailError, setOrderDetailError] = useState<string | null>(null);

    const loadOrders = async () => {
        setLoadingOrders(true);
        setOrderError(null);
        try {
            const response = await getAllOrders();
            setOrders(response.orders ?? []);
        } catch (error: any) {
            setOrderError(error?.message ?? 'Không thể tải danh sách đơn hàng.');
        } finally {
            setLoadingOrders(false);
        }
    };

    const loadCustomers = async (query = '') => {
        setLoadingCustomers(true);
        setCustomerError(null);
        try {
            const trimmed = query.trim();
            const payload: Record<string, any> = {
                page: 1,
                size: 20,
                sortBy: 'createdAt',
                sortDir: 'DESC',
            };
            if (trimmed) {
                if (trimmed.includes('@')) {
                    payload.email = trimmed;
                } else {
                    payload.name = trimmed;
                }
            }
            const response = await searchCustomers(payload);
            const responsePayload: any = response?.data ?? response;
            const list = Array.isArray(responsePayload?.content)
                ? responsePayload.content
                : Array.isArray(responsePayload?.data)
                    ? responsePayload.data
                    : Array.isArray(responsePayload?.customers)
                        ? responsePayload.customers
                        : [];
            const normalized = list
                .map((item) => ({
                    id: item.id ?? item.customerId ?? item.userId ?? '',
                    name: item.name ?? item.fullName ?? item.email ?? 'Unnamed customer',
                }))
                .filter((option) => option.id);
            setCustomerOptions(normalized);
        } catch (error: any) {
            setCustomerError(error?.message ?? 'Không thể tải danh sách khách hàng.');
        } finally {
            setLoadingCustomers(false);
        }
    };

    const loadFranchises = async () => {
        setLoadingFranchises(true);
        setFranchiseError(null);
        try {
            const response = await franchiseService.getAdminFranchises();
            const payload = response?.data ?? response;
            const rawList =
                (payload && typeof payload === 'object' && Array.isArray(payload.content))
                    ? payload.content
                    : Array.isArray(payload)
                        ? payload
                        : Array.isArray(payload?.data)
                            ? payload.data
                            : Array.isArray(payload?.franchises)
                                ? payload.franchises
                                : [];
            const normalized = rawList
                .map((item) => ({
                    id: item.franchiseId ?? item.id ?? item.franchiseCode ?? item.name ?? '',
                    name: item.franchiseName ?? item.name ?? item.franchiseCode ?? item.id ?? 'Unnamed franchise',
                }))
                .filter((option) => option.id);
            setFetchedFranchises(normalized);
        } catch (error: any) {
            setFranchiseError(error?.message ?? 'Không thể tải danh sách franchise.');
        } finally {
            setLoadingFranchises(false);
        }
    };

    useEffect(() => {
        void loadOrders();
        void loadFranchises();
        void loadSuppliers();
        void loadCustomers();
    }, []);

    const loadSuppliers = async () => {
        setLoadingSuppliers(true);
        setSupplierError(null);
        try {
            const response = await getApprovedSuppliers(0, 50);
            const payload = response?.data ?? response;
            const rawList =
                Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.content)
                        ? payload.content
                        : Array.isArray(payload?.data)
                            ? payload.data
                            : Array.isArray(payload?.suppliers)
                                ? payload.suppliers
                                : [];
            const normalized = rawList
                .map((item) => ({
                    id: item.id ?? item.supplierId ?? item.code ?? item.name ?? '',
                    name: item.name ?? item.supplierName ?? item.label ?? item.email ?? 'Unnamed supplier',
                }))
                .filter((option) => option.id);
            setFetchedSuppliers(normalized);
        } catch (error: any) {
            setSupplierError(error?.message ?? 'Không thể tải danh sách supplier.');
        } finally {
            setLoadingSuppliers(false);
        }
    };

    const franchiseNameById = useMemo(() => {
        const map = new Map<string, string>();
        fetchedFranchises.forEach((item) => {
            const id = String(item.id ?? '').trim();
            if (!id) return;
            map.set(id, item.name ?? id);
        });
        return map;
    }, [fetchedFranchises]);

    const getOrderFranchiseId = (order?: OrderRecord | null) => String(order?.franchiseId ?? '').trim();

    const getOrderFranchiseName = (order?: OrderRecord | null) => {
        const franchiseId = getOrderFranchiseId(order);
        if (franchiseId && franchiseNameById.has(franchiseId)) {
            return franchiseNameById.get(franchiseId) ?? '—';
        }
        return order?.franchiseName ?? order?.storeName ?? '—';
    };

    const filteredOrders = useMemo(() => {
        const lowerSearch = searchQuery.toLowerCase();
        return orders.filter((order) => {
            const statusKey = findStatusKey(order.status);
            const matchesStatus = filterStatus === 'all' || statusKey === filterStatus;
            if (!matchesStatus) return false;
            const orderRef = String(order.orderNumber ?? order.orderId ?? order.code ?? order.id ?? '').trim();
            const matchesOrderId = filterOrderId === 'all' || orderRef === filterOrderId;
            if (!matchesOrderId) return false;
            if (!lowerSearch) return true;
            return (
                (order.orderNumber?.toLowerCase().includes(lowerSearch) ?? false) ||
                (order.orderId?.toLowerCase().includes(lowerSearch) ?? false) ||
                (order.code?.toLowerCase().includes(lowerSearch) ?? false) ||
                (order.id?.toLowerCase().includes(lowerSearch) ?? false) ||
                getOrderFranchiseId(order).toLowerCase().includes(lowerSearch) ||
                getOrderFranchiseName(order).toLowerCase().includes(lowerSearch) ||
                (order.franchiseName?.toLowerCase().includes(lowerSearch) ?? false) ||
                (order.supplierName?.toLowerCase().includes(lowerSearch) ?? false)
            );
        });
    }, [orders, filterStatus, filterOrderId, searchQuery, franchiseNameById]);

    const orderFilterOptions = useMemo(() => {
        const map = new Map<string, string>();
        orders.forEach((order) => {
            const id = String(order.orderNumber ?? order.orderId ?? order.code ?? order.id ?? '').trim();
            if (!id) return;
            map.set(id, id);
        });
        return Array.from(map.keys());
    }, [orders]);

    const statusCounts = useMemo(() => {
        return orders.reduce<Record<StatusKey, number>>((acc, order) => {
            const key = findStatusKey(order.status);
            acc[key] = (acc[key] ?? 0) + 1;
            return acc;
        }, {} as Record<StatusKey, number>);
    }, [orders]);

    const statusFilterOptions = useMemo(() => {
        const dynamicStatuses = new Set<StatusKey>();
        orders.forEach((order) => {
            dynamicStatuses.add(findStatusKey(order.status));
        });

        const preferredOrder: StatusKey[] = ['Pending', 'Preparing', 'Shipping', 'Completed', 'Unknown'];
        return preferredOrder.filter((key) => dynamicStatuses.has(key));
    }, [orders]);

    const franchiseDropdownOptions = useMemo(() => {
        if (fetchedFranchises.length) return fetchedFranchises;
        const map = new Map<string, string>();
        orders.forEach((order) => {
            if (order.franchiseId) {
                map.set(order.franchiseId, order.franchiseName ?? order.storeName ?? order.franchiseId);
            }
        });
        const options = Array.from(map.entries()).map(([id, name]) => ({ id, name }));
        return options;
    }, [orders, fetchedFranchises]);

    const supplierOptions = useMemo(() => {
        if (fetchedSuppliers.length) return fetchedSuppliers;
        const map = new Map<string, string>();
        orders.forEach((order) => {
            if (order.supplierId && order.supplierName) {
                map.set(order.supplierId, order.supplierName);
            }
        });
        const options = Array.from(map.entries()).map(([id, name]) => ({ id, name }));
        return options;
    }, [orders, fetchedSuppliers]);

    const handleCreateOrder = async () => {
        if (!selectedFranchiseId || !selectedSupplierId) {
            setOperationMessage('Chọn franchise và supplier trước khi tạo đơn.');
            return;
        }

        const items = orderItems
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((productId) => ({ productId, quantity: 1 }));

        if (items.length === 0) {
            setOperationMessage('Nhập ít nhất một mã sản phẩm (mỗi dòng).');
            return;
        }

        setIsCreatingOrder(true);
        setOperationMessage(null);
        try {
            await createOrder({
                franchiseId: selectedFranchiseId,
                supplierId: selectedSupplierId,
                items,
                ...(selectedCustomerId ? { customerId: selectedCustomerId } : {}),
            });
            setOrderItems('');
            setShowNewOrderModal(false);
            setOperationMessage('Đơn hàng đã gửi thành công.');
            await loadOrders();
        } catch (error: any) {
            setOperationMessage(error?.message ?? 'Không thể tạo đơn hàng.');
        } finally {
            setIsCreatingOrder(false);
        }
    };

    const handleViewOrderDetail = async (order: OrderRecord) => {
        const orderId = String(order.orderId ?? order.id ?? '').trim();
        if (!orderId) {
            setSelectedOrderDetail(order);
            setOrderDetailError('Không tìm thấy định danh đơn hàng để tải chi tiết.');
            setShowOrderDetailModal(true);
            return;
        }

        setLoadingOrderDetail(true);
        setOrderDetailError(null);
        setShowOrderDetailModal(true);

        try {
            const detail = await getOrderById(orderId);
            const payload = (detail as any)?.data ?? detail;
            setSelectedOrderDetail(payload as OrderRecord);
        } catch (error: any) {
            setSelectedOrderDetail(order);
            setOrderDetailError(error?.message ?? 'Không thể tải chi tiết đơn hàng.');
        } finally {
            setLoadingOrderDetail(false);
        }
    };

    const deliveryDate = (order: OrderRecord) => {
        const dynamicOrder = order as any;
        return dynamicOrder?.estimateDeliveryDate ?? dynamicOrder?.estimatedDelivery ?? dynamicOrder?.deliveryDate ?? '—';
    };

    const formatDate = (value?: string) => {
        if (!value) return '—';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return value;
        return parsed.toLocaleString('vi-VN');
    };

    const resolveFranchiseDisplayName = (detail: any) => {
        if (!detail) return '—';

        // Collect candidate ids and names from many possible shapes
        const ids: string[] = [];
        const names: string[] = [];

        const pushIf = (arr: string[], v: any) => {
            if (v === undefined || v === null) return;
            const s = String(v).trim();
            if (s) arr.push(s);
        };

        pushIf(ids, detail.franchiseId);
        pushIf(ids, detail.franchise?.id);
        pushIf(ids, detail.storeId);
        pushIf(ids, detail.store?.id);
        pushIf(ids, detail.franchiseCode);
        pushIf(ids, detail.storeCode);

        pushIf(names, detail.franchiseName);
        pushIf(names, detail.storeName);
        pushIf(names, detail.merchantName);
        pushIf(names, detail.supplierName);
        pushIf(names, detail.franchise?.name);
        pushIf(names, detail.store?.name);

        // 1) Prefer any explicit name present on detail
        if (names.length > 0) return names[0];

        // 2) Try map lookup by id/code
        for (const id of ids) {
            const direct = franchiseNameById.get(id);
            if (direct) return direct;
        }

        // 3) Try matching fetchedFranchises more loosely
        for (const f of fetchedFranchises) {
            try {
                const fid = String(f.id ?? '').trim();
                const fname = String(f.name ?? '').trim();
                if (!fid && !fname) continue;
                if (ids.includes(fid) || names.includes(fname)) return fname || fid;
                // also try contains match
                for (const id of ids) {
                    if (fid && fid.includes(id)) return fname || fid;
                }
            } catch {
                // ignore
            }
        }

        // 4) fallback to any name-like field or id
        if (detail.franchiseName) return detail.franchiseName;
        if (detail.storeName) return detail.storeName;
        if (ids.length > 0) return ids[0];
        return '—';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
                    <p className="text-gray-600 mt-1">Track and manage franchise orders</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Orders</p>
                            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                        </div>
                    </div>
                </div>
                {dashboardStatus.map(({ key, label }) => {
                    const palette = statusPalette[key];
                    const Icon = palette.icon;
                    const isActive = filterStatus === key;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setFilterStatus((prev) => (prev === key ? 'all' : key))}
                            className={`bg-white rounded-lg shadow-sm border p-4 text-left transition-colors ${isActive ? 'border-amber-500 ring-2 ring-amber-100' : 'border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-white p-2 rounded-lg">
                                    <Icon className={`w-5 h-5 ${palette.badgeColor}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">{label}</p>
                                    <p className="text-2xl font-bold text-gray-900">{statusCounts[key] ?? 0}</p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="flex flex-col md:flex-row gap-4 pb-6 border-b border-gray-200">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by order ID, franchise, or supplier..."
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={filterOrderId}
                            onChange={(event) => setFilterOrderId(event.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            <option value="all">All Orders</option>
                            {orderFilterOptions.map((id) => (
                                <option key={id} value={id}>
                                    {id}
                                </option>
                            ))}
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(event) => setFilterStatus(event.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                            <option value="all">All Status</option>
                            {statusFilterOptions.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <Filter className="w-4 h-4" />
                            More Filters
                        </button>
                        <button
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {orderError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-lg">{orderError}</div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Order ID</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Franchise</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loadingOrders ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
                                            <span className="text-sm text-gray-500 font-medium">Đang tải danh sách đơn hàng...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredOrders.map((order) => {
                                const statusKey = findStatusKey(order.status);
                                const palette = statusPalette[statusKey] || statusPalette.PENDING;
                                const StatusIcon = palette.icon;
                                const items = order.orderItems ?? order.items ?? [];
                                const fId = String(order.franchiseId ?? '').trim();

                                return (
                                    <tr key={order.id || order.orderId} className="hover:bg-gray-50/80 transition-colors group">
                                        {/* CỘT ORDER ID - ĐÃ XÓA CHỮ DELIVERY */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                                                    {order.orderNumber ?? order.orderId ?? '—'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* CỘT FRANCHISE - ĐÃ FIX KHI SERVICE CHƯA CÓ DATA */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-800">
                                                    {resolveFranchiseDisplayName(order as any) || 'Chi nhánh hệ thống'}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-mono">{fId || 'No ID'}</span>
                                            </div>
                                        </td>

                                        {/* CỘT TOTAL AMOUNT */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-black text-gray-900">
                                                {Number(order.totalAmount ?? 0).toLocaleString('vi-VN')}
                                                <span className="ml-1 text-[10px] text-gray-500 uppercase">vnđ</span>
                                            </span>
                                        </td>

                                        {/* CỘT STATUS */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm ${palette.color}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {order.status}
                                            </span>
                                        </td>

                                        {/* CỘT DATE */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-600 font-medium">
                                                    {formatDate(order.orderDate ?? order.createdAt)}
                                                </span>
                                            </div>
                                        </td>

                                        {/* CỘT ACTION */}
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleViewOrderDetail(order)}
                                                className="inline-flex items-center justify-center p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all duration-200 shadow-sm active:scale-90"
                                                title="Xem chi tiết đơn hàng"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {showNewOrderModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Create New Order</h2>
                                <p className="text-sm text-gray-500">Fill in the details to place a new franchise order</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowNewOrderModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Cancel
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Franchise</label>
                                <select
                                    value={selectedFranchiseId}
                                    onChange={(event) => setSelectedFranchiseId(event.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="">
                                        {loadingFranchises && !fetchedFranchises.length ? 'Đang tải franchise...' : 'Select franchise'}
                                    </option>
                                    {franchiseDropdownOptions.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.id} - {option.name}
                                        </option>
                                    ))}
                                </select>
                                {franchiseError && (
                                    <p className="text-xs text-rose-600 mt-1">{franchiseError}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Customer (optional)</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        value={customerQuery}
                                        onChange={(event) => setCustomerQuery(event.target.value)}
                                        placeholder="Search by name or email"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => void loadCustomers(customerQuery)}
                                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium"
                                    >
                                        Search
                                    </button>
                                </div>
                                <select
                                    value={selectedCustomerId}
                                    onChange={(event) => setSelectedCustomerId(event.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="">
                                        {loadingCustomers && !customerOptions.length ? 'Đang tải khách hàng...' : 'Select customer (leave blank for guest)'}
                                    </option>
                                    {customerOptions.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                                {customerError && <p className="text-xs text-rose-600 mt-1">{customerError}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                                <select
                                    value={selectedSupplierId}
                                    onChange={(event) => setSelectedSupplierId(event.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                                >
                                    <option value="">
                                        {loadingSuppliers && !fetchedSuppliers.length ? 'Đang tải supplier...' : 'Select supplier'}
                                    </option>
                                    {supplierOptions.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))}
                                </select>
                                {supplierError && (
                                    <p className="text-xs text-rose-600 mt-1">{supplierError}</p>
                                )}
                            </div>
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <p className="text-sm text-amber-800">
                                    <strong>Compliance Check:</strong> Only approved suppliers are allowed. Orders from non-approved
                                    suppliers may be blocked.
                                </p>
                            </div>
                            {operationMessage && (
                                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-lg">
                                    {operationMessage}
                                </div>
                            )}
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedFranchiseId('');
                                        setSelectedSupplierId('');
                                        setOrderItems('');
                                        setOperationMessage(null);
                                        setShowNewOrderModal(false);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={isCreatingOrder}
                                    onClick={handleCreateOrder}
                                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isCreatingOrder ? 'Creating…' : 'Create Order'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showOrderDetailModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-gray-200">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 p-5 bg-white">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Chi tiết đơn hàng</h3>
                                <p className="text-xs text-gray-400 mt-1">
                                    Mã hệ thống: {selectedOrderDetail?.id ?? selectedOrderDetail?.orderNumber ?? selectedOrderDetail?.orderId ?? '—'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowOrderDetailModal(false);
                                    setSelectedOrderDetail(null);
                                    setOrderDetailError(null);
                                }}
                                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {loadingOrderDetail ? (
                                <div className="flex flex-col items-center py-12">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mb-4"></div>
                                    <p className="text-sm text-gray-500 font-medium">Đang lấy dữ liệu từ service...</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {orderDetailError && (
                                        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 flex items-center gap-2">
                                            <XCircle className="w-4 h-4" />
                                            {orderDetailError}
                                        </div>
                                    )}

                                    {/* Thông tin chung (Đã xóa Supplier, Payment Method, Update At) */}
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-5 bg-gray-50 rounded-xl p-5 border border-gray-100">
                                        <div className="space-y-1">
                                            <p className="text-[11px] font-bold text-gray-400 uppercase">Số đơn hàng</p>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {selectedOrderDetail?.orderNumber ?? selectedOrderDetail?.orderId ?? '—'}
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-[11px] font-bold text-gray-400 uppercase">Trạng thái đơn</p>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusPalette[findStatusKey(selectedOrderDetail?.status)].color
                                                }`}>
                                                {selectedOrderDetail?.status ?? 'PENDING'}
                                            </span>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-[11px] font-bold text-gray-400 uppercase">Thanh toán</p>
                                            <p className="text-sm font-bold text-emerald-600">
                                                {selectedOrderDetail?.paymentStatus || 'CHƯA XÁC ĐỊNH'}
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-[11px] font-bold text-gray-400 uppercase">Tổng tiền</p>
                                            <p className="text-lg font-black text-amber-600">
                                                {Number(selectedOrderDetail?.totalAmount ?? 0).toLocaleString('vi-VN')} VNĐ
                                            </p>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-[11px] font-bold text-gray-400 uppercase">Ngày đặt hàng</p>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {formatDate(selectedOrderDetail?.orderDate ?? selectedOrderDetail?.createdAt)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Bảng danh sách Items */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Package className="w-4 h-4 text-amber-600" />
                                            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Danh sách sản phẩm</h4>
                                        </div>

                                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-gray-100 border-b border-gray-200">
                                                        <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase">Sản phẩm</th>
                                                        <th className="px-4 py-2.5 text-[11px] font-bold text-gray-500 uppercase text-right">Số lượng</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 bg-white">
                                                    {(() => {
                                                        const items = selectedOrderDetail?.orderItems ?? selectedOrderDetail?.items ?? [];
                                                        if (items.length === 0) {
                                                            return (
                                                                <tr>
                                                                    <td colSpan={2} className="px-4 py-10 text-center text-sm text-gray-400 italic">
                                                                        Đơn hàng này chưa có dữ liệu sản phẩm
                                                                    </td>
                                                                </tr>
                                                            );
                                                        }
                                                        return items.map((item: any, idx: number) => (
                                                            <tr key={idx} className="hover:bg-amber-50/30 transition-colors">
                                                                <td className="px-4 py-3 text-sm">
                                                                    <div className="font-semibold text-gray-800">
                                                                        {item.name || item.productName || 'Sản phẩm không tên'}
                                                                    </div>
                                                                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                                                        Mã SP: {item.productId || item.sku || 'N/A'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-sm font-bold">
                                                                        x{item.quantity || 1}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ));
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-100 gap-3">
                            <button
                                type="button"
                                onClick={() => setShowOrderDetailModal(false)}
                                className="px-8 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-100 transition-all shadow-sm active:scale-95"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
