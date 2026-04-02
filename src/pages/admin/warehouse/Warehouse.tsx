import React, { useEffect, useState } from "react";
import {
  getWarehouses,
  createWarehouse,
  updateWarehouse,
  getLocations,
} from "@/services/warehouseService";
import { useNavigate } from "react-router-dom";
import "@/assets/css/warehousePage.css";

const Warehouse = () => {
  const [data, setData] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    address: "",
    locationId: "",
    status: "ACTIVE",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resW, resL] = await Promise.all([getWarehouses(), getLocations()]);
      setData(resW?.data || []);
      setLocations(resL?.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter only ACTIVE locations for the dropdown
  const activeLocations = locations.filter((loc) => loc.status === "ACTIVE");

  const handleOpenAdd = () => {
    setEditing(null);
    setForm({ name: "", address: "", locationId: "", status: "ACTIVE" });
    setShowModal(true);
  };

  const handleEdit = (w: any) => {
    setEditing(w.id);
    setForm({
      name: w.name,
      address: w.address,
      status: w.status,
      locationId: w.location?.id || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (form.name.length < 3)
      return alert("Warehouse Name must be at least 3 characters!");
    if (form.address.length < 5)
      return alert("Address must be at least 5 characters!");
    if (!form.locationId) return alert("Please select a location");

    try {
      if (editing) {
        await updateWarehouse(editing, form);
      } else {
        await createWarehouse(form);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      const errorsObj = err?.raw?.response?.data?.errors;

      const allErrors = Object.values(errorsObj || {})
        .flatMap((v: any) => (Array.isArray(v) ? v : [v]))
        .filter((v: any) => typeof v === "string" && v.trim().length > 0);

      const message =
        allErrors.length > 0
          ? allErrors.join("\n")
          : err?.message || "Operation failed";

      alert(message);
    }
  };

  const handleToggle = async (w: any) => {
    try {
      const updateData = {
        name: w.name,
        address: w.address,
        locationId: w.location?.id,
        status: w.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      };
      await updateWarehouse(w.id, updateData);
      fetchData();
    } catch (err: any) {
      const serverError = err.response?.data;
      alert("Error: " + (serverError?.message || "Toggle failed"));
    }
  };

  const filteredData = data.filter((w) => {
    const matchesSearch = w.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || w.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="warehouse-page">
      <div className="wp-header">
        <h1>Warehouses Management</h1>
        <div className="header-actions">
          <button
            className="btn-sec"
            onClick={() => navigate("/admin/warehouse")}
          >
            Dashboard
          </button>
          <button
            className="btn-sec"
            onClick={() => navigate("/admin/warehouse/location")}
          >
            Locations
          </button>
          <button className="btn-pri" onClick={handleOpenAdd}>
            + Add Warehouse
          </button>
        </div>
      </div>

      <div className="wp-controls">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          {["ALL", "ACTIVE", "INACTIVE"].map((s) => (
            <button
              key={s}
              className={`tab ${filterStatus === s ? "active" : ""}`}
              onClick={() => setFilterStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="wp-table-wrapper">
        <table className="wp-table">
          <thead>
            <tr>
              <th>#</th>
              <th>NAME</th>
              <th>LOCATION</th>
              <th>ADDRESS</th>
              <th>STATUS</th>
              <th style={{ textAlign: "center" }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>Loading...</td>
              </tr>
            ) : (
              filteredData.map((w, i) => (
                <tr key={w.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{w.name}</td>
                  <td>{w.location?.name || "N/A"}</td>
                  <td>{w.address}</td>
                  <td>
                    <span className={`badge ${w.status.toLowerCase()}`}>
                      {w.status}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      {/* Changed from Items to View Items */}
                      <button
                        className="text-btn view"
                        onClick={() =>
                          navigate(`/admin/warehouse/item?warehouseId=${w.id}`)
                        }
                      >
                        View Items
                      </button>
                      <button
                        className="text-btn edit"
                        onClick={() => handleEdit(w)}
                      >
                        Edit
                      </button>
                      <button
                        className={`text-btn toggle ${w.status === "ACTIVE" ? "deactivate" : "activate"}`}
                        onClick={() => handleToggle(w)}
                      >
                        {w.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header-row">
              <h3>{editing ? "Edit Warehouse" : "Add Warehouse"}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>

            <div className="form-group">
              <label>Name</label>
              <input
                className="modal-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Warehouse name..."
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <select
                className="modal-input"
                value={form.locationId}
                onChange={(e) =>
                  setForm({ ...form, locationId: e.target.value })
                }
              >
                <option value="">-- Select Location --</option>
                {activeLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea
                className="modal-input"
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Full address..."
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                className="modal-input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-sec" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn-pri" onClick={handleSave}>
                {editing ? "Save Changes" : "Create Warehouse"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Warehouse;
