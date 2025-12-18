import { useCallback, useState } from "react";
import type { ConfirmDialogTone } from "../components/ConfirmDialog";

interface ConfirmDialogState<T = unknown> {
  isOpen: boolean;
  isBusy: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: ConfirmDialogTone;
  data: T | null;
}

interface UseConfirmDialogOptions {
  defaultTitle?: string;
  defaultDescription?: string;
  defaultConfirmLabel?: string;
  defaultCancelLabel?: string;
  defaultTone?: ConfirmDialogTone;
}

interface OpenOptions<T = unknown> {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmDialogTone;
  data?: T;
}

interface UseConfirmDialogReturn<T = unknown> {
  /** Whether the dialog is currently open */
  isOpen: boolean;
  /** Whether the dialog is processing an action */
  isBusy: boolean;
  /** Dialog title */
  title: string;
  /** Dialog description */
  description: string;
  /** Confirm button label */
  confirmLabel: string;
  /** Cancel button label */
  cancelLabel: string;
  /** Dialog tone (default or danger) */
  tone: ConfirmDialogTone;
  /** Optional data associated with the current dialog */
  data: T | null;
  /** Open the dialog with optional overrides */
  open: (options?: OpenOptions<T>) => void;
  /** Close the dialog (only if not busy) */
  close: () => void;
  /** Set the busy state */
  setBusy: (busy: boolean) => void;
  /** Reset the dialog to initial closed state */
  reset: () => void;
  /** Props object to spread directly on ConfirmDialog component */
  dialogProps: {
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    cancelLabel: string;
    tone: ConfirmDialogTone;
    isBusy: boolean;
    onCancel: () => void;
  };
}

const DEFAULT_OPTIONS: Required<UseConfirmDialogOptions> = {
  defaultTitle: "Confirmar acción",
  defaultDescription: "¿Estás seguro de que deseas continuar?",
  defaultConfirmLabel: "Confirmar",
  defaultCancelLabel: "Cancelar",
  defaultTone: "default",
};

/**
 * Hook to manage ConfirmDialog state throughout the application.
 *
 * @example
 * ```tsx
 * const confirmDelete = useConfirmDialog<Booking>({
 *   defaultTitle: "Eliminar turno",
 *   defaultTone: "danger",
 * });
 *
 * const handleRequestDelete = (booking: Booking) => {
 *   confirmDelete.open({
 *     description: `¿Eliminar el turno de ${booking.name}?`,
 *     data: booking,
 *   });
 * };
 *
 * const handleConfirm = async () => {
 *   if (!confirmDelete.data) return;
 *   confirmDelete.setBusy(true);
 *   try {
 *     await deleteBooking(confirmDelete.data.id);
 *     confirmDelete.reset();
 *   } finally {
 *     confirmDelete.setBusy(false);
 *   }
 * };
 *
 * return (
 *   <ConfirmDialog
 *     {...confirmDelete.dialogProps}
 *     onConfirm={handleConfirm}
 *   />
 * );
 * ```
 */
export function useConfirmDialog<T = unknown>(
  options: UseConfirmDialogOptions = {}
): UseConfirmDialogReturn<T> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  const [state, setState] = useState<ConfirmDialogState<T>>({
    isOpen: false,
    isBusy: false,
    title: mergedOptions.defaultTitle,
    description: mergedOptions.defaultDescription,
    confirmLabel: mergedOptions.defaultConfirmLabel,
    cancelLabel: mergedOptions.defaultCancelLabel,
    tone: mergedOptions.defaultTone,
    data: null,
  });

  const open = useCallback(
    (openOptions: OpenOptions<T> = {}) => {
      setState({
        isOpen: true,
        isBusy: false,
        title: openOptions.title ?? mergedOptions.defaultTitle,
        description:
          openOptions.description ?? mergedOptions.defaultDescription,
        confirmLabel:
          openOptions.confirmLabel ?? mergedOptions.defaultConfirmLabel,
        cancelLabel:
          openOptions.cancelLabel ?? mergedOptions.defaultCancelLabel,
        tone: openOptions.tone ?? mergedOptions.defaultTone,
        data: openOptions.data ?? null,
      });
    },
    [mergedOptions]
  );

  const close = useCallback(() => {
    setState((prev) => {
      if (prev.isBusy) {
        return prev;
      }
      return { ...prev, isOpen: false };
    });
  }, []);

  const setBusy = useCallback((busy: boolean) => {
    setState((prev) => ({ ...prev, isBusy: busy }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isOpen: false,
      isBusy: false,
      title: mergedOptions.defaultTitle,
      description: mergedOptions.defaultDescription,
      confirmLabel: mergedOptions.defaultConfirmLabel,
      cancelLabel: mergedOptions.defaultCancelLabel,
      tone: mergedOptions.defaultTone,
      data: null,
    });
  }, [mergedOptions]);

  const dialogProps = {
    open: state.isOpen,
    title: state.title,
    description: state.description,
    confirmLabel: state.confirmLabel,
    cancelLabel: state.cancelLabel,
    tone: state.tone,
    isBusy: state.isBusy,
    onCancel: close,
  };

  return {
    isOpen: state.isOpen,
    isBusy: state.isBusy,
    title: state.title,
    description: state.description,
    confirmLabel: state.confirmLabel,
    cancelLabel: state.cancelLabel,
    tone: state.tone,
    data: state.data,
    open,
    close,
    setBusy,
    reset,
    dialogProps,
  };
}
