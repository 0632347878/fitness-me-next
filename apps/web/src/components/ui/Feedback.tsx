export function Spinner({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className={`animate-spin rounded-full border-b-2 border-indigo-600 ${className}`} />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner />
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-4xl mb-3">🏋️</p>
      <p className="font-semibold text-gray-800">{title}</p>
      {body && <p className="text-sm text-gray-500 mt-1 max-w-xs">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

