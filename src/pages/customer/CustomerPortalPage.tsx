import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { User, Edit2, Save, X, CheckCircle, AlertCircle, Mail, Phone as PhoneIcon, MapPin } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/card";
import {
  getCurrentCustomerMeProfile,
  updateCustomerMeProfile,
} from "../../services/customerService";
import loyaltyService from "../../services/loyaltyService";

/**
 * Customer interface - ONLY fields from 2 APIs: GET/PUT /customers/me/details
 * All mock fields (loyaltyPoints, totalOrders, totalSpent, membershipTier, etc.) removed
 */
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  status: string;
  role?: string;
  franchiseId?: string;
  marketingOptin?: boolean;
  isFirstLogin?: boolean;
  tier?: string;
}

// Phone formatting helpers
const formatPhoneNumber = (phone: string): string => {
  if (!phone) return "-";
  if (phone.startsWith("+84")) {
    return "0" + phone.slice(3);
  }
  return phone;
};

/**
 * Convert display format (0xxx) to API format (+84xx)
 * Only for input that user types (already in 0xxx format)
 * ⚠️ Call ONLY from handleInputChange when user types
 */
const normalizePhoneNumberFromInput = (phone: string): string => {
  if (!phone) return "";
  // Only keep digits
  let cleaned = phone.replace(/\D/g, "");
  if (!cleaned) return "";
  
  // If user typed 0xxx, convert to +84
  if (cleaned.startsWith("0")) {
    return "+84" + cleaned.slice(1);
  }
  
  // If user typed 84xxx, convert to +84
  if (cleaned.startsWith("84")) {
    return "+84" + cleaned;
  }
  
  // Fallback for other formats - just add +84
  return "+84" + cleaned;
};

/**
 * LEGACY - removed from use
 * @deprecated Use normalizePhoneNumberFromInput instead
 */
const normalizePhoneNumber = (phone: string): string => {
  return normalizePhoneNumberFromInput(phone);
};

/**
 * Normalize API response to Customer interface
 * Only map fields that exist in 2 APIs
 */
const normalizeCustomerFromApi = (raw: any): Customer => ({
  id: String(raw?.id ?? ""),
  name: raw?.name || "",
  email: raw?.email || "",
  phone: raw?.phone || "",
  address: raw?.address || "",
  status: raw?.status || "ACTIVE",
  role: raw?.role || "CUSTOMER",
  franchiseId: raw?.franchiseId,
  marketingOptin: raw?.marketingOptin ?? false,
  isFirstLogin: raw?.isFirstLogin ?? false,
  tier: raw?.tier,
});

/**
 * CustomerPortalPage - Simplified to only handle profile management
 * ONLY uses 2 APIs:
 * - GET /api/auth-service/customers/me/details
 * - PUT /api/auth-service/customers/me/details
 */
