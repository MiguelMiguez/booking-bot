import { useEffect, useRef, useState } from "react";
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
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }

      setShouldRender(true);
      const frame = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });

      return () => window.cancelAnimationFrame(frame);
    }

    if (shouldRender) {
      setIsVisible(false);
      hideTimerRef.current = window.setTimeout(() => {
        setShouldRender(false);
        hideTimerRef.current = null;
      }, 220);
    }

    return undefined;
  }, [isOpen, shouldRender]);

  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = window.setTimeout(() => {
        onClose();
      }, duration);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [isOpen, duration, onClose]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`notification-toast notification-${type} ${
        isVisible ? "notification-toast--open" : "notification-toast--closing"
      }`}
      role="status"
    >
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
