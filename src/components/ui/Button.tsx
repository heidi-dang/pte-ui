import { ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-surface disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'bg-dark-elevated text-gray-100 border border-dark-border hover:bg-dark-surface-100 active:bg-dark-surface-800 focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-surface disabled:opacity-50 disabled:cursor-not-allowed',
  outline:
    'bg-transparent text-primary-400 border border-primary-500 hover:bg-primary-500/10 active:bg-primary-500/20 focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-surface disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'bg-transparent text-gray-300 hover:bg-dark-elevated hover:text-gray-100 active:bg-dark-surface-100 focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-surface disabled:opacity-50 disabled:cursor-not-allowed',
  danger:
    'bg-error-600 text-white hover:bg-error-700 active:bg-error-800 focus-visible:ring-2 focus-visible:ring-error-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-surface disabled:opacity-50 disabled:cursor-not-allowed',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, icon, children, className = '', disabled, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  )
);

Button.displayName = 'Button';
