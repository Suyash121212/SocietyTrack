const CONFIG = {
  OPEN:        { label: 'Open',        dot: 'bg-blue-400',   cls: 'bg-blue-50   text-blue-700   border-blue-200'   },
  IN_PROGRESS: { label: 'In Progress', dot: 'bg-amber-400',  cls: 'bg-amber-50  text-amber-700  border-amber-200'  },
  RESOLVED:    { label: 'Resolved',    dot: 'bg-green-400',  cls: 'bg-green-50  text-green-700  border-green-200'  },
  REOPENED:    { label: 'Reopened',    dot: 'bg-purple-400', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] ?? { label: status, dot: 'bg-slate-400', cls: 'bg-slate-50 text-slate-600 border-slate-200' };
  return (
    <span className={`badge ${cfg.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}
