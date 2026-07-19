import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'premium';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-dark-elevated text-gray-300 border-dark-border',
  success: 'bg-success-500/10 text-success-400 border-success-500/20',
  warning: 'bg-warning-500/10 text-warning-400 border-warning-500/20',
  error: 'bg-error-500/10 text-error-400 border-error-500/20',
  info: 'bg-info-500/10 text-info-400 border-info-500/20',
  premium: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium leading-tight ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
