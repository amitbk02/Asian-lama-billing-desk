interface BadgeProps {
  status: string;
}

const statusStyles: Record<string, string> = {
  OPEN: 'bg-amber-100 text-amber-800 border-amber-200',
  WIP: 'bg-sky-100 text-sky-800 border-sky-200',
  CLOSED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export default function Badge({ status }: BadgeProps) {
  const upper = status?.toUpperCase() ?? '';
  const cls =
    statusStyles[upper] ?? 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {upper}
    </span>
  );
}
