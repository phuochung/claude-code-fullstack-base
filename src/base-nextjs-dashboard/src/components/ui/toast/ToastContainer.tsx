"use client";

import { useToast, type Toast as ToastType } from "@/context/ToastContext";
import Toast from "./Toast";

export default function ToastContainer() {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none">
            <div className="pointer-events-auto">
                {toasts.map((toast: ToastType) => (
                    <div key={toast.id} className="mb-3">
                        <Toast
                            id={toast.id}
                            message={toast.message}
                            type={toast.type}
                            duration={toast.duration}
                            onClose={removeToast}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
