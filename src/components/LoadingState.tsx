export function LoadingState() {
  return (
    <div className="w-[380px] min-h-[520px] bg-white flex flex-col items-center justify-center gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-blue-200 rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700">Analyzing page...</p>
        <p className="text-xs text-gray-400 mt-1">Running AEO analysis</p>
      </div>
    </div>
  );
}
