import type { LoyaltyRuleResponse } from "../../../types/Loyalty";
import { EVENT_TYPE_COLORS, EVENT_TYPE_ICONS } from "./constants";
import { loyaltyStyles as styles } from "./styles";

interface RuleTabProps {
  rules: LoyaltyRuleResponse[];
  loading: boolean;
  error: string | null;
  getFranchiseLabel: (franchiseId?: string | number | null) => string;
  onEdit: (rule: LoyaltyRuleResponse) => void;
  onDelete: (rule: LoyaltyRuleResponse) => void;
}

export default function RuleTab({
  rules,
  loading,
  error,
  getFranchiseLabel,
  onEdit,
  onDelete,
}: RuleTabProps) {
  if (error) return <div style={styles.errorBox}>{error}</div>;
  if (loading) return <div style={styles.empty}>Đang tải...</div>;

  if (rules.length === 0) {
    return (
      <div style={styles.empty}>
        <span style={{ fontSize: 48 }}>Rules</span>
        <p>Chưa có rule nào</p>
      </div>
    );
  }

  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Tên Rule</th>
            <th style={styles.th}>Store</th>
            <th style={styles.th}>Event Type</th>
            <th style={styles.th}>Multiplier</th>
            <th style={{ ...styles.th, textAlign: "center" }}>Fixed Points</th>
            <th style={{ ...styles.th, textAlign: "center" }}>Expiry</th>
            <th style={styles.th}>Trạng thái</th>
            <th style={styles.th}>Thời gian</th>
            <th style={{ ...styles.th, textAlign: "right" }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => {
            const eventColor = EVENT_TYPE_COLORS[rule.eventType];

            return (
              <tr key={rule.id} style={styles.tr}>
                <td style={{ ...styles.td, color: "#009661", fontWeight: 700 }}>{rule.name || "-"}</td>
                <td style={styles.td}>{getFranchiseLabel(rule.franchiseId)}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.eventBadge, background: eventColor.bg, color: eventColor.color }}>
                    {EVENT_TYPE_ICONS[rule.eventType]} {rule.eventType}
                  </span>
                </td>
                <td style={{ ...styles.td, color: "#009661", fontWeight: 700 }}>x{rule.pointMultiplier ?? "-"}</td>
                <td style={{ ...styles.td, textAlign: "center", fontWeight: 600 }}>{rule.fixedPoints ?? 0} pts</td>
                <td style={{ ...styles.td, textAlign: "center", color: "#6b7280" }}>
                  {rule.eventType === "REDEMPTION" ? (rule.expiryDays ?? "-") : "-"}
                </td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      background: rule.isActive ? "#dcfce7" : "#f3f4f6",
                      color: rule.isActive ? "#009661" : "#6b7280",
                    }}
                  >
                    {rule.isActive ? "Hoạt động" : "Tắt"}
                  </span>
                </td>
                <td style={{ ...styles.td, color: "#6b7280", fontSize: 13 }}>
                  {rule.startDate ? new Date(rule.startDate).toLocaleDateString("vi-VN") : "-"}
                  {" -> "}
                  {rule.endDate ? new Date(rule.endDate).toLocaleDateString("vi-VN") : "-"}
                </td>
                <td style={{ ...styles.td, textAlign: "right" }}>
                  <button style={styles.btnEdit} onClick={() => onEdit(rule)}>Sửa</button>
                  <button style={{ ...styles.btnDelete, marginLeft: 8 }} onClick={() => onDelete(rule)}>Xóa</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
