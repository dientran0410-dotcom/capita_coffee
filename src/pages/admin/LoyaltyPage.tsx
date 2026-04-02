import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import loyaltyService from "../../services/loyaltyService";
import type {
  CreateLoyaltyTierRequest,
  LoyaltyRuleRequest,
  LoyaltyRuleResponse,
  LoyaltyTierResponse,
} from "../../types/Loyalty";
import ConfirmModal from "../../components/admin/loyalty/ConfirmModal";
import RuleModal from "../../components/admin/loyalty/RuleModal";
import RuleTab from "../../components/admin/loyalty/RuleTab";
import TierModal from "../../components/admin/loyalty/TierModal";
import TierTab from "../../components/admin/loyalty/TierTab";
import franchiseService, { extractFranchiseList } from "../../services/franchiseService";
import { loyaltyStyles as styles } from "../../components/admin/loyalty/styles";
import { useNotification } from "../../context/NotificationContext";

type FranchiseOption = {
  id: string;
  label: string;
};

function normalizeFranchiseOption(value: any): FranchiseOption | null {
  if (!value) return null;

  const id = String(
    value.franchiseId ??
      value.id ??
      value.branchId ??
      value.franchise_id ??
      value.branch_id ??
      "",
  ).trim();

  if (!id) return null;

  const name = String(
    value.franchiseName ??
      value.branchName ??
      value.name ??
      value.franchiseCode ??
      value.branchCode ??
      value.code ??
      "",
  ).trim();

  return {
    id,
    label: name || `Franchise #${id}`,
  };
}

type Tab = "tier" | "rules";

