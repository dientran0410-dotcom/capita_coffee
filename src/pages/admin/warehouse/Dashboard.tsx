import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getWarehouses,
  getLocations,
} from "../../../services/warehouseService";
import "@/assets/css/warehouseCss.css";

type Warehouse = {
  id: number;
  name: string;
  status: string;
  address: string;
  capacity?: number;
  usedCapacity?: number;
  locationId?: number;
  location?: any;
};

type Location = {
  id: number | string;
  name: string;
};

const WarehouseDashboard = () => {
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [expanded, setExpanded] = useState<number | string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [whRes, locRes] = await Promise.all([
        getWarehouses(),
        getLocations(),
      ]);

      setWarehouses(whRes.data?.data || whRes.data || []);
      setLocations(locRes.data?.data || locRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getLocationId = (w: Warehouse) => {
    if (w.locationId) return w.locationId;
    if (w.location?.id) return w.location.id;
    if (typeof w.location === "number") return w.location;
    return null;
  };

  const toggle = (id: number | string) => {
    setExpanded(expanded === id ? null : id);
  };

  const totalWarehouses = warehouses.length;
  const totalLocations = locations.length;

  const totalCapacity = warehouses.reduce(
    (s, w) => s + (w.capacity || 0),
    0
  );

  const totalUsed = warehouses.reduce(
    (s, w) => s + (w.usedCapacity || 0),
    0
  );

  const usage =
    totalCapacity === 0 ? 0 : Math.round((totalUsed / totalCapacity) * 100);

  return (
    <div className="warehouse-dashboard">
      <h2 className="page-title">Warehouse & Location Overview</h2>

      {/* ===== TABS ===== */}
      <div className="tabs">
        <button onClick={() => navigate("/admin/warehouse/list")}>
          Warehouses
        </button>
        
        <button
          className="active"
          onClick={() => navigate("/admin/warehouse/location")}
        >
          Locations
        </button>
      </div>

      {/* ===== STATS ===== */}
      <div className="stats">
        <div className="card">
          <p>TOTAL LOCATIONS</p>
          <h3>{totalLocations}</h3>
        </div>
        <div className="card">
          <p>TOTAL WAREHOUSES</p>
          <h3>{totalWarehouses}</h3>
        </div>
        <div className="card">
          <p>TOTAL CAPACITY</p>
          <h3>{totalCapacity.toLocaleString()}</h3>
        </div>
        <div className="card">
          <p>USAGE</p>
          <h3>{usage}%</h3>
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <div className="table-container">
        <div className="table-title">
          <span>Warehouses per Location</span>
          <span className="summary">
            {totalLocations} locations · {totalWarehouses} warehouses
          </span>
        </div>

        {locations.map((loc) => {
          const whs = warehouses.filter(
            (w) => String(getLocationId(w)) == String(loc.id)
          );

          return (
            <div key={loc.id} className="location-group">
              {/* HEADER */}
              <div
                className="location-header"
                onClick={() => toggle(loc.id)}
              >
                <span>{loc.name}</span>

                <div className="right">
                  <div className="warehouse-count">
                    <span className="label">WAREHOUSES</span>
                    <span className="number">{whs.length}</span>
                  </div>

                  <span className="arrow">
                    {expanded === loc.id ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* EXPAND */}
              {expanded === loc.id && (
                <div className="expand-box">
                  <div className="table-head">
                    <div>WAREHOUSE</div>
                    <div>STATUS</div>
                    <div>ADDRESS</div>
                  </div>

                  {whs.map((w) => (
                    <div key={w.id} className="row">
                      <div>{w.name}</div>

                      <div
                        className={
                          w.status === "ACTIVE"
                            ? "status active"
                            : "status inactive"
                        }
                      >
                        {w.status}
                      </div>

                      <div>{w.address}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WarehouseDashboard;