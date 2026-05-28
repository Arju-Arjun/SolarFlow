import React from "react";

function ConfirmDialog({
  open,
  title = "Confirm action",
  message = "Are you sure you want to continue?",
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="confirm-overlay">
      <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <h4 id="confirm-dialog-title">{title}</h4>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>{cancelLabel}</button>
          <button type="button" className="save-btn" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
