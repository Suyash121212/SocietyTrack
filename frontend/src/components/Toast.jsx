import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const CONFIG = {
  RESOLVED:    { Icon: CheckCircle2, cls: 'bg-green-50  border-green-200  text-green-800',  iconCls: 'text-green-500' },
  OPEN:        { Icon: Info,         cls: 'bg-blue-50   border-blue-200   text-blue-800',   iconCls: 'text-blue-500'  },
  IN_PROGRESS: { Icon: Info,         cls: 'bg-amber-50  border-amber-200  text-amber-800',  iconCls: 'text-amber-500' },
  REOPENED:    { Icon: AlertCircle,  cls: 'bg-purple-50 border-purple-200 text-purple-800', iconCls: 'text-purple-500'},
  error:       { Icon: AlertCircle,  cls: 'bg-red-50    border-red-200    text-red-800',    iconCls: 'text-red-500'   },
};

export default function Toast({ message, status, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  const { Icon, cls, iconCls } = CONFIG[status] ?? CONFIG.OPEN;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 max-w-sm w-full px-4 py-3.5 rounded-2xl border shadow-modal ${cls}`}
      role="alert"
    >
      <Icon size={18} className={`shrink-0 mt-0.5 ${iconCls}`} strokeWidth={2} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">Notification</p>
        <p className="text-xs mt-0.5 leading-relaxed opacity-80">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-0.5"
        aria-label="Dismiss"
      >
        <X size={15} strokeWidth={2.5} />
      </button>
    </motion.div>
  );
}