export default function CustomerPortalPage() {
  const { user } = useAuth();
  const userRole = String((user as any)?.role || "");
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tierName, setTierName] = useState<string | null>(null);

  // Load customer profile on mount
  useEffect(() => {
    const loadCustomer = async (): Promise<void> => {
      const isCustomer = userRole.toUpperCase() === "CUSTOMER";
      
      if (!isCustomer) {
        setError("Access denied: Only customers can access this page.");
        setLoading(false);
        return;
      }

      try {
        const response = await getCurrentCustomerMeProfile();
        if (response.success && response.data) {
          const normalizedCustomer = normalizeCustomerFromApi(response.data);
          setCustomer(normalizedCustomer);
          setFormData(normalizedCustomer);
          setError(null);

          // Fetch loyalty tier info
          if (normalizedCustomer.id && normalizedCustomer.franchiseId) {
            try {
              const engagement = await loyaltyService.getCustomerEngagement(
                normalizedCustomer.id,
                normalizedCustomer.franchiseId
              );
              if (engagement?.tierName) {
                setTierName(engagement.tierName);
              }
            } catch (tierErr) {
              console.warn("[CustomerPortal] Could not fetch tier:", tierErr);
            }
          }
        } else {
          setError(response.message || "Failed to load profile");
        }
      } catch (err) {
        console.error("Error loading customer profile:", err);
        setError("Unable to load profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
  }, [userRole]);

  const handleInputChange = (key: keyof Customer, value: string) => {
    if (formData) {
      // ⚠️ ONLY normalize when user is typing phone field
      if (key === "phone") {
        value = normalizePhoneNumberFromInput(value);
      }
      setFormData({ ...formData, [key]: value });
    }
  };

  const handleToggleMarketing = () => {
    if (formData) {
      setFormData({ ...formData, marketingOptin: !formData.marketingOptin });
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!formData) return;

    try {
      setSaving(true);
      setError(null);
      
      // ⚠️ IMPORTANT: Build payload carefully
      // - formData.phone is ALREADY normalized (either from API or from handleInputChange)
      // - DO NOT normalize again - it will cause double-normalize bug
      // - Just use formData values as-is
      const payload = {
        name: formData.name?.trim() || "",
        phone: String(formData.phone || ""),  // ✅ Already normalized, send as-is
        address: formData.address?.trim() || "",
        mail: formData.email || "",  // ⚠️ API expects 'mail', not 'email'
        marketingOptin: formData.marketingOptin ?? false,
      };

      // 🔍 DEBUG: Log payload to verify
      console.log("[CustomerPortal] DEBUG: Saving payload:", {
        name: payload.name,
        phone: payload.phone,
        phone_length: String(payload.phone).length,
        address: payload.address,
        mail: payload.mail,
        marketingOptin: payload.marketingOptin,
      });

      const response = await updateCustomerMeProfile(payload);
      
      if (response.success && response.data) {
        const updatedCustomer = normalizeCustomerFromApi(response.data);
        setCustomer(updatedCustomer);
        setFormData(updatedCustomer);
        setIsEditing(false);
        setSuccessMessage("Profile updated successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(response.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(customer);
    setIsEditing(false);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-200 rounded-full mb-4">
            <User className="w-6 h-6 text-gray-500 animate-pulse" />
          </div>
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md border-red-200 bg-red-50">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-red-900 mb-2">Unable to Load Profile</h3>
            <p className="text-red-700 text-sm mb-4">{error || "An unexpected error occurred"}</p>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm" className={undefined}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
        </div>
        <p className="text-gray-600 text-base ml-11">Manage and update your profile information</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-900 text-sm">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-900 text-sm">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Profile Summary Card */}
      <Card className="overflow-hidden">
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 py-6">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                  {customer.name?.charAt(0)?.toUpperCase() || "C"}
                </div>
              </div>

              {/* User Info */}
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-gray-900 max-w-xs truncate">{customer.name || "No Name"}</h2>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {customer.email || "No Email"}
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <Badge
                    className={
                      customer.status === "ACTIVE"
                        ? "bg-green-100 text-green-800 font-medium"
                        : "bg-yellow-100 text-yellow-800 font-medium"
                    }
                    variant={undefined}
                  >
                    {customer.status === "ACTIVE" ? "✓ Active" : customer.status}
                  </Badge>
                  {tierName && (
                    <Badge
                      className="bg-blue-100 text-blue-800 font-medium"
                      variant={undefined}
                    >
                      {tierName}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="w-full sm:w-auto">
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                  size="default" variant={undefined}                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="default"
                    disabled={saving}
                    className="flex-1 sm:flex-none"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white"
                      size="default" variant={undefined}                  >
                    <Save className="w-4 h-4 mr-1" />
                    {saving ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information Card */}
      <Card className={undefined}>
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="text-lg text-gray-900">Personal Information</CardTitle>
          <CardDescription className={undefined}>Update your basic personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Full Name
              </label>
              {isEditing ? (
                <Input
                  type="text"
                  value={formData?.name || ""}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("name", e.target.value)
                  }
                  placeholder="Enter your full name"
                  className="bg-white border-input"
                />
              ) : (
                <div className="px-3 py-2.5 bg-gray-50 text-gray-900 rounded-md border border-gray-200 text-sm font-medium">
                  {formData?.name || "-"}
                </div>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                <PhoneIcon className="w-4 h-4" />
                Phone Number
              </label>
              {isEditing ? (
                <Input
                  type="tel"
                  value={formatPhoneNumber(formData?.phone || "")}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("phone", e.target.value)
                  }
                  placeholder="0901 234 567"
                  className="bg-white border-input"
                />
              ) : (
                <div className="px-3 py-2.5 bg-gray-50 text-gray-900 rounded-md border border-gray-200 text-sm font-medium">
                  {formatPhoneNumber(formData?.phone || "") || "-"}
                </div>
              )}
            </div>
          </div>

          {/* Address - Full width */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Address
            </label>
            {isEditing ? (
              <Input
                type="text"
                value={formData?.address || ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleInputChange("address", e.target.value)
                }
                placeholder="Enter your address"
                className="bg-white border-input"
              />
            ) : (
              <div className="px-3 py-2.5 bg-gray-50 text-gray-900 rounded-md border border-gray-200 text-sm font-medium">
                {formData?.address || "-"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact & Preferences Card */}
      <Card className={undefined}>
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="text-lg text-gray-900">Contact & Preferences</CardTitle>
          <CardDescription className={undefined}>Email and communication preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Email - Read Only */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            <div className="px-3 py-2.5 bg-gray-100 text-gray-600 rounded-md border border-gray-300 text-sm font-medium cursor-not-allowed flex items-center gap-2">
              {formData?.email || "-"}
              <span className="ml-auto text-xs text-gray-500 font-normal">Read-only</span>
            </div>
          </div>

          {/* Marketing Opt-in - Custom Checkbox */}
          {isEditing ? (
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
                <input
                  type="checkbox"
                  checked={formData?.marketingOptin ?? false}
                  onChange={handleToggleMarketing}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer accent-blue-600 mt-0.5 flex-shrink-0"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    Subscribe to Marketing Emails
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Receive promotional offers, updates, and exclusive deals
                  </p>
                </div>
              </label>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center flex-shrink-0 bg-white">
                {formData?.marketingOptin && (
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Subscribe to Marketing Emails
                </p>
                <p className="text-xs text-gray-600">
                  {formData?.marketingOptin ? "Enabled" : "Disabled"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Status Card */}
      <Card className={undefined}>
        <CardHeader className="border-b border-gray-100 pb-4">
          <CardTitle className="text-lg text-gray-900">Account Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Current Status
              </p>
              <Badge
                className={
                  customer.status === "ACTIVE"
                    ? "bg-green-100 text-green-800 text-sm font-medium px-3 py-1.5 w-fit"
                    : "bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1.5 w-fit"
                }
                variant={undefined}
              >
                {customer.status === "ACTIVE" ? "✓ Active" : customer.status}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Account ID
              </p>
              <p className="text-sm text-gray-600 font-mono bg-gray-50 px-3 py-2 rounded-md border border-gray-200">
                {customer.id}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Information Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-2">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900 text-sm">Email Cannot Be Changed</h4>
            <p className="text-blue-800 text-sm mt-1">
              Your email address is linked to your account authentication. To change your email,
              please contact our support team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
