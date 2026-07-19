import type { ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  children: ReactNode;
  variant?: AlertVariant;
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const config: Record<AlertVariant, { icon: ReactNode; container: string; titleColor: string; textColor: string }> = {
  info: {
    icon: <Info className="h-5 w-5 text-info-400 shrink-0" />,
    container: 'bg-info-500/5 border-info-500/20',
    titleColor: 'text-info-300',
    textColor: 'text-info-200/80',
  },
  success: {
    icon: <CheckCircle className="h-5 w-5 text-success-400 shrink-0" />,
    container: 'bg-success-500/5 border-success-500/20',
    titleColor: 'text-success-300',
    textColor: 'text-success-200/80',
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5 text-warning-400 shrink-0" />,
    container: 'bg-warning-500/5 border-warning-500/20',
    titleColor: 'text-warning-300',
    textColor: 'text-warning-200/80',
  },
  error: {
    icon: <AlertCircle className="h-5 w-5 text-error-400 shrink-0" />,
    container: 'bg-error-500/5 border-error-500/20',
    titleColor: 'text-error-300',
    textColor: 'text-error-200/80',
  },
};

export function Alert({ children, variant = 'info', title, dismissible, onDismiss, className = '' }: AlertProps) {
  const c = config[variant];
  return (
    <div className={`flex gap-3 rounded-xl border p-4 ${c.container} ${className}`} role="alert">
      {c.icon}
      <div className="flex-1 min-w-0">
        {title && <p className={`text-sm font-semibold ${c.titleColor}`}>{title}</p>}
        <div className={`text-sm ${c.textColor} ${title ? 'mt-1' : ''}`}>{children}</div>
      </div>
      {dismissible && onDismiss && (
        <button type="button" onClick={onDismiss} className="shrink-0 text-gray-500 hover:text-gray-300 transition-colors" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
