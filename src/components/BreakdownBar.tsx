interface BreakdownBarProps {
  label: string;
  value: number;
  weight: number;
  color: string;
}

export function BreakdownBar({ label, value, weight, color }: BreakdownBarProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-700 w-8 text-right">{value}</span>
      {weight > 0 && (
        <span className="text-xs text-gray-400 w-8 text-right">{weight}%</span>
      )}
    </div>
  );
}

function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
