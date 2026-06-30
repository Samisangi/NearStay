import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Portal-based modal. Renders into document.body so it's never clipped
 * by a parent's overflow:hidden (a common bug with in-tree modals).
 *
 * Usage:
 *   <Modal isOpen={open} onClose={() => setOpen(false)} title="Confirm">
 *     ...content
 *   </Modal>
 */
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const closeButtonRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    closeButtonRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    full: 'max-w-5xl',
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-ink-900/40"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'modal-title' : undefined}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={cn(
              'relative w-full bg-paper-50 rounded-card shadow-popover p-6',
              sizeClasses[size]
            )}
          >
            <div className="flex items-center justify-between mb-4">
              {title && (
                <h3 id="modal-title" className="text-xl font-display">
                  {title}
                </h3>
              )}
              <button
                ref={closeButtonRef}
                onClick={onClose}
                aria-label="Close dialog"
                className="ml-auto rounded-full p-1.5 text-ink-500 hover:bg-paper-200 hover:text-ink-900 transition-colors focus-visible:outline-2 focus-visible:outline-teal-500"
              >
                <X size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
