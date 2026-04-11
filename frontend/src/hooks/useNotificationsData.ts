import React from 'react';
import { AppNotification } from '../types/notifications';
import { mockNotifications } from '../utils/mocks/notifications';

interface UseNotificationsDataResult {
  loading: boolean;
  notifications: AppNotification[];
  markAsRead: (id: string) => void;
  dismiss: (id: string) => void;
}

export function useNotificationsData(): UseNotificationsDataResult {
  const [loading, setLoading] = React.useState(true);
  const [notifications, setNotifications] = React.useState<AppNotification[]>(mockNotifications);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);

  const markAsRead = React.useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return {
    loading,
    notifications,
    markAsRead,
    dismiss,
  };
}
