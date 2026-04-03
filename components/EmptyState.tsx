"use client";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = "📭",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div
        className="text-4xl mb-4 opacity-60"
        style={{
          animation: "cardFadeIn 0.5s ease-out both",
        }}
      >
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-gray-300 mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-gray-500 max-w-[280px] leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 text-xs font-medium text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/15 transition btn-press"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
