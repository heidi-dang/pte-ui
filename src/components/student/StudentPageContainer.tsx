import type { ReactNode } from 'react';

interface StudentPageContainerProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const maxWidths = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

export function StudentPageContainer({
  children,
  title,
  subtitle,
  actions,
  maxWidth = 'xl',
  className = '',
}: StudentPageContainerProps) {
  return (
    <div className={`px-4 sm:px-6 lg:px-8 py-6 w-full ${className}`}>
      {(title || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="min-w-0">
            {title && <h1 className="text-xl sm:text-2xl font-display font-bold text-gray-100">{title}</h1>}
            {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={`w-full ${maxWidths[maxWidth]} mx-auto`}>
        {children}
      </div>
    </div>
  );
}
