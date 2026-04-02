import { useState } from "react";
import { X, AlertCircle, CheckCircle, Loader } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { changeUserRole } from "../../../services/UserManagementService";
import { useAuth } from "../../../context/AuthContext";

interface ChangeRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  currentRole?: string;
  onSuccess?: () => void;
}

export function ChangeRoleModal({
  isOpen,
  onClose,
  customerId,
  customerName,
  currentRole = "CUSTOMER",
  onSuccess,
}: ChangeRoleModalProps) {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedRole, setSelectedRole] = useState(currentRole);

  // Available roles for change role action
  // STAFF removed from business logic - replaced with WAREHOUSE_MANAGER and INVENTORY_MANAGER
  // CUSTOMER removed from assignable roles: users cannot be changed TO CUSTOMER role
  const roles = [
    "ADMIN",
    "MANAGER",
    "SUPPLIER",
    "WAREHOUSE_MANAGER",
    "INVENTORY_MANAGER",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedRole === currentRole) {
      setError("Please select a different role");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("[ChangeRoleModal] ========== CHANGE ROLE REQUEST ==========");
      console.log("[ChangeRoleModal] CURRENT USER OBJECT:", JSON.stringify(currentUser, null, 2));
      console.log(`[ChangeRoleModal] Current User ID: ${currentUser?.id}`);
      console.log(`[ChangeRoleModal] Current User Username: ${currentUser?.username}`);
      console.log(`[ChangeRoleModal] Current User Role: ${currentUser?.role}`);
      console.log(`[ChangeRoleModal] Current User Email: ${currentUser?.email}`);
      console.log("[ChangeRoleModal] ---");
      console.log(`[ChangeRoleModal] Target Customer ID: ${customerId}`);
      console.log(`[ChangeRoleModal] Target Customer Name: ${customerName}`);
      console.log(`[ChangeRoleModal] Current Customer Role: ${currentRole}`);
      console.log(`[ChangeRoleModal] New Role: ${selectedRole}`);
      console.log("[ChangeRoleModal] ==========================================");
      
      const response = await changeUserRole(customerId, selectedRole);

      console.log("[ChangeRoleModal] Response:", response);

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          }
          onClose();
          setSuccess(false);
          setSelectedRole(currentRole);
        }, 1500);
      } else {
        setError(response.message || "Failed to change role");
      }
    } catch (err: any) {
      console.error("[ChangeRoleModal] Error:", err);
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Error changing user role";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Check if target user has CUSTOMER role: backend rejects role changes for CUSTOMER users
  const isCustomerRole = currentRole === "CUSTOMER";
  const canChangeRole = !isCustomerRole;

  // Handle overlay click to close modal
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/10 backdrop-blur-md flex items-center justify-center z-[100000] !m-0"
      onClick={handleOverlayClick}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Change User Role</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* CUSTOMER Role Warning */}
          {isCustomerRole && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">
                <strong>Cannot change role:</strong> Customer users (CUSTOMER role) cannot be promoted to admin or staff roles per system policy.
              </p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">Role updated successfully!</p>
            </div>
          )}

          {/* Customer Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer
            </label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{customerName}</p>
              <p className="text-xs text-gray-600 mt-1">ID: {customerId}</p>
            </div>
          </div>

          {/* Current Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Role
            </label>
            <div className="p-3 bg-amber-50 rounded-lg">
              <p className="font-medium text-amber-900">{currentRole}</p>
            </div>
          </div>

          {/* New Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Role <span className="text-red-600">*</span>
            </label>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setError(null);
              }}
              disabled={loading || success || isCustomerRole}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50"
            >
              {roles.map((role) => (
                <option key={role} value={role} disabled={role === currentRole}>
                  {role}
                </option>
              ))}
            </select>
            {isCustomerRole && (
              <p className="text-xs text-red-600 mt-2">
                Role selection is disabled for CUSTOMER users - they cannot be promoted to other roles.
              </p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || success || isCustomerRole}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white disabled:bg-gray-400"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : isCustomerRole ? (
                "Cannot Update"
              ) : (
                "Update Role"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
