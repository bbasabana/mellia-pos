"use client";

import { AlertTriangle, X, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    loading?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirmer",
    cancelText = "Annuler",
    variant = "danger",
    loading = false
}: ConfirmationModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) setIsVisible(true);
        else setTimeout(() => setIsVisible(false), 200);
    }, [isOpen]);

    if (!isVisible) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={!loading ? onClose : undefined}
            />

            {/* Modal */}
            <div className={`relative bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden transform transition-all duration-200 ${isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}`}>

                <div className="p-6 text-center">
                    <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full mb-4 ${variant === 'danger' ? 'bg-red-100 text-red-600' :
                            variant === 'warning' ? 'bg-orange-100 text-orange-600' :
                                'bg-blue-100 text-blue-600'
                        }`}>
                        <AlertTriangle size={28} />
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                        {description}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className={`flex-1 px-4 py-2.5 text-white font-bold rounded-lg shadow-lg transition-all transform active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' :
                                    variant === 'warning' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30' :
                                        'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                                }`}
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            {confirmText}
                        </button>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    disabled={loading}
                    className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>
        </div>
    );
}
