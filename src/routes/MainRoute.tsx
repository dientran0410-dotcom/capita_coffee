import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import AboutPage from "../pages/AboutPage";
import RedeemPoints from "../pages/customer/redeem/RedeemPoints";
import Checkout from "../pages/customer/order/Checkout";
import CustomerDashboard from "../pages/customer/dashboardCustomer";
import CODOrderDetails from "../pages/customer/CODOrderDetails";
import MemberShip from "../pages/customer/MemberShip";
import MyOrder from "../pages/customer/MyOrderPage";
import NearbyStores from "../pages/customer/NearbyStores";
import RewardOffer from "../pages/customer/RewardOffer";
import CouponPage from "../pages/customer/coupon/CouponPage";
import AppliedCouponsPage from "../pages/customer/coupon/AppliedCouponsPage";
import RedeemHistory from "../pages/customer/redeem/RedeemHistory";
import TrackDelivery from "../pages/customer/TrackDelivery";
import StaffScanPage from "../pages/staff/ScanQR/StaffScanQR";
import Dashboard from "../pages/admin/Dashboard";
import { Notification } from "../pages/admin/Notification";
import CouponManagement from "../pages/admin/Coupon/CouponManagement";
import PromotionManagement from "../pages/admin/Promotion/PromotionManagement";
import LoyaltyPage from "../pages/admin/LoyaltyPage";
import RewardPage from "../pages/admin/Reward/RewardPage";
import AdminCustomerListPage from "../pages/admin/customer/AdminCustomerListPage";
import AdminCustomerDetailPage from "../pages/admin/customer/AdminCustomerDetailPage";
import Forbidden from "../pages/Forbidden";
import AdminLayout from "../layouts/admin/AdminLayout";
import CustomerLayout from "../layouts/customer/CustomerLayout";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import AuthRoute from "./AuthRoute";
import UserRoute from "./UserRoute";
import { Login } from "../pages/auth/Login";
import { ForgotPassword } from "../pages/auth/ForgotPassword";
import { Register } from "../pages/auth/Register";
import { VerifyOTP } from "../pages/auth/VerifyOTP";
import { ResetPassword } from "../pages/auth/ResetPassword";
import ContractList from "../pages/admin/contract/ContractList";
import { ContractDetail } from "../pages/admin/contract/ContractDetail";
import { FranchiseList } from "../pages/admin/franchise/FranchiseList";
import { FranchiseDetail } from "../pages/admin/franchise/FranchiseDetail";
import { FranchiseStaffPage } from "../pages/admin/franchise/FranchiseStaffPage";
import { WarehouseMapping } from "../pages/admin/WarehouseMapping";
import { SupplierMappingApproval } from "../pages/admin/SupplierMappingApproval";
import WarehouseDashboard from "../pages/admin/warehouse/Dashboard";
import WarehousePage from "../pages/admin/warehouse/Warehouse";
import WarehouseCategory from "../pages/admin/warehouse/Category";
import WarehouseItem from "../pages/admin/warehouse/Item";
import WarehouseLocation from "../pages/admin/warehouse/Location";
import WarehouseRequestPage from "../pages/admin/warehouse/RequestPage";
import WarehouseRequestHistoryPage from "../pages/admin/warehouse/RequestHistoryPage";
import SupplierList from "../pages/supplier/SupplierList";
import SupplierDashboard from "../pages/supplier/SupplierDashboard";
import CreateSupplier from "../pages/supplier/CreateSupplier";
import SupplierDetail from "../pages/supplier/SupplierDetail";
import UpdateSupplier from "../pages/supplier/UpdateSupplier";
import SupplierAuditLogs from "../pages/supplier/SupplierAuditLogs";
import SupplierAuditLogsAll from "../pages/supplier/SupplierAuditLogsAll";
import ViewApprovedSupplier from "../pages/supplier/ViewApprovedSupplier";
import CompareSuppliers from "../pages/supplier/CompareSuppliers";
import SupplierProductManagement from "../pages/supplier/SupplierProductManagement";
import ProductManagement from "../pages/supplier/ProductManagement";
import CreateSupplierProduct from "../pages/supplier/CreateSupplierProduct";
import { FranchiseView } from "../pages/manager/franchise/FranchiseView";
import { FranchiseDetailView } from "../pages/manager/franchise/FranchiseDetailView";
import { FranchiseConfigPage } from "../pages/manager/franchise/FranchiseConfigPage";
import { ManagerFranchiseStaffPage } from "../pages/manager/franchise/ManagerFranchiseStaffPage";
import { OpeningHoursPage } from "../pages/manager/franchise/OpeningHoursPage";
import { SupplierRequestPage } from "../pages/manager/SupplierRequestPage";
import ShiftList from "../pages/manager/shift/ShiftList";
import CreateShift from "../pages/manager/shift/CreateShift";
import UpdateShift from "../pages/manager/shift/UpdateShift";
import AssignStaff from "../pages/manager/shift/AssignStaff";
import Attendance from "../pages/manager/attendance/Attendance";
import AttendanceReport from "../pages/manager/attendance/AttendanceReport";
import ShiftAttendance from "../pages/manager/attendance/ShiftAttendance";
import StaffAttendanceHistory from "../pages/manager/attendance/StaffAttendanceHistory";
import StaffList from "../pages/manager/staff/StaffList";
import CreateStaff from "../pages/manager/staff/CreateStaff";
import UpdateStaff from "../pages/manager/staff/UpdateStaff";
import StaffSchedules from "../pages/manager/staff/StaffSchedules";
import InventoryManagement from "../pages/manager/InventoryManagement";
import ManagerContractList from "../pages/manager/contract/ManagerContractList";
import ManagerContractDetail from "../pages/manager/contract/ManagerContractDetail";
import StaffDashboard from "../pages/staff/StaffDashboard";
import StaffScheduleView from "../pages/staff/StaffScheduleView";
import StaffAttendanceView from "../pages/staff/StaffAttendanceView";
import StaffReportView from "../pages/staff/StaffReportView";
import OrderCODPage from "../pages/staff/OrderCODPage";
import StaffHomePage from "../pages/staff/PODPage";
import StaffCartPage from "../pages/staff/cart/StaffCartPage";
import PaymentSuccessStaff from "../pages/staff/PaymentSuccessStaff";
import { OrderManagement } from "../pages/admin/OrderManagement";
import ProductPage from "../pages/admin/Product/ProductPage";
import ProductDetail from "../pages/admin/Product/ProductDetail";
import CreateProduct from "../pages/admin/Product/CreateProduct";
import UpdateProduct from "../pages/admin/Product/UpdateProduct";
import RedemptionHistory from "@/pages/admin/Redemption/RedemptionHistory";
import ReportManagerment from "@/pages/admin/report/ReportManagerment";
import PermissionManagement from "@/pages/admin/PermissionManagement";
import HomePageCustomer from "../pages/customer/HomePageCustomer";
import CustomerPortalPage from "@/pages/customer/CustomerPortalPage";
import MenuPage from "../pages/MenuPage";
import WarehouseRequests from "../pages/supplier/WarehouseRequests";
import SupplierAccountManagement from "../pages/supplier/SupplierAccountManagement";
import CustomerCartPage from "../pages/customer/cart/CustomerCartPage";
import PaymentSuccess from "../pages/PaymentSuccess";
import PaymentFailed from "../pages/PaymentFail";
import PaymentReturn from "../pages/PaymentReturn";
import MyOrdersPageStaff from "../pages/staff/MyOrderPageStaff";

