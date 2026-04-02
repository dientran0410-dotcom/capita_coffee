interface DateFranchiseFilterProps {
  franchiseId: string;
  franchiseOptions: Array<{ id: string; name: string; code: string }>;
  franchiseLoading: boolean;
  startDate: string;
  endDate: string;
  loading: boolean;
  onFranchiseChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onGenerate: () => void;
}

export const DateFranchiseFilter = ({
  franchiseId,
  franchiseOptions,
  franchiseLoading,
  startDate,
  endDate,
  loading,
  onFranchiseChange,
  onStartDateChange,
  onEndDateChange,
  onGenerate,
}: DateFranchiseFilterProps) => (
  <div className="filter-container">
    <div className="filter-group">
      <label className="filter-label">
        Franchise (optional)
      </label>
      <select
        value={franchiseId}
        onChange={(e) => onFranchiseChange(e.target.value)}
        className="filter-input wide"
        disabled={franchiseLoading}
      >
        <option value="">
          {franchiseLoading ? "Loading franchises..." : "All active franchises"}
        </option>
        {franchiseOptions.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}{item.code ? ` (${item.code})` : ""}
          </option>
        ))}
      </select>
    </div>
    <div className="filter-group">
      <label className="filter-label">Start Date</label>
      <input
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="filter-input"
      />
    </div>
    <div className="filter-group">
      <label className="filter-label">End Date</label>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="filter-input"
      />
    </div>
    <button
      onClick={onGenerate}
      disabled={loading || !startDate || !endDate}
      className="btn-generate"
    >
      {loading ? "Generating..." : "Generate Report"}
    </button>
  </div>
);
