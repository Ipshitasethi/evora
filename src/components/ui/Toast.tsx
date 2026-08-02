import { motion, AnimatePresence } from 'framer-motion';
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });
export const useToast = () => useContext(ToastContext);

// ─── Icons per type ───────────────────────────────────────────────────────────
const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={17} className="text-emerald-500 flex-shrink-0" />,
  error:   <XCircle    size={17} className="text-coral flex-shrink-0" />,
  info:    <Info       size={17} className="text-plum/60 flex-shrink-0" />,
};

const BORDER: Record<ToastType, string> = {
  success: 'border-emerald-200',
  error:   'border-coral/30',
  info:    'border-sage/40',
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast stack */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 items-end pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg border ${BORDER[t.type]} max-w-xs`}
            >
              {ICONS[t.type]}
              <span className="text-sm text-plum/80 flex-1">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                className="text-plum/30 hover:text-plum/60 transition-colors ml-1"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