const MainRoute: React.FC = () => {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />

            <Route element={<AuthRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/verify-otp" element={<VerifyOTP />} />
                <Route path="/reset-password" element={<ResetPassword />} />
            </Route>

            <Route path="/403" element={<Forbidden />} />

            {/* MoMo redirect handler + result pages */}
            <Route path="/payment-return" element={<PaymentReturn />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/staff/payment-success" element={<PaymentSuccessStaff />} />
            <Route path="/payment-fail" element={<PaymentFailed />} />

            <Route element={<UserRoute />}>
                <Route path="/home" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/menu" element={<MenuPage />} />
            </Route>

            <Route element={<ProtectedRoute role={["customer"]} />}>
                {/* Customer menu page - standalone without sidebar */}
                <Route path="/customer" element={<HomePageCustomer />} />
                <Route path="/cart" element={<CustomerCartPage />} />

                {/* Customer portal with sidebar */}
                <Route path="/customer/portal" element={<CustomerLayout />}>
                    <Route index element={<CustomerDashboard />} />
                    <Route path="dashboard" element={<CustomerDashboard />} />
                    <Route path="my-portal" element={<CustomerPortalPage />} />
                    {/* <Route path="cart" element={<Cart />} /> */}
                    <Route path="my-orders" element={<MyOrder />} />
                    <Route path="cod-orders-details" element={<CODOrderDetails />} />
                    <Route path="track-delivery" element={<TrackDelivery />} />
                    <Route path="nearby-stores" element={<NearbyStores />} />
                    <Route path="reward-offers" element={<RewardOffer />} />
                    <Route path="coupons" element={<CouponPage />} />
                    <Route path="applied-coupons" element={<AppliedCouponsPage />} />
                    <Route path="membership" element={<MemberShip />} />
                    <Route path="redeem-history" element={<RedeemHistory />} />
                </Route>

                {/* Other customer routes without sidebar */}
                <Route path="/customer/checkout" element={<Checkout />} />
                <Route path="/redeem" element={<RedeemPoints />} />
            </Route>

            <Route element={<ProtectedRoute role={["admin"]} />}>
                <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="franchises" element={<FranchiseList />} />
                    <Route path="franchise-detail" element={<FranchiseDetail />} />
                    <Route path="franchise-staff/:id" element={<FranchiseStaffPage />} />
                    <Route path="contracts" element={<ContractList />} />
                    <Route path="contract-detail" element={<ContractDetail />} />
                    <Route path="warehouse-mapping" element={<WarehouseMapping />} />
                    <Route path="supplier-approval" element={<SupplierMappingApproval />} />
                    <Route path="warehouse" element={<WarehouseDashboard />} />
                    <Route path="warehouse/list" element={<WarehousePage />} />
                    <Route path="warehouse/category" element={<WarehouseCategory />} />
                    <Route path="warehouse/item" element={<WarehouseItem />} />
                    <Route path="warehouse/location" element={<WarehouseLocation />} />
                    <Route path="warehouse/request" element={<WarehouseRequestPage />} />
                    <Route path="warehouse/request-history" element={<WarehouseRequestHistoryPage />} />
                    <Route path="suppliers" element={<SupplierList />} />
                    <Route path="suppliers/dashboard" element={<SupplierDashboard />} />
                    <Route path="suppliers/create" element={<CreateSupplier />} />
                    <Route path="suppliers/approved" element={<ViewApprovedSupplier />} />
                    <Route path="suppliers/products" element={<SupplierProductManagement />} />
                    <Route path="suppliers/:id" element={<SupplierDetail />} />
                    <Route path="suppliers/update/:id" element={<UpdateSupplier />} />
                    <Route path="suppliers/:id/audit" element={<SupplierAuditLogs />} />
                    <Route path="suppliers/audit-logs/all" element={<SupplierAuditLogsAll />} />
                    <Route path="suppliers/compare/:productId" element={<CompareSuppliers />} />
                    <Route path="suppliers/:supplierId/products" element={<ProductManagement />} />
                    <Route path="suppliers/:supplierId/products/create" element={<CreateSupplierProduct />} />
                    <Route path="products" element={<ProductPage />} />
                    <Route path="products/:id" element={<ProductDetail />} />
                    <Route path="products/update/:id" element={<UpdateProduct />} />
                    <Route path="products/create" element={<CreateProduct />} />
                    <Route path="orders" element={<OrderManagement />} />
                    <Route path="coupons" element={<CouponManagement />} />
                    <Route path="promotions" element={<PromotionManagement />} />
                    <Route path="loyalty" element={<LoyaltyPage />} />
                    <Route path="rewards" element={<RewardPage />} />
                    <Route path="redeem" element={<RedemptionHistory />} />
                    <Route path="users" element={<AdminCustomerListPage />} />
                    <Route path="users/:customerId/edit" element={<AdminCustomerDetailPage />} />
                    <Route path="users/:customerId/view" element={<AdminCustomerDetailPage />} />
                    <Route path="reports" element={<ReportManagerment />} />
                    <Route path="notification" element={<Notification />} />
                    <Route path="permissions" element={<PermissionManagement />} />
                </Route>
            </Route>

            <Route element={<ProtectedRoute role={["staff"]} />}>
                {/* Standalone staff shopping flow (same as customer) */}
                <Route path="/staff" element={<StaffHomePage />} />
                <Route path="/staff/cart" element={<StaffCartPage />} />
                <Route path="/staff/checkout" element={<Navigate to="/staff/cart" replace />} />

                {/* Staff portal (with sidebar) */}
                <Route path="/staff/portal" element={<AdminLayout />}>
                    <Route index element={<StaffDashboard />} />
                    <Route path="pod" element={<StaffHomePage />} />
                    <Route path="scan" element={<StaffScanPage />} />
                    <Route path="schedule" element={<StaffScheduleView />} />
                    <Route path="attendance" element={<StaffAttendanceView />} />
                    <Route path="report" element={<StaffReportView />} />
                    {/* Staff orders page (My Orders for staff) */}
                    <Route path="orders" element={<MyOrdersPageStaff />} />
                    {/* Backwards-compatible singular path used by Sidebar */}
                    <Route path="order" element={<MyOrdersPageStaff />} />
                </Route>

                {/* Backward-compatible redirects */}
                <Route path="/staff/home" element={<Navigate to="/staff" replace />} />
                <Route path="/staff/scan" element={<Navigate to="/staff/portal/scan" replace />} />
                <Route path="/staff/schedule" element={<Navigate to="/staff/portal/schedule" replace />} />
                <Route path="/staff/attendance" element={<Navigate to="/staff/portal/attendance" replace />} />
                <Route path="/staff/report" element={<Navigate to="/staff/portal/report" replace />} />
                <Route path="/staff/order" element={<Navigate to="/staff/portal/order" replace />} />
            </Route>

            <Route element={<ProtectedRoute role={["manager"]} />}>
                <Route path="/manager" element={<AdminLayout />}>
                    <Route index element={<FranchiseView />} />
                    <Route path="franchises" element={<FranchiseView />} />
                    <Route path="franchise-detail" element={<FranchiseDetailView />} />
                    <Route path="franchise-config" element={<FranchiseConfigPage />} />
                    <Route path="franchise-staff/:id" element={<ManagerFranchiseStaffPage />} />
                    <Route path="contracts" element={<ManagerContractList />} />
                    <Route path="contract-detail" element={<ManagerContractDetail />} />
                    <Route path="opening-hours" element={<OpeningHoursPage />} />
                    <Route path="supplier-request" element={<SupplierRequestPage />} />
                    <Route path="inventory" element={<InventoryManagement />} />
                    <Route path="shifts" element={<ShiftList />} />
                    <Route path="shifts/create" element={<CreateShift />} />
                    <Route path="shifts/update/:id" element={<UpdateShift />} />
                    <Route path="shifts/:id/assign" element={<AssignStaff />} />
                    <Route path="assign-staff" element={<AssignStaff />} />
                    <Route path="attendance" element={<Attendance />} />
                    <Route path="attendance/report" element={<AttendanceReport />} />
                    <Route path="attendance/history" element={<StaffAttendanceHistory />} />
                    <Route path="attendance/:shiftId" element={<ShiftAttendance />} />
                    <Route path="staff" element={<StaffList />} />
                    <Route path="staff/list" element={<StaffList />} />
                    <Route path="staff/create" element={<CreateStaff />} />
                    <Route path="staff/update/:id" element={<UpdateStaff />} />
                    <Route path="staff/schedules" element={<StaffSchedules />} />
                </Route>
            </Route>

            <Route element={<ProtectedRoute role={["supplier"]} />}>
                <Route path="/supplier" element={<AdminLayout />}>
                    <Route index element={<ProductManagement />} />
                    <Route path=":supplierId/products" element={<ProductManagement />} />
                    <Route path=":supplierId/products/create" element={<CreateSupplierProduct />} />
                    <Route path="warehouse-requests" element={<WarehouseRequests />} />
                    <Route path="account" element={<SupplierAccountManagement />} />
                    <Route path="compare/:productId" element={<CompareSuppliers />} />
                </Route>
            </Route>
        </Routes>
    );
};

export default MainRoute;
