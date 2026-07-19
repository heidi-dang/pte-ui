import { InputHTMLAttributes, forwardRef } from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const checkboxId = id || `cb-${label.toLowerCase().replace(/\s+/g, '-')}`;
    return (
      <label htmlFor={checkboxId} className={`inline-flex items-center gap-2.5 cursor-pointer group ${className}`}>
        <div className="relative flex items-center justify-center">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            className="peer sr-only"
            {...props}
          />
          <div className="h-4 w-4 rounded border border-dark-border bg-dark-surface-50 transition-all duration-150 peer-checked:bg-primary-500 peer-checked:border-primary-500 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-400 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-dark-surface group-hover:border-gray-500 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" />
          <Check className="absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity duration-150 pointer-events-none" />
        </div>
        <span className="text-sm text-gray-300 peer-disabled:opacity-50">{label}</span>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
