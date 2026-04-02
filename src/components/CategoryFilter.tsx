import { RewardCategory } from '../types/Reward';
import type { PointRange } from '../types/Reward';
import './CategoryFilter.css';

interface CategoryFilterProps {
  categories: { category: string; count: number }[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  pointRanges: PointRange[];
  selectedPointRange: PointRange | null;
  onPointRangeChange: (range: PointRange | null) => void;
}

const CategoryFilter = ({
  categories,
  selectedCategory,
  onCategoryChange,
  pointRanges,
  selectedPointRange,
  onPointRangeChange
}: CategoryFilterProps) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case RewardCategory.ALL:
        return '🎁';
      case RewardCategory.FOOD_DRINK:
        return '🍴';
      case RewardCategory.RETAIL:
        return '🛍️';
      case RewardCategory.EXPERIENCES:
        return '🎪';
      case RewardCategory.GIFT_CARDS:
        return '💳';
      default:
        return '🎁';
    }
  };

  return (
    <div className="category-filter">
      <div className="filter-section">
        <div className="filter-header">
          <h3>Categories</h3>
          <button className="clear-all-btn">Clear all</button>
        </div>
        <div className="category-list">
          {categories.map(({ category, count }) => (
            <button
              key={category}
              className={`category-item ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => onCategoryChange(category)}
            >
              <span className="category-icon">{getCategoryIcon(category)}</span>
              <span className="category-name">{category}</span>
              <span className="category-count">{count}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h3 className="filter-title">Point Range</h3>
        <div className="point-range-list">
          {pointRanges.map((range, index) => (
            <label key={index} className="point-range-item">
              <input
                type="radio"
                name="pointRange"
                checked={selectedPointRange?.label === range.label}
                onChange={() => onPointRangeChange(range)}
              />
              <span className="radio-custom"></span>
              <span className="range-label">{range.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryFilter;
