"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",     // 384px - Confirmation suppression (PETIT)
    md: "max-w-md",     // 448px - Édition rapide (MOYEN)
    lg: "max-w-xl",     // 576px - Détails (GRAND)
    xl: "max-w-2xl",    // 672px - Très grand
    "2xl": "max-w-4xl", // 896px - Extra large pour formulaires complexes
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full ${sizeClasses[size]} mx-auto p-4`}>
        <div
          className="relative bg-white rounded-lg shadow-xl transform transition-all max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body - Scrollable */}
          <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
