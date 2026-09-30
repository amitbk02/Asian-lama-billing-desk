interface SpinnerProps {
  size?: number;
  className?: string;
}

export default function Spinner({ size = 24, className = '' }: SpinnerProps) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-slate-300 border-t-sky-500 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function FullPageSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <Spinner size={40} />
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}
