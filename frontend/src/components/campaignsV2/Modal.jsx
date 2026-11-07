import React, { useEffect } from "react";
import { FiX } from "react-icons/fi";

// Simple modal used by Campaigns v2 (same overlay style as the app's FileViewer / Offer Features modal).
const Modal = ({ title, onClose, footer, children, maxWidth = "max-w-2xl" }) => {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex justify-center items-start sm:items-center p-4 overflow-y-auto" onClick={onClose}>
      <div
        className={`bg-white rounded-xl shadow-md w-full ${maxWidth} flex flex-col max-h-[92vh]`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-lg">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-red-500 cursor-pointer p-1">
            <FiX size={20} />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
