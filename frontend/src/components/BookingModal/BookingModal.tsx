import { useEffect, useState } from "react";
import CloseIcon from "../../assets/icons/close.svg";
import type { NewBooking, Service } from "../../types";
import { BookingForm } from "../BookingForm/BookingForm";
import "./BookingModal.css";

interface BookingModalProps {
  open: boolean;
  services: Service[];
  isSubmitting?: boolean;
  error?: string | null;
  onSubmit: (payload: NewBooking) => Promise<void> | void;
  onClose: () => void;
}

const ANIMATION_DURATION = 260;

export const BookingModal = ({
  open,
  services,
  isSubmitting = false,
  error,
  onSubmit,
  onClose,
}: BookingModalProps) => {
  const [shouldRender, setShouldRender] = useState(open);
  const [isVisible, setIsVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      const frame = window.requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    if (shouldRender) {
      setIsVisible(false);
      const timer = window.setTimeout(() => {
        setShouldRender(false);
      }, ANIMATION_DURATION);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [open, shouldRender]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();
      if (!isSubmitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isSubmitting, onClose]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      className={`bookingModalOverlay ${
        isVisible ? "is-visible" : "is-hidden"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      aria-describedby="booking-modal-description"
    >
      <div
        className={`bookingModalCard ${isVisible ? "is-visible" : "is-hidden"}`}
      >
        <header className="bookingModalHeader">
          <div>
            <h2 id="booking-modal-title">Agregar turno manual</h2>
            <p id="booking-modal-description">
              Completa los datos del cliente, servicio y horario para
              registrarlo en el sistema.
            </p>
          </div>
          <button
            type="button"
            className="bookingModalClose"
            onClick={onClose}
            aria-label="Cerrar"
            disabled={isSubmitting}
          >
            <img
              src={CloseIcon}
              className="closeButton"
              alt=""
              aria-hidden="true"
            />
          </button>
        </header>

        <BookingForm
          services={services}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          error={error}
          className="bookingFormCard--modal"
        />
      </div>
    </div>
  );
};
