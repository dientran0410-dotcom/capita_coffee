import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getRequestHistory } from "@/services/warehouseService";
import "@/assets/css/warehouseRequest.css";

export default function RequestHistoryPage() {
  const [data, setData] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");
  const navigate = useNavigate();

  useEffect(() => {
    getRequestHistory().then((res) => {
      setData(res.data?.content || []);
    });
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(r => filter === "ALL" || r.actionType === filter);
  }, [data, filter]);

  return (
    <div className="request-page-wrapper">
      <div className="container-max">
        <div className="top-nav-bar" style={{ marginBottom: '20px' }}>
          <button className="btn-back-link" onClick={() => navigate("/admin/warehouse")}>
            ← Back to Dashboard
          </button>
        </div>

        <div className="page-header">
          <h1>Transaction History</h1>
        </div>

        <div className="filter-group">
          {["ALL", "IMPORT", "EXPORT"].map(t => (
            <button 
              key={t}
              className={`filter-btn ${filter === t ? "active" : ""}`}
              onClick={() => setFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="table-card">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>No.</th>
                <th>Item Name</th>
                <th>Quantity</th>
                <th>Action Type</th>
                <th>Completed Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((r, index) => (
                  <tr key={r.id}>
                    <td>{index + 1}</td>
                    <td><strong>{r.ingredient}</strong></td>
                    <td>{r.quantity}</td>
                    <td><span className={`badge-type ${r.actionType?.toLowerCase()}`}>{r.actionType}</span></td>
                    <td style={{ color: '#8d7a71' }}>{r.completedDate || "—"}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>No history found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}