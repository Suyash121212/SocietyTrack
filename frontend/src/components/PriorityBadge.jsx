const PRIORITY_STYLES = {
  LOW:    'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH:   'bg-red-100 text-red-700',
};

export default function PriorityBadge({ priority }) {
  if (!priority) return null;

  const styles = PRIORITY_STYLES[priority] ?? 'bg-gray-100 text-gray-500';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}>
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </span>
  );
}
