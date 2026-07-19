import { ButtonHTMLAttributes, forwardRef } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

const iconSizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, size = 'md', children, className = '', ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={`inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-100 hover:bg-dark-elevated active:bg-dark-surface-100 focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-surface transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${sizeMap[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
);

IconButton.displayName = 'IconButton';
