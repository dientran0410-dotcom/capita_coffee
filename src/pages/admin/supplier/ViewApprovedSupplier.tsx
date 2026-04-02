import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye } from "lucide-react";

async function getApprovedSuppliers(page = 0, size = 10) {
  const res = await fetch(`/api/suppliers/approved?page=${page}&size=${size}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Unable to fetch approved suppliers.');
  return data.result;
}

export default function ViewApprovedSupplier() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const loadApproved = async (pageNumber = 0) => {
    setLoading(true);
    try {
      const result = await getApprovedSuppliers(pageNumber, 10);
      setSuppliers(result?.content || []);
      setTotalPages(result?.totalPages || 0);
    } catch (err) {
      console.error(err);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadApproved(0); }, []);
  useEffect(() => { if (page > 0) loadApproved(page); }, [page]);

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approved Suppliers</h1>
        <p className="mt-1 text-sm text-gray-500">All active supply chain partners</p>
      </div>

      {loading ? (
        <div className="p-10 text-center text-gray-500">Loading...</div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full whitespace-nowrap">
                <thead className="bg-gray-50 text-sm font-semibold text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="px-5 py-3 text-left">Name</th>
                    <th className="px-5 py-3 text-left">Email</th>
                    <th className="px-5 py-3 text-left">Region</th>
                    <th className="px-5 py-3 text-left">Rating</th>
                    <th className="px-5 py-3 text-left">Updated</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {suppliers.length === 0 ? (
                    <tr><td colSpan="6" className="text-center py-8 text-gray-500">No approved suppliers found</td></tr>
                  ) : (
                    suppliers.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900">{s.name}</td>
                        <td className="px-5 py-3 text-gray-600">{s.contactEmail}</td>
                        <td className="px-5 py-3 text-gray-600">{s.region || "-"}</td>
                        <td className="px-5 py-3 text-gray-600">{s.rating}</td>
                        <td className="px-5 py-3 text-gray-600">{formatDateTime(s.updateAt)}</td>
                        <td className="px-5 py-3 text-right">
                          <button onClick={() => navigate(`/admin/suppliers/${s.id}`)} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                            <Eye className="h-4 w-4" /> Detail
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
              Previous
            </button>
            <span className="text-sm font-medium text-gray-600">Page {totalPages === 0 ? 0 : page + 1} / {totalPages}</span>
            <button disabled={page + 1 >= totalPages || totalPages === 0} onClick={() => setPage(page + 1)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
