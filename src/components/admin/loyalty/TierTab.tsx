import type { LoyaltyTierResponse } from "../../../types/Loyalty";
import { TIER_COLORS, TIER_POINTS } from "./constants";
import { loyaltyStyles as styles } from "./styles";

interface TierTabProps {
  tiers: LoyaltyTierResponse[];
  loading: boolean;
  error: string | null;
  getFranchiseLabel: (franchiseId?: string | number | null) => string;
  onEdit: (tier: LoyaltyTierResponse) => void;
  onDelete: (tier: LoyaltyTierResponse) => void;
}

export default function TierTab({
  tiers,
  loading,
  error,
  getFranchiseLabel,
  onEdit,
  onDelete,
}: TierTabProps) {
  if (error) return <div style={styles.errorBox}>{error}</div>;
  if (loading) return <div style={styles.empty}>Đang tải...</div>;

  if (tiers.length === 0) {
    return (
      <div style={styles.empty}>
        <span style={{ fontSize: 48 }}>Tier</span>
        <p>Chưa có tier nào</p>
      </div>
    );
  }

  const grouped = tiers.reduce((groups: Record<string, LoyaltyTierResponse[]>, tier) => {
    const fid = tier.franchiseId;
    if (!groups[fid]) groups[fid] = [];
    groups[fid].push(tier);
    return groups;
  }, {});

  return (
    <div>
      {Object.entries(grouped).map(([franchiseId, franchiseTiers]) => (
        <div key={franchiseId} style={styles.franchiseSection}>
          <div style={{ ...styles.franchiseHeader, borderBottom: "1px solid #e6e8ea", marginBottom: 20 }}>
            <span style={styles.franchiseIcon}>Store</span>
            <h3 style={styles.franchiseTitle}>{getFranchiseLabel(franchiseId)}</h3>
            <span style={styles.franchiseCount}>{franchiseTiers.length} tier</span>
          </div>

          <div style={styles.cardGrid}>
            {franchiseTiers.map((tier) => {
              const color = TIER_COLORS[tier.name] || TIER_COLORS.BRONZE;
              const minPoints = Number.isFinite(tier.minPoints) ? tier.minPoints : TIER_POINTS[tier.name] ?? 0;

              return (
                <div key={tier.id} style={{ ...styles.card, borderTop: `4px solid ${color.border}`, background: color.bg }}>
                  <div style={styles.cardHeader}>
                    <span style={{ ...styles.badge, background: color.badge, color: "#fff" }}>{tier.name}</span>
                    <div style={styles.cardActions}>
                      <button style={styles.btnEdit} onClick={() => onEdit(tier)}>Sửa</button>
                      <button style={styles.btnDelete} onClick={() => onDelete(tier)}>Xóa</button>
                    </div>
                  </div>

                  <div style={styles.statRow}>
                    <span style={styles.statLabel}>Min Points</span>
                    <span style={{ ...styles.statValue, color: color.badge }}>{minPoints.toLocaleString()} pts</span>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <span style={styles.statLabel}>Quyền lợi</span>
                    <p style={styles.benefitText}>{tier.benefits || "-"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
