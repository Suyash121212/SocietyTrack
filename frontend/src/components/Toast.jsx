import { useEffect } from 'react';

const STATUS_STYLES = {
  OPEN:        'bg-gray-100 text-gray-700 border-gray-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-800 border-amber-200',
  RESOLVED:    'bg-green-50 text-green-800 border-green-200',
};

const STATUS_ICONS = {
  OPEN:        '🔵',
  IN_PROGRESS: '🟡',
  RESOLVED:    '✅',
};

export default function Toast({ message, status, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = STATUS_STYLES[status] ?? 'bg-blue-50 text-blue-800 border-blue-200';
  const icon   = STATUS_ICONS[status] ?? '🔔';

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg ${styles} max-w-xs animate-fade-in`}>
      <span className="text-lg shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Complaint Updated</p>
        <p className="text-xs mt-0.5 leading-relaxed">{message}</p>
      </div>
      <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity text-sm">✕</button>
    </div>
  );
}
