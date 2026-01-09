import { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import './NotificationToast.css';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationToastProps {
  notification: Notification | null;
  onClose: (id: string) => void;
}

const NotificationToast = ({ notification, onClose }: NotificationToastProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const duration = notification.duration || 5000;
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(notification.id), 300); // Esperar animación de salida
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle2 size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'info':
        return <Info size={20} />;
      default:
        return <Info size={20} />;
    }
  };

  return (
    <div className={`notification-toast ${notification.type} ${isVisible ? 'visible' : ''}`}>
      <div className="notification-toast-icon">
        {getIcon()}
      </div>
      <div className="notification-toast-content">
        <div className="notification-toast-message">{notification.message}</div>
      </div>
      <button
        className="notification-toast-close"
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose(notification.id), 300);
        }}
        aria-label="Cerrar notificación"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default NotificationToast;
