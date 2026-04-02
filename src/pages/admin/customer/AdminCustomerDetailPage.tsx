import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Lock,
  Trash2,
  Edit2,
  Eye,
  X,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Separator } from "../../../components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  getCustomerById,
  updateCustomerProfile,
  getCustomerActivity,
  getCustomerAuditLogsAPI,
  lockCustomerAccount,
  unlockCustomerAccount,
  changeCustomerStatus,
} from "../../../services/customerService";
import loyaltyService from "../../../services/loyaltyService";
import type { Customer, AuditLogEntry, Order } from "../../../types/customer";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

export default function AdminCustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [customer, setCustomer] = useState<Customer | null>(
    location.state?.customer || null
  );
  const [loading, setLoading] = useState(!customer);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "activity" | "audit">(
    "profile"
  );
  const [activities, setActivities] = useState<Order[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      showErrorToast(error);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      showSuccessToast(successMessage);
    }
  }, [successMessage]);

  // Form state for editing
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  // Load customer data if not in location state
  useEffect(() => {
    if (!customer && customerId && customerId !== "create") {
      const loadCustomer = async () => {
        try {
          setLoading(true);
          setError(null);
          const res = await getCustomerById(customerId);
          
          const customerData = ((res as any)?.data || res) as Customer;
          const engagement = customerData?.franchiseId
            ? await loyaltyService
                .getCustomerEngagement(String(customerData.id), String(customerData.franchiseId))
                .catch(() => null)
            : null;

          const mergedCustomer = {
            ...customerData,
            loyaltyPoints: engagement?.currentPoints ?? customerData?.loyaltyPoints,
            membershipTier: engagement?.tierName || customerData?.membershipTier,
          };

          setCustomer(mergedCustomer);
          setFormData({
            name: mergedCustomer.name || "",
            email: mergedCustomer.email || "",
            phone: mergedCustomer.phone || "",
            address: mergedCustomer.address || "",
          });
        } catch (error) {
          console.error("Error loading customer:", error);
          setError("Failed to load customer details");
        } finally {
          setLoading(false);
        }
      };
      loadCustomer();
    } else if (customer && !formData.name) {
      setFormData({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
      });
    }
  }, [customerId, customer]);

  // Load activity logs
  useEffect(() => {
    if (customer?.id && activeTab === "activity") {
      const loadActivity = async () => {
        try {
          const res = await getCustomerActivity(customer.id);
          setActivities(res.data?.orders || []);
        } catch (error) {
          console.error("Error loading activity:", error);
          setError("Failed to load activity logs");
        }
      };
      loadActivity();
    }
  }, [customer?.id, activeTab]);

  // Load audit logs
  useEffect(() => {
    if (customer?.id && activeTab === "audit") {
      const loadLogs = async () => {
        try {
          const res = await getCustomerAuditLogsAPI(customer.id);
          setAuditLogs(res.data || []);
        } catch (error) {
          console.error("Error loading audit logs:", error);
          setError("Failed to load audit logs");
        }
      };
      loadLogs();
    }
  }, [customer?.id, activeTab]);

  // Handle form input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Save profile changes
  const handleSave = async () => {
    if (!customerId || customerId === "create") return;
    try {
      setSaving(true);
      setError(null);
      console.log("[AdminCustomerDetailPage] Saving profile with data:", formData);
      const response = await updateCustomerProfile(customerId, formData);
      console.log("[AdminCustomerDetailPage] Save response:", response);
      
      if (response && response.data) {
        setCustomer((prev) =>
          prev
            ? {
                ...prev,
                ...formData,
                ...response.data,
              }
            : null
        );
        setEditMode(false);
        setSuccessMessage("Customer profile updated successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response?.message || "Failed to save customer profile");
      }
    } catch (error: any) {
      console.error("[AdminCustomerDetailPage] Error saving customer:", error);
      const errorMsg = error?.response?.data?.message ||
        error?.message ||
        "Failed to save customer profile";
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
      });
    }
    setEditMode(false);
  };

  // Lock account
  const handleLock = async () => {
    if (!customerId) return;
    try {
      setSaving(true);
      setError(null);
      await lockCustomerAccount(customerId);
      setCustomer((prev) =>
        prev ? { ...prev, status: "LOCKED" } : null
      );
      setSuccessMessage("Customer account locked successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error locking account:", error);
      setError("Failed to lock customer account");
    } finally {
      setSaving(false);
    }
  };

  // Unlock account
  const handleUnlock = async () => {
    if (!customerId) return;
    try {
      setSaving(true);
      setError(null);
      await unlockCustomerAccount(customerId);
      setCustomer((prev) =>
        prev ? { ...prev, status: "ACTIVE" } : null
      );
      setSuccessMessage("Customer account unlocked successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error unlocking account:", error);
      setError("Failed to unlock customer account");
    } finally {
      setSaving(false);
    }
  };

  // Change status
  const handleStatusChange = async (newStatus: Customer["status"]) => {
    if (!customerId) return;
    try {
      setSaving(true);
      setError(null);
      await changeCustomerStatus(customerId, newStatus);
      setCustomer((prev) =>
        prev ? { ...prev, status: newStatus } : null
      );
      setSuccessMessage(`Customer status changed to ${newStatus}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error changing status:", error);
      setError("Failed to change customer status");
    } finally {
      setSaving(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800",
      INACTIVE: "bg-gray-100 text-gray-800",
      SUSPENDED: "bg-yellow-100 text-yellow-800",
      LOCKED: "bg-red-100 text-red-800",
      DELETED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-gray-500">Loading data...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Customer not found</p>
          <Button onClick={() => navigate("/admin/users")} className={undefined} variant={undefined} size={undefined}>
            Back to List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-green-800">{successMessage}</p>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-400 hover:text-green-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/admin/users")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex gap-2">
          {!editMode && (
            <Button
              onClick={() => setEditMode(true)}
              className="bg-amber-600 hover:bg-amber-700" variant={undefined} size={undefined}            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {editMode && (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving} className={undefined} size={undefined}              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700" variant={undefined} size={undefined}              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Customer Header Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start gap-4 mb-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {customer.name?.charAt(0).toUpperCase() || "?"}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {customer.name}
                </h1>
                <p className="text-sm text-gray-600 mt-1">{customer.email}</p>
              </div>
              <div className="flex gap-2">
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    customer.status
                  )}`}
                >
                  {customer.status}
                </span>
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  {customer.membershipTier || "Member"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <Separator className="mb-6" />
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Phone</p>
            <p className="font-semibold text-gray-900">
              {customer.phone || "Not provided"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Loyalty Points</p>
            <p className="font-semibold text-gray-900">
              {customer.loyaltyPoints?.toLocaleString() || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Orders</p>
            <p className="font-semibold text-gray-900">
              {customer.totalOrders || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Spent</p>
            <p className="font-semibold text-gray-900">
              ${(customer.totalSpent || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          {(
            [
              { id: "profile", label: "Profile" },
              { id: "activity", label: "Activity" },
              { id: "audit", label: "Audit Log" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 px-4 text-center font-medium transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-amber-600 text-amber-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Form Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Customer Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ID - Read Only */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer ID
                    </label>
                    <Input
                      type="text"
                      value={customer.id}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      className={!editMode ? "bg-gray-50" : ""}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      className={!editMode ? "bg-gray-50" : ""}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <Input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      className={!editMode ? "bg-gray-50" : ""}
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <Input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      className={!editMode ? "bg-gray-50" : ""}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <Separator className="my-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Joined Date
                  </label>
                  <p className="text-gray-900">
                    {customer.memberSince
                      ? new Date(customer.memberSince).toLocaleDateString(
                          "en-US"
                        )
                      : "-"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Order
                  </label>
                  <p className="text-gray-900">
                    {customer.lastOrderDate
                      ? new Date(customer.lastOrderDate).toLocaleDateString(
                          "en-US"
                        )
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div>
              {activities && activities.length > 0 ? (
                <Table className={undefined}>
                  <TableHeader className={undefined}>
                    <TableRow className={undefined}>
                      <TableHead className={undefined}>Order ID</TableHead>
                      <TableHead className={undefined}>Status</TableHead>
                      <TableHead className={undefined}>Amount</TableHead>
                      <TableHead className={undefined}>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className={undefined}>
                    {activities.map((activity) => (
                      <TableRow key={activity.id} className={undefined}>
                        <TableCell className="font-medium">
                          {activity.orderId}
                        </TableCell>
                        <TableCell className={undefined}>
                          <span
                            className={`inline-flex px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                              activity.status
                            )}`}
                          >
                            {activity.status}
                          </span>
                        </TableCell>
                        <TableCell className={undefined}>${activity.totalAmount?.toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(activity.createdAt).toLocaleDateString(
                            "en-US"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No activity yet
                </p>
              )}
            </div>
          )}

          {activeTab === "audit" && (
            <div>
              {auditLogs && auditLogs.length > 0 ? (
                <Table className={undefined}>
                  <TableHeader className={undefined}>
                    <TableRow className={undefined}>
                      <TableHead className={undefined}>Action</TableHead>
                      <TableHead className={undefined}>Actor</TableHead>
                      <TableHead className={undefined}>Date</TableHead>
                      <TableHead className={undefined}>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className={undefined}>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id} className={undefined}>
                        <TableCell className="font-medium">
                          {log.action}
                        </TableCell>
                        <TableCell className={undefined}>{log.actorEmail || log.actorId}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(log.createdAt).toLocaleDateString("en-US")}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {log.detail}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  No audit logs
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone - Always visible */}
      {customer && (
        <>
          <Separator className="my-6" />
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="font-semibold text-red-900 mb-4">Account Actions</h3>
            <div className="space-y-3">
              {customer.status === "LOCKED" ? (
                <Button
                  onClick={handleUnlock}
                  disabled={saving}
                  className="bg-yellow-600 hover:bg-yellow-700 w-full justify-start" variant={undefined} size={undefined}                >
                  <Lock className="w-4 h-4 mr-2" />
                  {saving ? "Unlocking..." : "Unlock Account"}
                </Button>
              ) : (
                <Button
                    onClick={handleLock}
                    disabled={saving}
                    variant="outline"
                    className="text-red-600 border-red-600 hover:bg-red-50 w-full justify-start" size={undefined}                >
                  <Lock className="w-4 h-4 mr-2" />
                  {saving ? "Locking..." : "Lock Account"}
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
