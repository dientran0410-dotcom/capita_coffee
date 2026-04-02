import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, Clock, PlusCircle, Edit3, CheckCircle, AlertCircle } from "lucide-react";
import { backendApiUrl } from "./apiBase";

async function getSupplierAuditLogs(supplierId, page = 0, size = 10) {
  const res = await fetch(backendApiUrl(`/api/suppliers/${supplierId}/audit-logs?page=${page}&size=${size}`));
  if (!res.ok) throw new Error('Unable to fetch audit logs.');
  const data = await res.json();
  return data.result;
}

export default function SupplierAuditLogs() {
  const { id } = useParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supplierName, setSupplierName] = useState(id);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getSupplierAuditLogs(id);
        setLogs(data || []);
        if (data?.[0]?.supplierName) setSupplierName(data[0].supplierName);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [id]);

  const renderAuditData = (dataString, type) => {
    if (!dataString) {
      return <div className={`p-3 rounded-lg text-xs text-gray-400 ${type === "old" ? "bg-red-50" : "bg-green-50"}`}>No data</div>;
    }
    try {
      const data = JSON.parse(dataString);
      const fields = [
        { key: "name", label: "Name" },
        { key: "contactEmail", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "region", label: "Region" },
        { key: "taxCode", label: "Tax Code" },
        { key: "address", label: "Address" },
        { key: "materialType", label: "Material Type" },
        { key: "status", label: "Status" },
        { key: "rejectionReason", label: "Rejection Reason" },
        { key: "rating", label: "Rating" },
      ].filter((f) => data[f.key] !== undefined && data[f.key] !== null);

      return (
        <div className={`p-3 rounded-lg text-xs ${type === "old" ? "bg-red-50" : "bg-green-50"}`}>
          <ul className="space-y-1">
            {fields.map((field) => (
              <li key={field.key} className="flex justify-between border-b border-black/5 pb-1">
                <span className="font-bold opacity-70">{field.label}:</span>
                <span className={field.key === "rejectionReason" ? "text-red-600 font-semibold" : ""}>
                  {String(data[field.key])}
                </span>
              </li>
            ))}
          </ul>
        </div>
      );
    } catch {
      return (
        <div className={`p-3 rounded-lg text-xs whitespace-pre-wrap ${type === "old" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {dataString}
        </div>
      );
    }
  };

  const getActionStyle = (action) => {
    switch (action) {
      case "CREATE": return { bg: "bg-blue-100 text-blue-700", icon: <PlusCircle className="w-3 h-3" /> };
      case "UPDATE": return { bg: "bg-amber-100 text-amber-700", icon: <Edit3 className="w-3 h-3" /> };
      case "APPROVE": return { bg: "bg-green-100 text-green-700", icon: <CheckCircle className="w-3 h-3" /> };
      case "REJECT": return { bg: "bg-red-100 text-red-700", icon: <AlertCircle className="w-3 h-3" /> };
      default: return { bg: "bg-red-100 text-red-700", icon: <AlertCircle className="w-3 h-3" /> };
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/admin/suppliers/${id}`} className="p-2 bg-white border rounded-lg hover:bg-gray-50 shadow-sm transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Audit History</h1>
          <p className="text-sm text-gray-500">Tracking all changes for: {supplierName}</p>
        </div>
      </div>

      <div className="relative border-l-2 border-gray-200 ml-4 space-y-8 pb-10">
        {loading ? (
          <div className="pl-8 text-gray-500">Loading audit history...</div>
        ) : logs.length === 0 ? (
          <div className="pl-8 text-gray-500">No history found for this supplier.</div>
        ) : (
          logs.map((log) => {
            const style = getActionStyle(log.action);
            return (
              <div key={log.id} className="relative pl-8">
                <span className={`absolute left-[-9px] top-1 h-4 w-4 rounded-full border-4 border-white shadow-sm ${style.bg}`} />
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50/50 px-5 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${style.bg}`}>
                        {style.icon} {log.action}
                      </span>
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                        <User className="h-4 w-4 text-gray-400" /> {log.performedBy}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Clock className="h-4 w-4" /> {new Date(log.performedAt).toLocaleString("en-GB")}
                    </span>
                  </div>
                  <div className="p-5 grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Previous State</p>
                      {renderAuditData(log.oldData, "old")}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Current State</p>
                      {renderAuditData(log.newData, "new")}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
