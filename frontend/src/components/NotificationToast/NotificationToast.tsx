import { useEffect } from "react";
import "./NotificationToast.css";

export type NotificationType = "success" | "error" | "warning" | "info";

interface NotificationToastProps {
  message: string;
  type?: NotificationType;
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

const NotificationToast = ({
  message,
  type = "info",
  isOpen,
  onClose,
  duration = 3000,
}: NotificationToastProps) => {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = window.setTimeout(() => {
        onClose();
      }, duration);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [isOpen, duration, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={`notification-toast notification-${type}`} role="status">
      <p>{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="notification-close"
        aria-label="Cerrar notificación"
      >
        ×
      </button>
    </div>
  );
};

export default NotificationToast;
