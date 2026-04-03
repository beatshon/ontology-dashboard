"use client";

interface ErrorStateProps {
  title?: string;
  message?: string;
  icon?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export default function ErrorState({
  title = "불러오기 실패",
  message = "데이터를 가져오지 못했어요. 네트워크를 확인해주세요.",
  icon = "⚠️",
  onRetry,
  compact = false,
}: ErrorStateProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 py-3 px-4 bg-red-500/5 border border-red-500/10 rounded-xl">
        <span className="text-lg flex-shrink-0">{icon}</span>
        <p className="text-xs text-gray-400 flex-1">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs text-amber-400 hover:text-amber-300 transition font-medium flex-shrink-0 btn-press"
          >
            재시도
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="toss-card">
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <span className="text-3xl mb-3">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-300 mb-1">{title}</h3>
        <p className="text-xs text-gray-500 mb-4 max-w-[240px]">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 text-xs font-medium text-amber-200 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/15 transition btn-press"
          >
            다시 시도
          </button>
        )}
      </div>
    </div>
  );
}
