"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ToastType } from "@/components/ui/toast/Toast";
import ToastContainer from "@/components/ui/toast/ToastContainer";

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (message: string, type: ToastType, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType, duration?: number) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    }, []);

    const success = useCallback((message: string, duration?: number) => {
        showToast(message, "success", duration);
    }, [showToast]);

    const error = useCallback((message: string, duration?: number) => {
        showToast(message, "error", duration);
    }, [showToast]);

    const info = useCallback((message: string, duration?: number) => {
        showToast(message, "info", duration);
    }, [showToast]);

    const warning = useCallback((message: string, duration?: number) => {
        showToast(message, "warning", duration);
    }, [showToast]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, showToast, success, error, info, warning, removeToast }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
