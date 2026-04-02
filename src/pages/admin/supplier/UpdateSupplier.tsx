import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Save, Loader, Activity } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { backendApiUrl } from "./apiBase";

async function getSupplierById(id) {
  const res = await fetch(backendApiUrl(`/api/suppliers/${id}`));
  if (!res.ok) throw new Error('Unable to fetch supplier details.');
  const data = await res.json();
  return data.result;
}

async function updateSupplier(id, dataBody, user) {
  const res = await fetch(backendApiUrl(`/api/suppliers/${id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', USER: user },
    body: JSON.stringify(dataBody),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Update failed.');
  return data.result;
}

export default function UpdateSupplier() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    contactEmail: "",
    phone: "",
    region: "",
    taxCode: "",
    address: "",
    materialType: "",
    status: "",
  });

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const data = await getSupplierById(id);
        setFormData({
          name: data.name || "",
          contactEmail: data.contactEmail || "",
          phone: data.phone || "",
          region: data.region || "",
          taxCode: data.taxCode || "",
          address: data.address || "",
          materialType: data.materialType || "",
          status: data.status || "",
        });
      } catch (err) {
        setErrorMsg("Failed to load supplier data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSupplier();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      await updateSupplier(id, { ...formData, updatedBy: user?.username || "admin" });
      setSuccessMsg("Supplier updated successfully!");
      setTimeout(() => navigate(`/admin/suppliers/${id}`), 1500);
    } catch (err) {
      setErrorMsg(err.message || "Failed to update supplier.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-500">
        <Loader className="h-8 w-8 animate-spin mb-2" />
        <p>Loading supplier data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/admin/suppliers/${id}`} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Update Supplier</h1>
          <p className="mt-1 text-sm text-gray-600">Edit supplier information</p>
        </div>
      </div>

      {successMsg && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMsg}</div>
      )}
      {errorMsg && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</div>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="space-y-8 p-6 sm:p-8">
          <div>
            <h3 className="mb-4 border-b pb-2 text-lg font-medium">Basic Information</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium">Company Name</label>
                <input name="name" value={formData.name} onChange={handleChange} required disabled={isSubmitting} className="mt-1 w-full rounded-lg border px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium">Email</label>
                <input name="contactEmail" type="email" value={formData.contactEmail} onChange={handleChange} required disabled={isSubmitting} className="mt-1 w-full rounded-lg border px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg_gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium">Phone</label>
                <input name="phone" value={formData.phone} onChange={handleChange} disabled={isSubmitting} className="mt-1 w-full rounded-lg border px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 border-b pb-2 text-lg font-medium">Business Info</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Region</label>
                <select name="region" value={formData.region} onChange={handleChange} disabled={isSubmitting} className="mt-1 w-full rounded-lg border px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50">
                  <option value="North">North</option>
                  <option value="South">South</option>
                  <option value="East">East</option>
                  <option value="West">West</option>
                  <option value="Global">Global</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Material Type</label>
                <input name="materialType" value={formData.materialType} onChange={handleChange} disabled={isSubmitting} className="mt-1 w-full rounded-lg border px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-medium">Tax Code</label>
                <input name="taxCode" value={formData.taxCode} readOnly className="mt-1 w-full rounded-lg border px-4 py-2.5 bg-gray-100 cursor-not-allowed text-gray-600" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium">Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows={3} disabled={isSubmitting} className="mt-1 w-full rounded-lg border px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-600">Account Status</h3>
            <div className="relative max-w-sm">
              <Activity className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={formData.status}
                readOnly
                className={`w-full rounded-lg border px-4 py-2.5 pl-10 text-sm font-medium bg-gray-50 cursor-not-allowed ${formData.status === "APPROVED" ? "border-green-300 text-green-700" : formData.status === "PENDING" ? "border-amber-300 text-amber-700" : "border-red-300 text-red-700"}`}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">
          <button type="button" disabled={isSubmitting} onClick={() => navigate(`/admin/suppliers/${id}`)} className="rounded-lg border bg-white px-5 py-2.5 text-sm hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
