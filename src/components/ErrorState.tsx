interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="w-[380px] min-h-[520px] bg-white flex flex-col items-center justify-center gap-4 p-6">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
        <span className="text-red-600 text-xl">!</span>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-900">Analysis Failed</p>
        <p className="text-xs text-gray-500 mt-1">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}
