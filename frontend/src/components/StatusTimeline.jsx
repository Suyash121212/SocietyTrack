// Vertical timeline component showing complaint status change history
export default function StatusTimeline({ history }) {
  if (!history || history.length === 0) {
    return (
      <p className="text-sm text-neutral italic">No status updates yet.</p>
    );
  }

  return (
    <ol className="relative space-y-5 ml-2">
      {history.map((entry, idx) => (
        <li key={idx} className="flex gap-4">
          {/* Dot and connector line */}
          <div className="flex flex-col items-center shrink-0">
            <span className="w-3 h-3 rounded-full bg-primary ring-4 ring-white border border-primary shrink-0 mt-0.5" />
            {idx < history.length - 1 && (
              <span className="w-px flex-1 bg-gray-200 mt-1 min-h-[1.5rem]" />
            )}
          </div>

          {/* Entry content */}
          <div className="pb-2">
            <p className="text-sm font-medium text-gray-800">
              {entry.oldStatus} → {entry.newStatus}
            </p>
            <p className="text-xs text-neutral mt-0.5">
              By {entry.changedBy} · {new Date(entry.changedAt).toLocaleString()}
            </p>
            {entry.note && (
              <p className="mt-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
                {entry.note}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
