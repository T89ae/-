import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  type = 'danger'
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
          >
            <div className="p-8 text-center">
              <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 ${
                type === 'danger' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 
                type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                <AlertTriangle size={40} />
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{title}</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">{message}</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-4 rounded-2xl font-bold text-white transition-all shadow-lg ${
                    type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200 dark:shadow-none' : 
                    type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200 dark:shadow-none' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none'
                  }`}
                >
                  {confirmText}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  {cancelText}
                </button>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="absolute top-6 left-6 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
