import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Mail, Phone, MapPin, FileText, Factory, Save, Loader } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import { showSuccessToast } from "@/utils/toast";

async function createSupplier(dataBody, user) {
  const res = await fetch('/api/suppliers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', USER: user },
    body: JSON.stringify(dataBody),
  });
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || 'Create failed');
    error.errors = data.result;
    throw error;
  }
  return data.result;
}

export default function CreateSupplier() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [formData, setFormData] = useState({
    name: "",
    contactEmail: "",
    phone: "",
    region: "ASIA",
    taxCode: "",
    address: "",
    materialType: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    try {
      await createSupplier({ ...formData, createdBy: user?.username || "admin" });
      setSuccessMessage("Supplier created successfully!");
      setTimeout(() => navigate("/admin/suppliers"), 1500);
    } catch (error) {
      if (error.fieldErrors) setFieldErrors(error.fieldErrors);
      else alert(error.message || "Failed to create supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (successMessage) {
      showSuccessToast(successMessage);
    }
  }, [successMessage]);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Supplier</h1>
          <p className="mt-1 text-sm text-gray-600">Enter the details of the new supply chain partner.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="space-y-8 p-6 sm:p-8">
          <div>
            <h3 className="mb-4 border-b border-gray-100 pb-2 text-lg font-medium text-gray-900">Basic Information</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Company Name *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input type="text" name="name" required value={formData.name} onChange={handleChange} placeholder="e.g. Fresh Farms Inc." className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                {fieldErrors.name && <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input type="email" name="contactEmail" required value={formData.contactEmail} onChange={handleChange} placeholder="contact@company.com" className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                {fieldErrors.contactEmail && <p className="mt-1 text-xs text-red-500">{fieldErrors.contactEmail}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Phone Number *</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+1 (555) 000-0000" className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                {fieldErrors.phone && <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Supplier Type *</label>
                <div className="relative">
                  <Factory className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input type="text" name="materialType" required value={formData.materialType} onChange={handleChange} className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-4 border-b border-gray-100 pb-2 text-lg font-medium text-gray-900">Location & Legal</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Operating Region</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <select name="region" value={formData.region} onChange={handleChange} className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-8 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option value="ASIA">Asia</option>
                    <option value="EUROPE">Europe</option>
                    <option value="NORTH_AMERICA">North America</option>
                    <option value="SOUTH_AMERICA">South America</option>
                    <option value="AFRICA">Africa</option>
                    <option value="OCEANIA">Oceania</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Tax ID / Registration No. *</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input type="text" name="taxCode" value={formData.taxCode} onChange={handleChange} required placeholder="e.g. 12-3456789" className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                {fieldErrors.taxCode && <p className="mt-1 text-xs text-red-500">{fieldErrors.taxCode}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Full Address *</label>
                <textarea name="address" rows="3" value={formData.address} onChange={handleChange} required placeholder="Enter complete address..." className="w-full rounded-lg border border-gray-300 p-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 border-t border-gray-200 bg-gray-50/80 px-6 py-4">
          {successMessage && (
            <p className="w-full rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">{successMessage}</p>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => navigate("/admin/suppliers")} disabled={isSubmitting} className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSubmitting ? "Saving..." : "Save Supplier"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
