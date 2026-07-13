import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';

const STATUS_COLOR = {
  OPEN:        'bg-blue-500',
  IN_PROGRESS: 'bg-amber-500',
  RESOLVED:    'bg-green-500',
  REOPENED:    'bg-purple-500',
};

export default function StatusTimeline({ history }) {
  if (!history?.length) {
    return (
      <div className="flex items-center gap-2 text-xs text-ink-faint py-2">
        <div className="h-px flex-1 bg-surface-200" />
        <span>No updates yet</span>
        <div className="h-px flex-1 bg-surface-200" />
      </div>
    );
  }

  return (
    <ol className="space-y-4">
      {history.map((entry, idx) => {
        const isSystem = entry.changedBy === 'System';
        return (
          <motion.li
            key={idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            className="flex gap-3"
          >
            {/* Timeline dot */}
            <div className="flex flex-col items-center shrink-0 mt-0.5">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-white ring-1 shadow-sm ${STATUS_COLOR[entry.newStatus] ?? 'bg-slate-400'}`}>
                {isSystem
                  ? <Bot size={11} className="text-white" strokeWidth={2.5} />
                  : <User size={11} className="text-white" strokeWidth={2.5} />
                }
              </div>
              {idx < history.length - 1 && (
                <div className="w-px flex-1 bg-surface-200 mt-1 min-h-[1.5rem]" />
              )}
            </div>

            {/* Content */}
            <div className="pb-3 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-ink">
                  {entry.oldStatus.replace('_', ' ')} → {entry.newStatus.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                {isSystem ? (
                  <span className="inline-flex items-center gap-1">
                    <Bot size={10} strokeWidth={2} />
                    System
                  </span>
                ) : entry.changedBy}
                {' · '}
                {new Date(entry.changedAt).toLocaleString('en-GB', {
                  day: '2-digit', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
              {entry.note && (
                <p className="mt-1.5 text-xs text-ink-muted bg-surface-50 border border-surface-200 rounded-lg px-3 py-2 leading-relaxed">
                  {entry.note}
                </p>
              )}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
