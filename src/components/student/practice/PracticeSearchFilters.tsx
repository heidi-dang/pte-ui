import { SearchField } from '../../ui/SearchField';
import { Select } from '../../ui/Select';
import { Button } from '../../ui/Button';
import { Drawer } from '../../ui/Drawer';
import { SlidersHorizontal, X } from 'lucide-react';

export type SortOption = 'recommended' | 'recent' | 'name' | 'score';
export type SectionFilter = 'all' | 'Speaking' | 'Writing' | 'Reading' | 'Listening';

const SECTIONS = ['Speaking', 'Writing', 'Reading', 'Listening'] as const;

interface PracticeSearchFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sectionFilter: SectionFilter;
  onSectionFilterChange: (value: SectionFilter) => void;
  recommendedOnly: boolean;
  onRecommendedChange: (value: boolean) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  filterDrawerOpen: boolean;
  onFilterDrawerOpenChange: (open: boolean) => void;
}

export function PracticeSearchFilters({
  search,
  onSearchChange,
  sectionFilter,
  onSectionFilterChange,
  recommendedOnly,
  onRecommendedChange,
  sort,
  onSortChange,
  filterDrawerOpen,
  onFilterDrawerOpenChange,
}: PracticeSearchFiltersProps) {
  const hasActiveFilters = sectionFilter !== 'all' || recommendedOnly;

  const filterContent = (
    <div className="space-y-5">
      <div>
        <label className="text-sm font-medium text-gray-300 block mb-2">Skill</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onSectionFilterChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              sectionFilter === 'all'
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'bg-dark-elevated text-gray-400 border border-dark-border hover:border-gray-600'
            }`}
          >
            All
          </button>
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSectionFilterChange(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sectionFilter === s
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'bg-dark-elevated text-gray-400 border border-dark-border hover:border-gray-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-300">Recommended only</label>
          <button
            onClick={() => onRecommendedChange(!recommendedOnly)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              recommendedOnly ? 'bg-primary-500' : 'bg-dark-elevated'
            }`}
            role="switch"
            aria-checked={recommendedOnly}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform ${
                recommendedOnly ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div>
        <Select
          label="Sort by"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          options={[
            { value: 'recommended', label: 'Recommended' },
            { value: 'recent', label: 'Recent Activity' },
            { value: 'name', label: 'Name (A-Z)' },
            { value: 'score', label: 'Average Score' },
          ]}
        />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop filters */}
      <div className="hidden md:flex items-center gap-3 flex-wrap">
        <div className="w-full sm:w-64">
          <SearchField
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange('')}
          />
        </div>
        <div className="flex items-center gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSectionFilterChange(sectionFilter === s ? 'all' : s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sectionFilter === s
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'bg-dark-elevated text-gray-400 border border-dark-border hover:border-gray-600'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRecommendedChange(!recommendedOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              recommendedOnly
                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                : 'bg-dark-elevated text-gray-400 border border-dark-border hover:border-gray-600'
            }`}
          >
            Recommended
          </button>
          <Select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            options={[
              { value: 'recommended', label: 'Recommended' },
              { value: 'recent', label: 'Recent Activity' },
              { value: 'name', label: 'Name (A-Z)' },
              { value: 'score', label: 'Average Score' },
            ]}
            className="w-40"
          />
        </div>
      </div>

      {/* Mobile search + filter button */}
      <div className="flex md:hidden items-center gap-2">
        <div className="flex-1">
          <SearchField
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onClear={() => onSearchChange('')}
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onFilterDrawerOpenChange(true)}
          icon={<SlidersHorizontal className="h-4 w-4" />}
          className={hasActiveFilters ? 'ring-2 ring-primary-500/50' : ''}
        >
          Filters
        </Button>
      </div>

      {/* Active filter pill (mobile) */}
      {hasActiveFilters && (
        <div className="flex md:hidden items-center gap-2 text-xs text-gray-400">
          <span>
            {sectionFilter !== 'all' ? `Skill: ${sectionFilter}` : ''}
            {sectionFilter !== 'all' && recommendedOnly ? ' | ' : ''}
            {recommendedOnly ? 'Recommended' : ''}
          </span>
          <button
            onClick={() => {
              onSectionFilterChange('all');
              onRecommendedChange(false);
            }}
            className="text-primary-400 hover:text-primary-300 flex items-center gap-0.5"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        </div>
      )}

      {/* Mobile filter drawer */}
      <Drawer
        open={filterDrawerOpen}
        onClose={() => onFilterDrawerOpenChange(false)}
        side="bottom"
        title="Filters"
      >
        {filterContent}
      </Drawer>
    </>
  );
}
