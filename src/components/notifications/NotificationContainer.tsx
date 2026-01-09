import { useState, useCallback } from 'react';
import NotificationToast, { type Notification, type NotificationType } from './NotificationToast';
import { ulid } from 'ulid';

interface NotificationContainerProps {
  children?: React.ReactNode;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((
    message: string,
    type: NotificationType = 'info',
    duration?: number
  ) => {
    const id = `notif_${ulid()}`;
    const notification: Notification = {
      id,
      message,
      type,
      duration,
    };
    setNotifications((prev) => [...prev, notification]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notifications,
    showNotification,
    removeNotification,
  };
};

const NotificationContainer = ({ children }: NotificationContainerProps) => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <>
      {children}
      <div className="notification-container">
        {notifications.map((notification, index) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>
    </>
  );
};

export default NotificationContainer;
