import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  getAllPermissions,
  getRolePermissions,
  assignRolePermissions,
  deleteRolePermision,
} from "@/services/permissionService";
import type { Permission, RolePermission } from "@/services/permissionService";
import { Lock, Save, RefreshCw, Eye, Trash2 } from "lucide-react";

type PermissionManagementTab = "get-permissions" | "view-role-permissions" | "assign-permissions";

// Role to ID mapping
const ROLE_ID_MAP: Record<string, number> = {
  ADMIN: 1,
  MANAGER: 2,
  STAFF: 3,
  SUPPLIER: 4,
  CUSTOMER: 5,
};

const AVAILABLE_ROLES = ["ADMIN", "MANAGER", "STAFF", "SUPPLIER", "CUSTOMER"];

export default function PermissionManagement() {
  const [activeTab, setActiveTab] = useState<PermissionManagementTab>(
    "get-permissions"
  );
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("ADMIN");
  const [selectedRoleForView, setSelectedRoleForView] = useState("ADMIN");
  const [selectedRoleForAssign, setSelectedRoleForAssign] = useState("ADMIN");
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [viewRolePermissions, setViewRolePermissions] = useState<Permission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<(string | number)[]>(
    []
  );
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

  // Load all permissions on mount
  useEffect(() => {
    handleGetAllPermissions();
  }, []);

  // Load role permissions when selected role changes in assign tab
  useEffect(() => {
    if (activeTab === "assign-permissions") {
      handleGetRolePermissions();
    }
  }, [selectedRoleForAssign, activeTab]);

  // Load role permissions when selected role changes in view tab
  useEffect(() => {
    if (activeTab === "view-role-permissions") {
      handleGetViewRolePermissions();
    }
  }, [selectedRoleForView, activeTab]);

  const handleGetAllPermissions = async () => {
    setLoading(true);
    setMessage("");
    setMessageType(null);
    try {
      const response = await getAllPermissions();
      if (response.data) {
        setAllPermissions(response.data);
        const successMsg =
          response.message || `Loaded ${response.data.length} permissions successfully`;
        setMessage(successMsg);
        setMessageType("success");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to load permissions";
      setMessage(errorMsg);
      setMessageType("error");
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGetViewRolePermissions = async () => {
    setLoading(true);
    setMessage("");
    setMessageType(null);
    try {
      const roleId = String(ROLE_ID_MAP[selectedRoleForView]);
      const response = await getRolePermissions(roleId);
      if (response.data) {
        // Handle both array and object with permissions property
        const permissions = Array.isArray(response.data) 
          ? response.data 
          : (response.data.permissions || []);
        setViewRolePermissions(permissions);
        const successMsg =
          response.message ||
          `Loaded ${permissions.length} permissions for ${selectedRoleForView} role`;
        setMessage(successMsg);
        setMessageType("success");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to load role permissions";
      setMessage(errorMsg);
      setMessageType("error");
      toast.error(errorMsg);
      setViewRolePermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGetRolePermissions = async () => {
    setLoading(true);
    setMessage("");
    setMessageType(null);
    try {
      const roleId = String(ROLE_ID_MAP[selectedRoleForAssign]);
      const response = await getRolePermissions(roleId);
      if (response.data) {
        // Handle both array and object with permissions property
        const permissions = Array.isArray(response.data) 
          ? response.data 
          : (response.data.permissions || []);
        setRolePermissions(permissions);
        // Don't pre-select current permissions - only select NEW ones
        setSelectedPermissions([]);
        const successMsg =
          response.message ||
          `Loaded ${permissions.length} permissions for ${selectedRoleForAssign} role`;
        setMessage(successMsg);
        setMessageType("success");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to load role permissions";
      setMessage(errorMsg);
      setMessageType("error");
      toast.error(errorMsg);
      setRolePermissions([]);
      setSelectedPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignPermissions = async () => {
    setLoading(true);
    setMessage("");
    setMessageType(null);
    try {
      const roleId = String(ROLE_ID_MAP[selectedRoleForAssign]);
      const response = await assignRolePermissions(roleId, {
        permissionIds: selectedPermissions,
      });
      const successMsg =
        response.message ||
        `Successfully assigned ${selectedPermissions.length} permissions to ${selectedRoleForAssign}`;
      setMessage(successMsg);
      setMessageType("success");
      toast.success("Permissions assigned successfully");
      // Reload the permissions for this role
      handleGetRolePermissions();
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to assign permissions";
      setMessage(errorMsg);
      setMessageType("error");
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionId: string | number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleDeletePermission = async (permissionName: string) => {
    setLoading(true);
    setMessage("");
    setMessageType(null);
    try {
      const roleId = String(ROLE_ID_MAP[selectedRoleForView]);
      const response = await deleteRolePermision(roleId, permissionName);
      const successMsg =
        response.message || `Successfully deleted permission: ${permissionName}`;
      setMessage(successMsg);
      setMessageType("success");
      toast.success(successMsg);
      // Reload the permissions
      handleGetViewRolePermissions();
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to delete permission";
      setMessage(errorMsg);
      setMessageType("error");
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Lock className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Permission Management
          </h1>
        </div>
        <p className="text-gray-600 ml-14">
          Manage admin roles permissions and gán permission cho role
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab("get-permissions");
            setMessage("");
            setMessageType(null);
          }}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "get-permissions"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Get All Permissions
        </button>
        <button
          onClick={() => {
            setActiveTab("view-role-permissions");
            setMessage("");
            setMessageType(null);
          }}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "view-role-permissions"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          View Role Permissions
        </button>
        <button
          onClick={() => {
            setActiveTab("assign-permissions");
            setMessage("");
            setMessageType(null);
          }}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "assign-permissions"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Assign Permissions to Role
        </button>
      </div>

      {/* Message Display */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg border-l-4 font-medium animate-in fade-in duration-300 ${
            messageType === "success"
              ? "bg-green-50 border-green-500 text-green-700"
              : messageType === "error"
                ? "bg-red-50 border-red-500 text-red-700"
                : "bg-blue-50 border-blue-500 text-blue-700"
          }`}
        >
          {message}
        </div>
      )}

      {/* Get All Permissions Tab */}
      {activeTab === "get-permissions" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="mb-6">
            <button
              onClick={handleGetAllPermissions}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-medium hover:shadow-md"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Loading..." : "Load All Permissions"}
            </button>
          </div>

          {allPermissions.length > 0 && (
            <div className="animate-in fade-in duration-300">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                Available Permissions ({allPermissions.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allPermissions.map((permission) => (
                  <div
                    key={permission.id || permission.name}
                    className="p-4 border border-gray-200 rounded-lg hover:border-emerald-600 hover:shadow-md transition-all bg-gradient-to-br from-gray-50 to-white"
                  >
                    <p className="font-semibold text-gray-900 break-words">
                      {permission.name}
                    </p>
                    {permission.description && (
                      <p className="text-sm text-gray-600 mt-2 break-words">
                        {permission.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && allPermissions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Lock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No permissions loaded yet. Click the button above to load.</p>
            </div>
          )}
        </div>
      )}

      {/* View Role Permissions Tab */}
      {activeTab === "view-role-permissions" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Select Role
            </label>
            <select
              value={selectedRoleForView}
              onChange={(e) => setSelectedRoleForView(e.target.value)}
              className="w-full md:w-72 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent bg-white text-gray-900 font-medium hover:border-gray-400 transition-colors"
            >
              {AVAILABLE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Reload Button */}
          <div className="mb-6">
            <button
              onClick={handleGetViewRolePermissions}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-medium hover:shadow-md"
            >
              <Eye className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Loading..." : "View Permissions"}
            </button>
          </div>

          {/* Display Permissions */}
          {!loading && viewRolePermissions.length > 0 && (
            <div className="animate-in fade-in duration-300">
              <div className="mb-4 p-4 bg-emerald-50 border border-emerald-300 rounded-lg">
                <h4 className="font-semibold text-emerald-900 text-sm">
                  👤 {selectedRoleForView} Role Permissions
                </h4>
                <p className="text-sm text-emerald-700 mt-1">
                  Total: {viewRolePermissions.length} permission(s)
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {viewRolePermissions.map((permission) => (
                  <div
                    key={permission.id || permission.name}
                    className="p-4 border border-emerald-200 rounded-lg bg-gradient-to-br from-emerald-50 to-white hover:shadow-md transition-all group relative"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 bg-emerald-600 rounded-full"></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 break-words">
                          {permission.name}
                        </p>
                        {permission.description && (
                          <p className="text-sm text-gray-600 mt-2 break-words">
                            {permission.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeletePermission(permission.name)}
                        disabled={loading}
                        className="flex-shrink-0 ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete permission"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && viewRolePermissions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Lock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No permissions assigned to this role yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Assign Permissions Tab */}
      {activeTab === "assign-permissions" && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Select Role
            </label>
            <select
              value={selectedRoleForAssign}
              onChange={(e) => setSelectedRoleForAssign(e.target.value)}
              className="w-full md:w-72 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent bg-white text-gray-900 font-medium hover:border-gray-400 transition-colors"
            >
              {AVAILABLE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Current Permissions - Info Section */}
          {rolePermissions.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-300 rounded-lg animate-in fade-in duration-300">
              <h4 className="font-semibold text-blue-900 mb-3 text-sm">
                📋 Current Permissions for <span className="text-blue-700 bg-blue-100 px-2 py-1 rounded">{selectedRoleForAssign}</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {rolePermissions.map((p) => (
                  <span
                    key={p.id || p.name}
                    className="px-3 py-1 bg-blue-200 text-blue-900 rounded-full text-sm font-medium"
                  >
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Permission Checkboxes */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">
              Select NEW Permissions to Add
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Check only the new permissions you want to add. Already assigned permissions are disabled.
            </p>
            {allPermissions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in duration-300">
                {allPermissions.map((permission) => {
                  const isAlreadyAssigned = rolePermissions.some(
                    (p) => (p.id || p.name) === (permission.id || permission.name)
                  );
                  const isSelected = selectedPermissions.includes(
                    permission.id || permission.name
                  );

                  return (
                    <label
                      key={permission.id || permission.name}
                      className={`flex items-start gap-3 p-4 border rounded-lg transition-all ${
                        isAlreadyAssigned
                          ? "opacity-60 cursor-not-allowed bg-gray-100 border-gray-300"
                          : "cursor-pointer hover:border-emerald-600 hover:bg-emerald-50 bg-gradient-to-br from-gray-50 to-white border-gray-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          !isAlreadyAssigned && togglePermission(permission.id || permission.name)
                        }
                        disabled={isAlreadyAssigned}
                        className={`mt-1 w-5 h-5 rounded border-gray-300 focus:ring-2 cursor-pointer ${
                          isAlreadyAssigned
                            ? "bg-gray-300 cursor-not-allowed"
                            : "text-emerald-600 focus:ring-emerald-600"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900 break-words">
                            {permission.name}
                          </p>
                          {isAlreadyAssigned && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded whitespace-nowrap">
                              Already assigned
                            </span>
                          )}
                        </div>
                        {permission.description && (
                          <p className={`text-sm break-words ${
                            isAlreadyAssigned ? "text-gray-500" : "text-gray-600"
                          }`}>
                            {permission.description}
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Lock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>
                  Load permissions first by clicking "Load All Permissions" tab.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleGetRolePermissions}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all font-medium hover:shadow-md"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Reload
            </button>
            <button
              onClick={handleAssignPermissions}
              disabled={loading || selectedPermissions.length === 0}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-medium hover:shadow-md"
            >
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : "Save Permissions"}
            </button>
          </div>

          {/* Selected Count */}
          {allPermissions.length > 0 && (
            <div className="mt-4 text-sm text-gray-600 font-medium">
              <div>✓ {selectedPermissions.length} new permission(s) selected</div>
              <div className="text-xs text-gray-500 mt-1">
                Total after saving: {rolePermissions.length + selectedPermissions.length} permission(s)
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
