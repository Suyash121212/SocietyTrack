export default function StatusTimeline({ history }) {
  if (!history || history.length === 0) {
    return (
      <p className="text-sm text-neutral italic">No status updates yet.</p>
    );
  }

  return (
    <ol className="relative border-l border-gray-200 space-y-6 ml-3">
      {history.map((entry, idx) => (
        <li key={idx} className="ml-6">
          <span className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-4 ring-white" />
          <div className="text-sm">
            <p className="font-medium text-gray-800">
              {entry.oldStatus} → {entry.newStatus}
            </p>
            <p className="text-neutral text-xs mt-0.5">
              By {entry.changedBy} · {new Date(entry.changedAt).toLocaleString()}
            </p>
            {entry.note && (
              <p className="mt-1 text-gray-600 bg-gray-50 rounded px-2 py-1 text-xs">
                {entry.note}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
