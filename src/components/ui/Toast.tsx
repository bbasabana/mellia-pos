"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { createPortal } from "react-dom";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
}

export function Toast({ message, type = "success", duration = 3000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Small delay for simple enter animation
        const timer1 = setTimeout(() => setIsVisible(true), 10);
        const timer2 = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for exit animation
        }, duration);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [duration, onClose]);

    const getStyles = () => {
        switch (type) {
            case "success":
                return "bg-white border-green-500 text-green-700 shadow-green-100";
            case "error":
                return "bg-white border-red-500 text-red-700 shadow-red-100";
            case "warning":
                return "bg-white border-orange-500 text-orange-700 shadow-orange-100";
            default:
                return "bg-white border-blue-500 text-blue-700 shadow-blue-100";
        }
    };

    const getIcon = () => {
        switch (type) {
            case "success": return <CheckCircle size={20} className="text-green-500" />;
            case "error": return <AlertTriangle size={20} className="text-red-500" />;
            case "warning": return <AlertTriangle size={20} className="text-orange-500" />;
            default: return <Info size={20} className="text-blue-500" />;
        }
    };

    return createPortal(
        <div
            className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg transition-all duration-300 transform ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
                } ${getStyles()}`}
            style={{ minWidth: "300px", maxWidth: "420px" }}
        >
            <div className="shrink-0">{getIcon()}</div>
            <div className="flex-1 text-sm font-medium">{message}</div>
            <button onClick={() => setIsVisible(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
            </button>
        </div>,
        document.body
    );
}

// Simple event bus for toast
export const toastEvent = new EventTarget();

export function showToast(message: string, type: ToastType = "success") {
    const event = new CustomEvent("toast", { detail: { message, type } });
    toastEvent.dispatchEvent(event);
}

export function ToastContainer() {
    const [toasts, setToasts] = useState<{ id: number; message: string; type: ToastType }[]>([]);

    useEffect(() => {
        const handleToast = (e: any) => {
            const id = Date.now();
            setToasts((prev) => [...prev, { id, ...e.detail }]);
        };

        toastEvent.addEventListener("toast", handleToast);
        return () => toastEvent.removeEventListener("toast", handleToast);
    }, []);

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <>
            {toasts.map((t) => (
                <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
            ))}
        </>
    );
}
