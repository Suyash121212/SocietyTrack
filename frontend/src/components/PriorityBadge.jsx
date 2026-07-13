const CONFIG = {
  LOW:    { label: 'Low',    cls: 'bg-slate-50  text-slate-600  border-slate-200'  },
  MEDIUM: { label: 'Medium', cls: 'bg-amber-50  text-amber-700  border-amber-200'  },
  HIGH:   { label: 'High',   cls: 'bg-red-50    text-red-700    border-red-200'    },
};

export default function PriorityBadge({ priority }) {
  if (!priority) return null;
  const cfg = CONFIG[priority] ?? { label: priority, cls: 'bg-slate-50 text-slate-600 border-slate-200' };
  return (
    <span className={`badge ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
