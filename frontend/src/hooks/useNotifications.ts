import { useCallback, useRef, useState } from 'react';
import { NotificationData, NotificationType } from '@/components/ui/Notification';

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const counter = useRef(0);

  const notify = useCallback((type: NotificationType, message: string) => {
    const id = ++counter.current;
    setNotifications((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notifications,
    dismiss,
    success: (msg: string) => notify('success', msg),
    error: (msg: string) => notify('error', msg),
    info: (msg: string) => notify('info', msg),
  };
}

export type NotificationsApi = ReturnType<typeof useNotifications>;
