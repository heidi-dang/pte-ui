import { InputHTMLAttributes, forwardRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ value, onClear, className = '', ...props }, ref) => (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
      <input
        ref={ref}
        type="search"
        value={value}
        className={`w-full rounded-lg border border-dark-border bg-dark-surface-50 pl-10 pr-10 py-2 text-sm text-gray-100 placeholder-gray-500 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-dark-surface disabled:opacity-50 ${className}`}
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 hover:text-gray-300"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
);

SearchField.displayName = 'SearchField';
