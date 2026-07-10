const STATUS_STYLES = {
  OPEN:        'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  RESOLVED:    'bg-green-100 text-green-700',
};

const STATUS_LABELS = {
  OPEN:        'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED:    'Resolved',
};

export default function StatusBadge({ status }) {
  const styles = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-500';
  const label  = STATUS_LABELS[status] ?? status;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}>
      {label}
    </span>
  );
}
