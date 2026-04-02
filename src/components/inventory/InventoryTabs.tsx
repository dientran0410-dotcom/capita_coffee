import { useNavigate } from "react-router-dom";

type InventoryTabKey = "list" | "history";

type Props = {
  active: InventoryTabKey;
};

const InventoryTabs = ({ active }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="inventory-tabs">
      <button
        className={active === "list" ? "active" : ""}
        onClick={() => navigate("/admin/inventory")}
      >
        Ingredients
      </button>
      <button
        className={active === "history" ? "active" : ""}
        onClick={() => navigate("/admin/inventory/request-history")}
      >
        Logs
      </button>
    </div>
  );
};

export default InventoryTabs;
