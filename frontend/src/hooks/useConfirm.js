import { useState, useCallback } from "react";
import ConfirmDialog from "../components/ConfirmDialog";

function useConfirm() {
  const [dialogState, setDialogState] = useState({
    open: false,
    title: "Confirm action",
    message: "Are you sure you want to continue?",
    confirmLabel: "Continue",
    cancelLabel: "Cancel",
    resolve: null,
  });

  const confirm = useCallback((message, options = {}) => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        title: options.title || "Confirm action",
        message: message || "Are you sure you want to continue?",
        confirmLabel: options.confirmLabel || "Continue",
        cancelLabel: options.cancelLabel || "Cancel",
        resolve,
      });
    });
  }, []);

  const handleCancel = useCallback(() => {
    setDialogState((prev) => {
      if (prev.resolve) prev.resolve(false);
      return { ...prev, open: false, resolve: null };
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setDialogState((prev) => {
      if (prev.resolve) prev.resolve(true);
      return { ...prev, open: false, resolve: null };
    });
  }, []);

  const ConfirmDialogElement = (
    <ConfirmDialog
      open={dialogState.open}
      title={dialogState.title}
      message={dialogState.message}
      confirmLabel={dialogState.confirmLabel}
      cancelLabel={dialogState.cancelLabel}
      onCancel={handleCancel}
      onConfirm={handleConfirm}
    />
  );

  return { ConfirmDialog: ConfirmDialogElement, confirm };
}

export default useConfirm;
