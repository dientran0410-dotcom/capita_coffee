import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "@/assets/css/warehouseLocation.css";
import {
  getLocations,
  getWarehouses,
  createLocation,
  updateLocation,
  deleteLocation,
} from "@/services/warehouseService";

const Location = () => {
  const [locations, setLocations] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ACTIVE");
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [viewing, setViewing] = useState<any>(null);

  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", status: "ACTIVE" });

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch both APIs simultaneously to ensure data consistency
      const [locRes, whRes] = await Promise.all([
        getLocations(),
        getWarehouses(),
      ]);

      const locData = locRes.data?.data || locRes.data || [];
      const whData = whRes.data?.data || whRes.data || [];

      setLocations(locData);
      setWarehouses(whData);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper function to extract Location ID from Warehouse object (Dashboard Logic)
  const getLocIdFromWh = (w: any) => {
    if (w.locationId) return w.locationId;
    if (w.location?.id) return w.location.id;
    if (typeof w.location === "number") return w.location;
    return null;
  };

  const handleOpenAdd = () => {
    setEditing(null);
    setForm({ name: "", status: "ACTIVE" });
    setShowModal(true);
  };

  const handleEdit = (loc: any) => {
    setEditing(loc.id);
    setForm({ name: loc.name, status: loc.status });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return alert("Location name is required");
    try {
      if (editing) {
        await updateLocation(editing, form);
      } else {
        // Default status is ACTIVE for new records
        await createLocation({ ...form, status: "ACTIVE" });
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      const nameError =
        err?.raw?.response?.data?.errors?.name?.[0] ||
        err?.message ||
        "Operation failed";
      alert(nameError);
      // alert("Error: " + JSON.stringify(err.errors.name || "Operation failed"));
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this location?")) {
      try {
        await deleteLocation(id);
        loadData();
      } catch (err) {
        alert(
          "Cannot delete. This location might be linked to existing warehouses.",
        );
      }
    }
  };

  const filteredData = locations.filter((loc) => {
    const matchesSearch = loc.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "ALL" ? true : loc.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="location-page">
      <div className="loc-header">
        <div className="header-left">
          <h1>Locations Management</h1>
          <span className="count-text">
            {filteredData.length} locations matching
          </span>
        </div>
        <div className="header-actions">
          <button
            className="btn-outline"
            onClick={() => navigate("/admin/warehouse")}
          >
            <span>📊</span> Dashboard
          </button>
          <button
            className="btn-outline"
            onClick={() => navigate("/admin/warehouse/list")}
          >
            <span>🏠</span> Warehouses
          </button>
          <button className="btn-add" onClick={handleOpenAdd}>
            + Add Location
          </button>
        </div>
      </div>

      <div className="loc-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          {["ACTIVE", "MAINTENANCE", "INACTIVE", "ALL"].map((s) => (
            <button
              key={s}
              className={`filter-btn ${filterStatus === s ? "active" : ""}`}
              onClick={() => setFilterStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        <table className="loc-table">
          <thead>
            <tr>
              <th>#</th>
              <th>LOCATION NAME</th>
              <th>STATUS</th>
              <th>WAREHOUSE COUNT</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center">
                  Loading data...
                </td>
              </tr>
            ) : (
              filteredData.map((loc, i) => {
                // Counting warehouses based on location ID
                const count = warehouses.filter(
                  (w) => String(getLocIdFromWh(w)) === String(loc.id),
                ).length;

                return (
                  <tr key={loc.id}>
                    <td>{i + 1}</td>
                    <td className="font-bold">{loc.name}</td>
                    <td>
                      <span
                        className={`status-badge ${loc.status.toLowerCase()}`}
                      >
                        {loc.status}
                      </span>
                    </td>
                    <td className="count-col">{count} units</td>
                    <td className="actions-cell">
                      <button
                        className="act-btn view"
                        onClick={() => {
                          setViewing({ ...loc, count });
                          setShowViewModal(true);
                        }}
                      >
                        View
                      </button>
                      <button
                        className="act-btn edit"
                        onClick={() => handleEdit(loc)}
                      >
                        Edit
                      </button>
                      <button
                        className="act-btn delete"
                        onClick={() => handleDelete(loc.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-head">
              <h2>{editing ? "Edit Location" : "Create New Location"}</h2>
              <button className="close-x" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label>LOCATION NAME</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter location name"
                />
              </div>
              {editing && (
                <div className="input-group">
                  <label>STATUS</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              )}
            </div>
            <div className="modal-foot">
              <button
                className="btn-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button className="btn-save" onClick={handleSave}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && viewing && (
        <div className="modal-overlay">
          <div className="modal-box view-modal">
            <div className="modal-head">
              <h2>Location Details</h2>
              <button
                className="close-x"
                onClick={() => setShowViewModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="view-grid">
                <div className="view-item">
                  <label>ID</label>
                  <p>#{viewing.id}</p>
                </div>
                <div className="view-item">
                  <label>NAME</label>
                  <p>{viewing.name}</p>
                </div>
                <div className="view-item">
                  <label>STATUS</label>
                  <p>{viewing.status}</p>
                </div>
                <div className="view-item">
                  <label>WAREHOUSES</label>
                  <p className="count-col">{viewing.count} units</p>
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button
                className="btn-save"
                onClick={() => setShowViewModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Location;