export default function LoyaltyPage() {
  const { addNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<Tab>("tier");
  const [searchTerm, setSearchTerm] = useState("");

  const [franchiseOptions, setFranchiseOptions] = useState<FranchiseOption[]>([]);
  const [franchiseLoading, setFranchiseLoading] = useState(false);
  const [franchiseError, setFranchiseError] = useState<string>("");

  const [tiers, setTiers] = useState<LoyaltyTierResponse[]>([]);
  const [tierLoading, setTierLoading] = useState(false);
  const [tierError, setTierError] = useState<string | null>(null);
  const [tierModal, setTierModal] = useState(false);
  const [editTier, setEditTier] = useState<LoyaltyTierResponse | null>(null);
  const [confirmTier, setConfirmTier] = useState<LoyaltyTierResponse | null>(null);

  const [rules, setRules] = useState<LoyaltyRuleResponse[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [ruleModal, setRuleModal] = useState(false);
  const [editRule, setEditRule] = useState<LoyaltyRuleResponse | null>(null);
  const [confirmRule, setConfirmRule] = useState<LoyaltyRuleResponse | null>(null);

  const fetchTiers = async () => {
    setTierLoading(true);
    setTierError(null);
    try {
      const response = await loyaltyService.getAllTiers();
      setTiers(Array.isArray(response) ? response : []);
    } catch (error: any) {
      setTierError(error?.message || "Loi khi tai danh sach Tier");
    } finally {
      setTierLoading(false);
    }
  };

  const fetchRules = async () => {
    setRulesLoading(true);
    setRulesError(null);
    try {
      const response = await loyaltyService.getAllRules();
      setRules(Array.isArray(response) ? response : []);
    } catch (error: any) {
      setRulesError(error?.message || "Loi khi tai danh sach Rules");
    } finally {
      setRulesLoading(false);
    }
  };

  useEffect(() => {
    fetchTiers();
  }, []);

  useEffect(() => {
    let alive = true;

    const dedupe = (options: FranchiseOption[]) => {
      const seen = new Set<string>();
      return options.filter((opt) => {
        if (!opt.id || seen.has(opt.id)) return false;
        seen.add(opt.id);
        return true;
      });
    };

    const loadFranchises = async () => {
      setFranchiseLoading(true);
      setFranchiseError("");

      try {
        let rawItems: any[] = [];

        try {
          const managerItems = await franchiseService.getManagerFranchises();
          if (Array.isArray(managerItems)) rawItems = managerItems;
        } catch {
          // ignore
        }

        if (!rawItems.length) {
          const adminRes = await franchiseService.getAdminFranchises();
          rawItems = extractFranchiseList(adminRes);
        }

        if (!rawItems.length) {
          try {
            const publicRes = await franchiseService.getPublicFranchises();
            rawItems = extractFranchiseList(publicRes);
          } catch {
            // ignore
          }
        }

        const options = dedupe(
          rawItems.map(normalizeFranchiseOption).filter(Boolean) as FranchiseOption[],
        ).sort((a, b) => a.label.localeCompare(b.label));

        if (!alive) return;
        setFranchiseOptions(options);

        if (options.length === 0) {
          setFranchiseError("Không tìm thấy franchise nào");
        }
      } catch (e) {
        if (!alive) return;
        console.error("Load franchises error", e);
        setFranchiseError("Không tải được danh sách franchise");
      } finally {
        if (alive) setFranchiseLoading(false);
      }
    };

    void loadFranchises();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (activeTab === "rules") {
      fetchRules();
    }
  }, [activeTab]);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredTiers = useMemo(() => {
    if (!normalizedSearch) return tiers;
    return tiers.filter((tier) => {
      const searchable = `${tier.name} ${tier.benefits ?? ""} ${tier.franchiseId}`.toLowerCase();
      return searchable.includes(normalizedSearch);
    });
  }, [tiers, normalizedSearch]);

  const filteredRules = useMemo(() => {
    if (!normalizedSearch) return rules;
    return rules.filter((rule) => {
      const searchable = `${rule.name ?? ""} ${rule.eventType} ${rule.franchiseId}`.toLowerCase();
      return searchable.includes(normalizedSearch);
    });
  }, [rules, normalizedSearch]);

  const handleSaveTier = async (data: CreateLoyaltyTierRequest) => {
    try {
      if (editTier) {
        await loyaltyService.updateTier(editTier.franchiseId, editTier.name, data);
        addNotification({
          type: "SUCCESS",
          title: "Cập Nhật Thành Công",
          message: `Tier ${editTier.name} đã được cập nhật`,
          source: "LoyaltyPage",
        });
      } else {
        await loyaltyService.createTier(data);
        addNotification({
          type: "SUCCESS",
          title: "Tạo Tier Thành Công",
          message: `Tier ${data.name} đã được tạo thành công`,
          source: "LoyaltyPage",
        });
      }
      await fetchTiers();
    } catch (error: any) {
      addNotification({
        type: "ERROR",
        title: "Lỗi",
        message: error?.message || "Có lỗi khi lưu tier",
        source: "LoyaltyPage",
      });
    }
  };

  const handleDeleteTier = async () => {
    if (!confirmTier) return;
    try {
      await loyaltyService.deleteTier(confirmTier.franchiseId, confirmTier.name);
      addNotification({
        type: "SUCCESS",
        title: "Xóa Thành Công",
        message: `Tier ${confirmTier.name} đã được xóa`,
        source: "LoyaltyPage",
      });
      setConfirmTier(null);
      await fetchTiers();
    } catch (error: any) {
      addNotification({
        type: "ERROR",
        title: "Lỗi",
        message: error?.message || "Có lỗi khi xóa tier",
        source: "LoyaltyPage",
      });
    }
  };

  const handleSaveRule = async (data: LoyaltyRuleRequest, franchiseId: string) => {
    try {
      if (editRule) {
        await loyaltyService.updateRule(franchiseId, editRule.eventType, data);
        addNotification({
          type: "SUCCESS",
          title: "Cập Nhật Thành Công",
          message: `Rule ${editRule.eventType} đã được cập nhật`,
          source: "LoyaltyPage",
        });
      } else {
        await loyaltyService.createRule(franchiseId, data);
        addNotification({
          type: "SUCCESS",
          title: "Tạo Rule Thành Công",
          message: `Rule ${data.name} đã được tạo thành công`,
          source: "LoyaltyPage",
        });
      }
      await fetchRules();
    } catch (error: any) {
      addNotification({
        type: "ERROR",
        title: "Lỗi",
        message: error?.message || "Có lỗi khi lưu rule",
        source: "LoyaltyPage",
      });
    }
  };

  const handleDeleteRule = async () => {
    if (!confirmRule) return;
    try {
      await loyaltyService.deleteRule(confirmRule.franchiseId, confirmRule.eventType);
      addNotification({
        type: "SUCCESS",
        title: "Xóa Thành Công",
        message: `Rule ${confirmRule.eventType} đã được xóa`,
        source: "LoyaltyPage",
      });
      setConfirmRule(null);
      await fetchRules();
    } catch (error: any) {
      addNotification({
        type: "ERROR",
        title: "Lỗi",
        message: error?.message || "Có lỗi khi xóa rule",
        source: "LoyaltyPage",
      });
    }
  };

  const franchiseLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of franchiseOptions) {
      map.set(option.id, option.label);
    }
    return map;
  }, [franchiseOptions]);

  const getFranchiseLabel = (franchiseId?: string | number | null) => {
    const id = String(franchiseId ?? "");
    if (!id) return "Franchise #N/A";
    const label = franchiseLabelMap.get(id);
    return label || `Franchise #${id}`;
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Quản Lý Loyalty</h1>
          <p style={styles.subtitle}>Quản lý cấp bậc thành viên và quy tắc tích điểm</p>
        </div>

        <button
          style={styles.primaryActionBtn}
          onClick={() => {
            if (activeTab === "tier") {
              setEditTier(null);
              setTierModal(true);
            } else {
              setEditRule(null);
              setRuleModal(true);
            }
          }}
        >
          <Plus size={16} />
          Tạo {activeTab === "tier" ? "Tier" : "Rule"} Mới
        </button>
      </div>

      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab === "tier" ? styles.tabActive : {}) }}
          onClick={() => setActiveTab("tier")}
        >
          Loyalty Tier
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === "rules" ? styles.tabActive : {}) }}
          onClick={() => setActiveTab("rules")}
        >
          Loyalty Rules
        </button>
      </div>

      <div style={styles.searchWrap}>
        <Search size={16} style={styles.searchIcon} />
        <input
          style={styles.searchInput}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={activeTab === "tier" ? "Tìm kiếm tier hoặc cửa hàng..." : "Tìm kiếm rule hoặc cửa hàng..."}
        />
      </div>

      {franchiseLoading ? (
        <div style={{ marginBottom: 12, color: "#64748b", fontSize: 13 }}>Đang tải danh sách franchise...</div>
      ) : null}
      {franchiseError ? (
        <div style={{ marginBottom: 12, color: "#b91c1c", fontSize: 13 }}>{franchiseError}</div>
      ) : null}

      {activeTab === "tier" ? (
        <TierTab
          tiers={filteredTiers}
          loading={tierLoading}
          error={tierError}
          getFranchiseLabel={getFranchiseLabel}
          onEdit={(tier) => {
            setEditTier(tier);
            setTierModal(true);
          }}
          onDelete={(tier) => setConfirmTier(tier)}
        />
      ) : (
        <RuleTab
          rules={filteredRules}
          loading={rulesLoading}
          error={rulesError}
          getFranchiseLabel={getFranchiseLabel}
          onEdit={(rule) => {
            setEditRule(rule);
            setRuleModal(true);
          }}
          onDelete={(rule) => setConfirmRule(rule)}
        />
      )}

      <TierModal
        open={tierModal}
        onClose={() => {
          setTierModal(false);
          setEditTier(null);
        }}
        onSave={handleSaveTier}
        initial={editTier}
        franchiseOptions={franchiseOptions}
        getFranchiseLabel={getFranchiseLabel}
        existingTiers={tiers}
      />

      <RuleModal
        open={ruleModal}
        onClose={() => {
          setRuleModal(false);
          setEditRule(null);
        }}
        onSave={handleSaveRule}
        initial={editRule}
        existingRules={rules}
        franchiseOptions={franchiseOptions}
        getFranchiseLabel={getFranchiseLabel}
      />

      <ConfirmModal
        open={Boolean(confirmTier)}
        message={`Ban co chac muon xoa tier ${confirmTier?.name}?`}
        onConfirm={handleDeleteTier}
        onCancel={() => setConfirmTier(null)}
      />

      <ConfirmModal
        open={Boolean(confirmRule)}
        message={`Ban co chac muon xoa rule \"${confirmRule?.eventType}\"?`}
        onConfirm={handleDeleteRule}
        onCancel={() => setConfirmRule(null)}
      />
    </div>
  );
}
