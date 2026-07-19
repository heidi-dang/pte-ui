import { useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

type DrawerSide = 'left' | 'right' | 'bottom';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  side?: DrawerSide;
  title?: string;
  className?: string;
}

const sideConfig: Record<DrawerSide, { initial: object; animate: object; exit: object; containerClass: string }> = {
  left: {
    initial: { x: '-100%' },
    animate: { x: 0 },
    exit: { x: '-100%' },
    containerClass: 'left-0 top-0 bottom-0 w-full max-w-sm',
  },
  right: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    containerClass: 'right-0 top-0 bottom-0 w-full max-w-sm',
  },
  bottom: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    containerClass: 'bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl',
  },
};

export function Drawer({ open, onClose, children, side = 'right', title, className = '' }: DrawerProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (open && contentRef.current) {
      const focusable = contentRef.current.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      focusable?.focus();
    }
  }, [open]);

  const config = sideConfig[side];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            ref={contentRef}
            initial={config.initial}
            animate={config.animate}
            exit={config.exit}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`absolute bg-dark-surface border border-dark-border shadow-xl overflow-y-auto ${config.containerClass} ${className}`}
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Drawer'}
          >
            {title && (
              <div className="flex items-center justify-between p-4 border-b border-dark-border">
                <h2 className="text-sm font-semibold text-gray-100">{title}</h2>
                <button type="button" onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-100 hover:bg-dark-elevated transition-colors" aria-label="Close drawer">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className={title ? '' : 'p-4'}>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
