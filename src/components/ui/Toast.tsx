import { useEffect, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastData {
  id: string;
  variant: ToastVariant;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const icons: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-success-400" />,
  error: <AlertCircle className="h-5 w-5 text-error-400" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning-400" />,
  info: <Info className="h-5 w-5 text-info-400" />,
};

const bgMap: Record<ToastVariant, string> = {
  success: 'border-success-500/30',
  error: 'border-error-500/30',
  warning: 'border-warning-500/30',
  info: 'border-info-500/30',
};

export function ToastItem({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`flex items-start gap-3 rounded-xl border bg-dark-surface-50 p-4 shadow-lg ${bgMap[toast.variant]} min-w-[300px] max-w-md`}
      role="alert"
    >
      {icons[toast.variant]}
      <p className="flex-1 text-sm text-gray-200">{toast.message}</p>
      <button type="button" onClick={() => onDismiss(toast.id)} className="shrink-0 text-gray-500 hover:text-gray-300 transition-colors" aria-label="Dismiss">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (variant: ToastVariant, message: string, duration?: number) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, variant, message, duration }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    toasts,
    addToast,
    dismissToast,
    success: (msg: string) => addToast('success', msg),
    error: (msg: string) => addToast('error', msg),
    warning: (msg: string) => addToast('warning', msg),
    info: (msg: string) => addToast('info', msg),
    ToastContainer: () => <ToastContainer toasts={toasts} onDismiss={dismissToast} />,
  };
}
