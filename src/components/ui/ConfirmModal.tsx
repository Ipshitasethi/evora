import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  /** 'danger' uses terracotta/muted-red; 'warning' uses amber tones */
  variant?: 'danger' | 'warning';
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  variant = 'danger',
  isLoading = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const isDanger = variant === 'danger';

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-plum/30 backdrop-blur-sm z-[150]"
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-[160] flex items-center justify-center px-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl border border-sage/20 max-w-md w-full p-7 relative">
              {/* Close */}
              <button
                onClick={onCancel}
                className="absolute top-4 right-4 text-plum/30 hover:text-plum/60 transition-colors"
              >
                <X size={18} />
              </button>

              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${
                  isDanger ? 'bg-terracotta/15' : 'bg-amber-100'
                }`}
              >
                <AlertTriangle
                  size={22}
                  className={isDanger ? 'text-terracotta' : 'text-amber-500'}
                />
              </div>

              {/* Text */}
              <h3 className="font-serif text-xl text-plum mb-2">{title}</h3>
              <p className="text-sm text-plum/60 leading-relaxed mb-7">{description}</p>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-2xl text-sm font-medium text-plum/60 hover:bg-sage/20 transition-colors border border-sage/30 disabled:opacity-50"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={`px-5 py-2.5 rounded-2xl text-sm font-medium text-white transition-all disabled:opacity-60 ${
                    isDanger
                      ? 'bg-terracotta hover:bg-terracotta/90'
                      : 'bg-amber-500 hover:bg-amber-400'
                  }`}
                >
                  {isLoading ? 'Deleting…' : confirmLabel}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
