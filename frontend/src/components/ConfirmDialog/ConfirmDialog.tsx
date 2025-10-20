import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import "./ConfirmDialog.css";

type ConfirmDialogTone = "default" | "danger";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ANIMATION_DURATION = 220;

export const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "default",
  isBusy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const [shouldRender, setShouldRender] = useState(open);
  const [isVisible, setIsVisible] = useState(open);

  const titleId = useId();
  const descriptionId = useId();

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
      if (!isBusy) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isBusy, onCancel]);

  if (!shouldRender) {
    return null;
  }

  const overlayClass = `confirmDialogOverlay ${
    isVisible ? "is-visible" : "is-hidden"
  }`;
  const cardClass = `confirmDialogCard ${
    tone === "danger" ? "is-danger" : ""
  } ${isVisible ? "is-visible" : "is-hidden"}`;

  const content = (
    <div className={overlayClass} role="presentation">
      <div
        className={cardClass}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <header className="confirmDialogHeader">
          <h2 id={titleId}>{title}</h2>
          {description ? <p id={descriptionId}>{description}</p> : null}
        </header>

        <div className="confirmDialogActions">
          <button
            type="button"
            className="confirmDialogCancel"
            onClick={() => {
              if (!isBusy) {
                onCancel();
              }
            }}
            disabled={isBusy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="confirmDialogPrimary"
            data-tone={tone}
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
