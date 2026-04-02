import { useState } from "react";
import {
  changeUserRole,
  createAccount,
  deactivateUser,
  deleteUser,
  getCurrentUser,
} from "../../services/UserManagementService";
import type { CurrentUserProfile, CreateAccountRequest } from "../../types/user";

const DEFAULT_CREATE_PAYLOAD: CreateAccountRequest = {
  email: "",
  name: "",
  address: "",
  phone: "",
  franchiseId: "",
  roleName: "CUSTOMER",
};

export default function UserManagement() {
  const [createPayload, setCreatePayload] = useState<CreateAccountRequest>(
    DEFAULT_CREATE_PAYLOAD
  );
  const [userId, setUserId] = useState("");
  const [roleName, setRoleName] = useState("STAFF");
  const [currentUser, setCurrentUser] = useState<CurrentUserProfile | null>(null);
  const [resultMessage, setResultMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const setMessage = (message: string) => {
    setResultMessage(message);
  };

  const handleCreateAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      const response = await createAccount(createPayload);
      setMessage(response.message || "Create account success.");
      setCreatePayload(DEFAULT_CREATE_PAYLOAD);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Create account failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeRole = async () => {
    if (!userId.trim()) {
      setMessage("Please input user ID before changing role.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      const response = await changeUserRole(userId.trim(), roleName);
      setMessage(response.message || "Change role success.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Change role failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateUser = async () => {
    if (!userId.trim()) {
      setMessage("Please input user ID before deactivating.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      const response = await deactivateUser(userId.trim());
      setMessage(response.message || "Deactivate user success.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Deactivate user failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userId.trim()) {
      setMessage("Please input user ID before deleting.");
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      const response = await deleteUser(userId.trim());
      setMessage(response.message || "Delete user success.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Delete user failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadCurrentUser = async () => {
    setSubmitting(true);
    setMessage("");
    try {
      const response = await getCurrentUser();
      const profile = response.data ?? response.result ?? null;
      setCurrentUser(profile);
      setMessage(response.message || "Fetch current user success.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Fetch current user failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Customer Management → User Management</h1>
        <p className="mt-1 text-gray-600">
          Manage auth-service user APIs: create account, change role, deactivate, delete, and get current user.
        </p>
      </div>

      {resultMessage ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {resultMessage}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={handleCreateAccount}
          className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900">Create Account</h2>
          <input
            type="email"
            required
            placeholder="Email"
            value={createPayload.email}
            onChange={(event) =>
              setCreatePayload((current) => ({ ...current, email: event.target.value }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            required
            placeholder="Name"
            value={createPayload.name}
            onChange={(event) =>
              setCreatePayload((current) => ({ ...current, name: event.target.value }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            required
            placeholder="Phone"
            value={createPayload.phone}
            onChange={(event) =>
              setCreatePayload((current) => ({ ...current, phone: event.target.value }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Address"
            value={createPayload.address}
            onChange={(event) =>
              setCreatePayload((current) => ({ ...current, address: event.target.value }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Franchise ID"
            value={createPayload.franchiseId}
            onChange={(event) =>
              setCreatePayload((current) => ({
                ...current,
                franchiseId: event.target.value,
              }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={createPayload.roleName}
            onChange={(event) =>
              setCreatePayload((current) => ({ ...current, roleName: event.target.value }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="CUSTOMER">CUSTOMER</option>
            <option value="STAFF">STAFF</option>
            <option value="MANAGER">MANAGER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPPLIER">SUPPLIER</option>
            <option value="INVENTORY_MANAGEMENT">INVENTORY_MANAGEMENT</option>
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Processing..." : "Create Account"}
          </button>
        </form>

        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Manage Existing User</h2>
          <input
            type="text"
            placeholder="User ID"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={roleName}
            onChange={(event) => setRoleName(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="STAFF">STAFF</option>
            <option value="MANAGER">MANAGER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="CUSTOMER">CUSTOMER</option>
          </select>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleChangeRole}
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Change Role
            </button>
            <button
              type="button"
              onClick={handleDeactivateUser}
              disabled={submitting}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Deactivate
            </button>
            <button
              type="button"
              onClick={handleDeleteUser}
              disabled={submitting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Current User Profile</h2>
        <button
          type="button"
          onClick={handleLoadCurrentUser}
          disabled={submitting}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Loading..." : "Get Current User"}
        </button>
        <pre className="overflow-x-auto rounded-lg bg-gray-100 p-4 text-xs text-gray-700">
          {JSON.stringify(currentUser, null, 2)}
        </pre>
      </div>
    </div>
  );
}
