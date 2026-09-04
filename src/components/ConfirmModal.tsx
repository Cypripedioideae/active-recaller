import React, { useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDestructive = false,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        <div className="p-6 md:p-8 space-y-4 text-center">
          <h3 id="modal-headline" className="text-xl font-bold text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {message}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 px-6 pb-6 md:px-8 md:pb-8">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
              isDestructive
                ? "bg-rose-600 hover:bg-rose-700 focus:ring-rose-500"
                : "bg-violet-600 hover:bg-violet-700 focus:ring-violet-500"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
