import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationData {
  id: number;
  type: NotificationType;
  message: string;
}

interface NotificationProps {
  notifications: NotificationData[];
  onDismiss: (id: number) => void;
}

const config = {
  success: {
    icon: CheckCircle2,
    cls: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    iconCls: 'text-emerald-500',
  },
  error: {
    icon: XCircle,
    cls: 'border-rose-200 bg-rose-50 text-rose-800',
    iconCls: 'text-rose-500',
  },
  info: {
    icon: Info,
    cls: 'border-sky-200 bg-sky-50 text-sky-800',
    iconCls: 'text-sky-500',
  },
};

function Toast({
  data,
  onDismiss,
}: {
  data: NotificationData;
  onDismiss: (id: number) => void;
}) {
  const { icon: Icon, cls, iconCls } = config[data.type];
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(data.id), 5000);
    return () => clearTimeout(timer);
  }, [data.id, onDismiss]);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${cls} animate-[slideIn_0.2s_ease-out]`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconCls}`} />
      <p className="flex-1 text-sm font-medium">{data.message}</p>
      <button
        onClick={() => onDismiss(data.id)}
        className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function NotificationContainer({
  notifications,
  onDismiss,
}: NotificationProps) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {notifications.map((n) => (
        <Toast key={n.id} data={n} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
